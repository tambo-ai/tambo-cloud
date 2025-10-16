import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "@tambo-ai-cloud/core";
import { HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { SignJWT } from "jose";
import { DATABASE } from "../middleware/db-transaction-middleware";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  /**
   * Generates an MCP access token (JWT) that includes projectId and contextKey
   * with a 15-minute expiry
   *
   * Only pass in the knownContextKey if you have already resolved the contextKey,
   * otherwise the thread will be fetched from the database from the threadId.
   */
  async generateMcpAccessToken(
    projectId: string,
    threadId: string,
    knownContextKey?: string | null,
  ): Promise<string> {
    const secret = this.configService.get<string>("API_KEY_SECRET");
    if (!secret) {
      throw new Error("API_KEY_SECRET is not configured");
    }
    let contextKey = knownContextKey;
    if (!contextKey) {
      const thread = await operations.getThreadForProjectId(
        this.getDb(),
        threadId,
        projectId,
      );
      if (!thread) {
        throw new Error("Thread not found");
      }
      contextKey = thread.contextKey;
    }

    // https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4
    // For our purposes we round down to the nearest 5 minutes, then add 20 minutes. This makes sure
    // if we keep signing, we'll keep generating the same token for each 5
    // minute interval, and it will be good for at least 15 minutes
    const expiration =
      Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000) +
      15 * 60 * 1000;
    const expSeconds = Math.floor(expiration / 1000);

    // TODO: use a per-project, maybe per-thread, signing secret?
    const signedJwt = await new SignJWT({
      [TAMBO_MCP_ACCESS_KEY_CLAIM]: {
        projectId,
        threadId,
      },
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(projectId)
      .setSubject(`${projectId}:${threadId}`)
      .setIssuedAt()
      .setExpirationTime(expSeconds)
      .sign(new TextEncoder().encode(secret));
    return signedJwt;
  }
}
