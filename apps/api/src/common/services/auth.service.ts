import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type McpAccessTokenPayload } from "@tambo-ai-cloud/core";
import { HydraDatabase, operations } from "@tambo-ai-cloud/db";
import * as jwt from "jsonwebtoken";
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
   */
  async generateMcpAccessToken(
    projectId: string,
    threadId: string,
  ): Promise<string> {
    const secret = this.configService.get<string>("API_KEY_SECRET");
    if (!secret) {
      throw new Error("API_KEY_SECRET is not configured");
    }
    const thread = await operations.getThreadForProjectId(
      this.getDb(),
      threadId,
      projectId,
    );
    if (!thread) {
      throw new Error("Thread not found");
    }
    const contextKey = thread.contextKey;

    const payload: McpAccessTokenPayload = {
      sub: `${projectId}:${contextKey}`,
      projectId,
      threadId: threadId,
      contextKey,
    };

    return jwt.sign(payload, secret, {
      expiresIn: "15m", // 15 minutes
    });
  }

  /**
   * Verifies and decodes an MCP access token
   */
  verifyMcpAccessToken(token: string): McpAccessTokenPayload {
    const secret = this.configService.get<string>("API_KEY_SECRET");

    if (!secret) {
      throw new Error("API_KEY_SECRET is not configured");
    }

    return jwt.verify(token, secret) as McpAccessTokenPayload;
  }
}
