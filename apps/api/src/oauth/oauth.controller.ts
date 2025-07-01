import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { Request } from "express";
import {
  createRemoteJWKSet,
  decodeJwt,
  importJWK,
  JWTPayload,
  jwtVerify,
  SignJWT,
} from "jose";
import {
  OAuthTokenRequestDto,
  OAuthTokenResponseDto,
} from "../common/dto/oauth-token.dto";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ApiKeyGuard, ProjectId } from "../projects/guards/apikey.guard";

/**
 * Validates and verifies an OAuth subject token based on the configured validation mode
 */
async function validateSubjectToken(
  subjectToken: string,
  validationMode: OAuthValidationMode,
  oauthSettings: {
    secretKeyEncrypted?: string | null;
    publicKey?: string | null;
  } | null,
  logger: CorrelationLoggerService,
): Promise<JWTPayload> {
  switch (validationMode) {
    case OAuthValidationMode.NONE:
      return await decodeJwt(subjectToken);

    case OAuthValidationMode.SYMMETRIC: {
      if (!oauthSettings?.secretKeyEncrypted) {
        throw new UnauthorizedException(
          "OAuth symmetric validation configured but no secret key found",
        );
      }

      const secretKey = operations.decryptOAuthSecretKey(
        oauthSettings.secretKeyEncrypted,
        process.env.API_KEY_SECRET!,
      );

      const symmetricKey = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(subjectToken, symmetricKey);
      return payload;
    }

    case OAuthValidationMode.ASYMMETRIC_MANUAL: {
      if (!oauthSettings?.publicKey) {
        throw new UnauthorizedException(
          "OAuth asymmetric manual validation configured but no public key found",
        );
      }

      try {
        // Parse the public key (assuming it's in JWK format)
        const publicKeyJWK = JSON.parse(oauthSettings.publicKey);
        const publicKey = await importJWK(publicKeyJWK);
        const { payload } = await jwtVerify(subjectToken, publicKey);
        return payload;
      } catch (error) {
        logger.error(`Error parsing or using manual public key: ${error}`);
        throw new UnauthorizedException("Invalid public key configuration");
      }
    }

    case OAuthValidationMode.ASYMMETRIC_AUTO: {
      const payload = decodeJwt(subjectToken);

      if (!payload.iss) {
        throw new BadRequestException("Subject token missing issuer (iss)");
      }

      // Fetch OpenID configuration
      const openidConfigUrl = `${payload.iss}/.well-known/openid-configuration`;
      logger.log(`Fetching OpenID configuration from: ${openidConfigUrl}`);

      const configResponse = await fetch(openidConfigUrl);
      if (!configResponse.ok) {
        logger.error(
          `Failed to fetch OpenID configuration: ${configResponse.statusText}`,
        );
        throw new UnauthorizedException(
          `Failed to fetch OpenID configuration: ${configResponse.statusText}`,
        );
      }

      const openidConfig = await configResponse.json();
      if (!openidConfig.jwks_uri) {
        throw new UnauthorizedException(
          "OpenID configuration missing jwks_uri",
        );
      }

      // Create JWKS and verify the token
      const JWKS = createRemoteJWKSet(new URL(openidConfig.jwks_uri));
      const { payload: verifiedPayload } = await jwtVerify(subjectToken, JWKS, {
        issuer: payload.iss,
      });

      return verifiedPayload;
    }

    default:
      throw new UnauthorizedException(
        `Unsupported OAuth validation mode: ${validationMode}`,
      );
  }
}

@ApiTags("OAuth")
@Controller("oauth")
export class OAuthController {
  constructor(private readonly logger: CorrelationLoggerService) {}

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard)
  @Post("token")
  @ApiConsumes("application/x-www-form-urlencoded")
  @ApiOperation({
    summary: "OAuth 2.0 Token Exchange Endpoint",
    description:
      "Exchanges an OAuth subject token for a Tambo access token following RFC 6749 and RFC 8693 specifications. Accepts form-encoded data and validates the subject token based on project OAuth validation settings.",
  })
  @ApiResponse({
    status: 200,
    description: "Token exchange successful",
    type: OAuthTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid grant type or missing parameters",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid OAuth token",
  })
  async exchangeOAuthToken(
    @Body() tokenRequest: OAuthTokenRequestDto,
    @Req() request: Request,
  ): Promise<OAuthTokenResponseDto> {
    if (!request[ProjectId]) {
      throw new BadRequestException("Project ID is required");
    }

    const projectId = request[ProjectId];
    const { grant_type, subject_token, subject_token_type } = tokenRequest;

    // Validate grant type per RFC 8693
    if (grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange") {
      throw new BadRequestException(
        "Invalid grant_type. Must be 'urn:ietf:params:oauth:grant-type:token-exchange'",
      );
    }

    // Validate subject token type
    const validTokenTypes = [
      "urn:ietf:params:oauth:token-type:access_token",
      "urn:ietf:params:oauth:token-type:id_token",
    ];
    if (!validTokenTypes.includes(subject_token_type)) {
      throw new BadRequestException(
        `Invalid subject_token_type. Must be one of: ${validTokenTypes.join(", ")}`,
      );
    }

    try {
      // Get OAuth validation settings for this project
      const db = getDb(process.env.DATABASE_URL!);
      const oauthSettings = await operations.getOAuthValidationSettings(
        db,
        projectId,
      );

      if (!oauthSettings) {
        this.logger.log(
          `No OAuth settings found for project ${projectId}, using default (none)`,
        );
      }

      const validationMode = oauthSettings?.mode || OAuthValidationMode.NONE;

      // Validate the subject token based on the configured mode
      const verifiedPayload = await validateSubjectToken(
        subject_token,
        validationMode,
        oauthSettings,
        this.logger,
      );

      if (!verifiedPayload.sub) {
        throw new UnauthorizedException("Subject token missing subject (sub)");
      }

      // Create new token with projectId as issuer and same sub
      // TODO: Use project-specific signing key from database
      const signingKey = new TextEncoder().encode(`token-for-${projectId}`);

      const expiresIn = 3600; // 1 hour
      const currentTime = Math.floor(Date.now() / 1000);

      const accessToken = await new SignJWT({
        sub: verifiedPayload.sub,
        iss: projectId,
        aud: "tambo",
        iat: currentTime,
        exp: currentTime + expiresIn,
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(signingKey);

      return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        issued_token_type: "urn:ietf:params:oauth:token-type:access_token",
      };
    } catch (error: any) {
      this.logger.error(
        `Error validating OAuth token: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException("Invalid OAuth subject token", {
        cause: error,
      });
    }
  }
}
