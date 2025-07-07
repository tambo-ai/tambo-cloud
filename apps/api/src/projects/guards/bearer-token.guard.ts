import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { decodeJwt, jwtVerify } from "jose";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectId } from "./apikey.guard";

/**
 * This is the symbol used to store the context key that the current request is
 * authorized for. It is set by the BearerTokenGuard when an OAuth token is provided.
 */
export const ContextKey = Symbol("contextKey");

declare module "express" {
  interface Request {
    [ContextKey]?: string;
  }
}

/**
 * This guard validates OAuth bearer tokens and extracts the projectId and contextKey.
 * If no Authorization header is present, it does nothing (allows the request to continue).
 * If a bearer token is present, it validates the token and extracts:
 * - projectId from the 'iss' claim
 * - contextKey from the 'sub' claim (formatted as 'oauth:user:${sub}')
 */
@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(private readonly logger: CorrelationLoggerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no Authorization header, allow the request to continue
    if (!authHeader) {
      return true;
    }

    // Extract bearer token
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      this.logger.error("Invalid Authorization header format");
      throw new UnauthorizedException("Invalid Authorization header format");
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      // Decode the token without verification to get the issuer (projectId)
      const payload = decodeJwt(token);

      if (!payload.iss || !payload.sub) {
        this.logger.error("Bearer token missing required claims (iss or sub)");
        throw new UnauthorizedException(
          "Bearer token missing required claims (iss or sub)",
        );
      }

      const projectId = payload.iss;

      // Verify the token using the same dummy signing key pattern from oauth.controller.ts
      const signingKey = new TextEncoder().encode(`token-for-${projectId}`);

      // Validate both issuer and audience claims during verification
      const { payload: verifiedPayload } = await jwtVerify(token, signingKey, {
        issuer: projectId,
        audience: "tambo",
      });

      if (!verifiedPayload.sub || !verifiedPayload.iss) {
        this.logger.error("Verified token missing required claims");
        throw new UnauthorizedException(
          "Verified token missing required claims",
        );
      }

      // Set the projectId and contextKey on the request
      request[ProjectId] = verifiedPayload.iss;

      // Create a unique context key using both the original issuer and subject
      // to prevent cross-provider user ID collisions
      //
      // Context key formats:
      // - Google consumer: oauth:user:accounts.google.com:${sub}
      // - Google Workspace: oauth:user:accounts.google.com:${hd}:${sub}
      // - Other providers: oauth:user:${hostname}:${sub}
      // - Legacy fallback: oauth:user:${sub}
      const originalIssuer = verifiedPayload.original_iss;
      const originalHostedDomain = verifiedPayload.original_hd; // Google Workspace domain
      let contextKey: string;

      if (originalIssuer && typeof originalIssuer === "string") {
        // Use proper URL parsing to extract hostname
        let issuerHostname: string;
        try {
          issuerHostname = new URL(originalIssuer).hostname;
        } catch {
          // Fallback to legacy format if URL parsing fails
          contextKey = `oauth:user:${verifiedPayload.sub}`;
          request[ContextKey] = contextKey;
          this.logger.log(
            `Valid OAuth bearer token used for project ${verifiedPayload.iss} with context ${contextKey}`,
          );
          return true;
        }

        // Handle Google Workspace vs consumer accounts
        if (
          issuerHostname === "accounts.google.com" &&
          originalHostedDomain &&
          typeof originalHostedDomain === "string"
        ) {
          // Google Workspace account: include hosted domain to distinguish from consumer accounts
          // and to distinguish between different workspace domains
          contextKey = `oauth:user:${issuerHostname}:${originalHostedDomain}:${verifiedPayload.sub}`;
        } else {
          // Regular provider (including Google consumer accounts)
          contextKey = `oauth:user:${issuerHostname}:${verifiedPayload.sub}`;
        }
      } else {
        // Fallback to legacy format if original_iss is not available
        contextKey = `oauth:user:${verifiedPayload.sub}`;
      }

      request[ContextKey] = contextKey;

      this.logger.log(
        `Valid OAuth bearer token used for project ${verifiedPayload.iss} with context ${contextKey}`,
      );

      return true;
    } catch (error: any) {
      this.logger.error(
        `Error validating OAuth bearer token: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException("Invalid bearer token");
    }
  }
}
