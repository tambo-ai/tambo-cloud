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
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import {
  OAuthTokenRequestDto,
  OAuthTokenResponseDto,
} from "../common/dto/oauth-token.dto";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ApiKeyGuard, ProjectId } from "../projects/guards/apikey.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly logger: CorrelationLoggerService) {}

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard)
  @Post("oauth/token")
  @ApiOperation({
    summary: "Exchange OAuth subject token for Tambo access token",
    description:
      "Validates an OAuth subject token from providers like Google or Microsoft and returns a signed Tambo access token with the project ID as issuer.",
  })
  @ApiResponse({
    status: 201,
    description: "Access token created successfully",
    type: OAuthTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - missing or invalid subject token",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid OAuth token",
  })
  async exchangeOAuthToken(
    @Body() oauthTokenRequest: OAuthTokenRequestDto,
    @Req() request: Request,
  ): Promise<OAuthTokenResponseDto> {
    if (!request[ProjectId]) {
      throw new BadRequestException("Project ID is required");
    }

    const projectId = request[ProjectId];
    const { subjectToken } = oauthTokenRequest;

    try {
      // Decode the token without verification to get the issuer
      const [_headerB64, payloadB64] = subjectToken.split(".");
      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString(),
      );

      if (!payload.iss) {
        throw new BadRequestException("Subject token missing issuer (iss)");
      }

      // Fetch OpenID configuration
      const openidConfigUrl = `${payload.iss}/.well-known/openid-configuration`;
      this.logger.log(`Fetching OpenID configuration from: ${openidConfigUrl}`);

      const configResponse = await fetch(openidConfigUrl);
      if (!configResponse.ok) {
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

      const { payload: verifiedPayload } = await jwtVerify(subjectToken, JWKS);

      if (!verifiedPayload.sub) {
        throw new UnauthorizedException("Subject token missing subject (sub)");
      }

      // Create new token with projectId as issuer and same sub
      // TODO: Fetch signing key from database instead of using dummy value
      const signingKey = new TextEncoder().encode(`token-for-${projectId}`);

      const accessToken = await new SignJWT({
        sub: verifiedPayload.sub,
        iss: projectId,
        aud: projectId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(signingKey);

      this.logger.log(
        `OAuth token exchanged successfully for project ${projectId}`,
      );

      return {
        accessToken,
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

      throw new UnauthorizedException("Invalid OAuth subject token");
    }
  }
}
