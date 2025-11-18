import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { operations } from "@tambo-ai-cloud/db";
import { Request } from "express";
import { AppService } from "./app.service";
import {
  CreateMcpAccessTokenDto,
  McpAccessTokenResponseDto,
  RefreshMcpAccessTokenDto,
} from "./common/dto/mcp-access-token.dto";
import { AuthService } from "./common/services/auth.service";
import { extractContextInfo } from "./common/utils/extract-context-info";
import { extractAndVerifyMcpAccessToken } from "./common/utils/oauth";
import { ApiKeyGuard } from "./projects/guards/apikey.guard";
import { BearerTokenGuard } from "./projects/guards/bearer-token.guard";

@ApiTags("Auth")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  async checkHealth() {
    const health = await this.appService.checkHealth();
    return {
      ...health,
      timestamp: new Date().toISOString(),
      sentry: {
        enabled: !!process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
      },
    };
  }

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard, BearerTokenGuard)
  @Post("auth/mcp-access-token")
  @ApiOperation({
    summary: "Create an MCP access token",
    description:
      "Creates a JWT MCP access token using the project ID from the API key and a context key. The token expires in 15 minutes and can be used as a bearer token.",
  })
  @ApiResponse({
    status: 201,
    description: "MCP access token created successfully",
    type: McpAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid authentication context or API key",
  })
  async createMcpAccessToken(
    @Body() createMcpAccessTokenDto: CreateMcpAccessTokenDto,
    @Req() request: Request,
  ): Promise<McpAccessTokenResponseDto> {
    const { projectId } = extractContextInfo(
      request,
      createMcpAccessTokenDto.contextKey,
    );

    const { threadId } = createMcpAccessTokenDto;

    // Lightweight ownership check: ensure the thread exists for this project
    const thread = await operations.getThreadForProjectId(
      this.authService.getDb(),
      threadId,
      projectId,
    );
    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    // Only generate MCP access token if project has MCP servers configured
    const hasMcpServers = await operations.projectHasMcpServers(
      this.authService.getDb(),
      projectId,
    );
    const mcpAccessToken = hasMcpServers
      ? await this.authService.generateMcpAccessToken(projectId, threadId)
      : undefined;

    return {
      ...(mcpAccessToken && { mcpAccessToken }),
    };
  }

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard, BearerTokenGuard)
  @Post("auth/mcp-access-token/refresh")
  @ApiOperation({
    summary: "Refresh an MCP access token",
    description:
      "Refreshes an existing thread-bound MCP access token. The old token must still be valid (not expired). Returns a new token with the same threadId and a fresh 15-minute expiration.",
  })
  @ApiResponse({
    status: 201,
    description: "MCP access token refreshed successfully",
    type: McpAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid or expired token",
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found or does not belong to project",
  })
  async refreshMcpAccessToken(
    @Body() dto: RefreshMcpAccessTokenDto,
    @Req() request: Request,
  ): Promise<McpAccessTokenResponseDto> {
    const { projectId } = extractContextInfo(request, undefined);

    // Verify and extract the old token
    const secret = process.env.API_KEY_SECRET;
    if (!secret) {
      throw new Error("API_KEY_SECRET is not configured");
    }

    const payload = await extractAndVerifyMcpAccessToken(
      dto.mcpAccessToken,
      secret,
    );

    // Extract claim - must be thread-bound token
    const claim = payload["https://api.tambo.co/mcp"] as
      | { projectId?: string; threadId?: string; contextKey?: string }
      | undefined;

    if (!claim?.threadId) {
      throw new NotFoundException(
        "Token must be a thread-bound token (not session-less)",
      );
    }

    const { threadId } = claim;

    // Verify the token's projectId matches the authenticated project
    if (claim.projectId !== projectId) {
      throw new NotFoundException("Token does not belong to this project");
    }

    // Verify thread still exists and belongs to project
    const thread = await operations.getThreadForProjectId(
      this.authService.getDb(),
      threadId,
      projectId,
    );
    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    // Only generate MCP access token if project has MCP servers configured
    const hasMcpServers = await operations.projectHasMcpServers(
      this.authService.getDb(),
      projectId,
    );
    const mcpAccessToken = hasMcpServers
      ? await this.authService.generateMcpAccessToken(projectId, threadId)
      : undefined;

    return {
      ...(mcpAccessToken && { mcpAccessToken }),
    };
  }

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard, BearerTokenGuard)
  @Post("auth/mcp-access-token/sessionless")
  @ApiOperation({
    summary: "Create a session-less MCP access token",
    description:
      "Creates a JWT MCP access token that is not tied to a specific thread. This token can only be used to access resources and prompts, not session-specific features like elicitation or sampling. The contextKey is derived from the Bearer token. The token expires in 15 minutes.",
  })
  @ApiResponse({
    status: 201,
    description: "Session-less MCP access token created successfully",
    type: McpAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid authentication context",
  })
  async createSessionlessMcpAccessToken(
    @Req() request: Request,
  ): Promise<McpAccessTokenResponseDto> {
    const { projectId, contextKey } = extractContextInfo(request, undefined);

    if (!contextKey) {
      throw new NotFoundException(
        "Context key is required (must use Bearer token authentication)",
      );
    }

    // Only generate MCP access token if project has MCP servers configured
    const hasMcpServers = await operations.projectHasMcpServers(
      this.authService.getDb(),
      projectId,
    );
    const mcpAccessToken = hasMcpServers
      ? await this.authService.generateSessionlessMcpAccessToken(
          projectId,
          contextKey,
        )
      : undefined;

    return {
      ...(mcpAccessToken && { mcpAccessToken }),
    };
  }
}
