import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { operations } from "@tambo-ai-cloud/db";
import {
  JWTPayload,
  createRemoteJWKSet,
  decodeJwt,
  importJWK,
  jwtVerify,
} from "jose";
import { CorrelationLoggerService } from "src/common/services/logger.service";

/**
 * Validates and verifies an OAuth subject token based on the configured validation mode
 */
export async function validateSubjectToken(
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
