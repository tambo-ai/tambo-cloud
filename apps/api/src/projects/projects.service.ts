import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import {
  validateCustomLlmParams,
  getCustomLlmParamsSize,
  MAX_CUSTOM_LLM_PARAMS_SIZE,
  RESERVED_LLM_PARAM_KEYS,
  type CustomLlmParams,
} from "@tambo-ai-cloud/backend";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { APIKeyResponse } from "./dto/api-key-response.dto";
import {
  ProjectResponse,
  SimpleProjectResponse,
  ProjectUpdateRequest,
} from "./dto/project-response.dto";
import { ProviderKeyResponse } from "./dto/provider-key-response.dto";
import { Project } from "./entities/project.entity";

@Injectable()
export class ProjectsService {
  constructor(
    // @Inject(TRANSACTION)
    // private readonly tx: HydraTransaction,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly config: ConfigService,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  async create(createProjectDto: {
    name: string;
    userId: string;
  }): Promise<ProjectResponse> {
    if (!createProjectDto.userId) {
      throw new Error("User ID is required");
    }

    const project = await operations.createProject(this.getDb(), {
      name: createProjectDto.name || "New Project",
      userId: createProjectDto.userId,
    });

    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
      customLlmParams: {},
    };
  }

  async findAllForUser(userId: string): Promise<ProjectResponse[]> {
    const projects = await operations.getProjectsForUser(this.getDb(), userId);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId,
      defaultLlmProviderName: project.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: project.defaultLlmModelName ?? undefined,
      customLlmModelName: project.customLlmModelName ?? undefined,
      customLlmBaseURL: project.customLlmBaseURL ?? undefined,
      customInstructions: project.customInstructions ?? undefined,
      maxInputTokens: project.maxInputTokens ?? undefined,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
      agentProviderType: project.agentProviderType,
      agentName: project.agentName ?? undefined,
      agentUrl: project.agentUrl ?? undefined,
      customLlmParams: project.customLlmParams,
    }));
  }

  async findOne(id: string): Promise<ProjectResponse | undefined> {
    const project = await operations.getProject(this.getDb(), id);
    if (!project || !project.members[0]) {
      return undefined;
    }
    return {
      id: project.id,
      name: project.name,
      userId: project.members[0].userId,
      defaultLlmProviderName: project.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: project.defaultLlmModelName ?? undefined,
      customLlmModelName: project.customLlmModelName ?? undefined,
      customLlmBaseURL: project.customLlmBaseURL ?? undefined,
      customInstructions: project.customInstructions ?? undefined,
      maxInputTokens: project.maxInputTokens ?? undefined,
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
      agentProviderType: project.agentProviderType,
      agentName: project.agentName ?? undefined,
      agentUrl: project.agentUrl ?? undefined,
      customLlmParams: project.customLlmParams,
    };
  }

  async getProjectApiKeyId(projectId: string, hashedApiKey: string) {
    const apiKeyId = await operations.getProjectApiKeyId(
      this.getDb(),
      projectId,
      hashedApiKey,
    );
    return apiKeyId;
  }
  async findOneWithKeys(id: string): Promise<Project | null> {
    const project = await operations.getProjectWithKeys(this.getDb(), id);
    if (!project || !project.members[0]) {
      return null;
    }
    if (project.id !== id) {
      console.warn(
        `[ProjectsService] Use of legacy project ID ${id} for project ${project.id}`,
      );
    }

    const projectEntity = new Project();
    projectEntity.id = project.id;
    projectEntity.name = project.name;
    projectEntity.userId = project.members[0].userId;
    projectEntity.isTokenRequired = project.isTokenRequired;
    projectEntity.apiKeys = project.apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      hashedKey: apiKey.hashedKey,
      partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
      lastUsed: apiKey.lastUsedAt ?? undefined,
      created: apiKey.createdAt,
      createdByUserId: apiKey.createdByUserId,
    }));
    projectEntity.providerKeys = project.providerKeys.map((providerKey) => ({
      id: providerKey.id,
      providerName: providerKey.providerName,
      providerKeyEncrypted: providerKey.providerKeyEncrypted,
      partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
    }));
    return projectEntity;
  }

  async update(
    id: string,
    updateProjectDto: ProjectUpdateRequest,
  ): Promise<ProjectResponse | undefined> {
    // Validate custom LLM parameters if provided
    if (updateProjectDto.customLlmParams !== undefined) {
      if (!validateCustomLlmParams(updateProjectDto.customLlmParams)) {
        throw new Error("Custom LLM parameters must be a valid JSON object");
      }

      // Check size limit
      const size = getCustomLlmParamsSize(updateProjectDto.customLlmParams);
      if (size > MAX_CUSTOM_LLM_PARAMS_SIZE) {
        throw new Error(
          `Custom LLM parameters exceed size limit of ${MAX_CUSTOM_LLM_PARAMS_SIZE} bytes (current: ${size} bytes)`,
        );
      }

      // Strip reserved keys
      const cleanParams: CustomLlmParams = {};
      const strippedKeys: string[] = [];
      for (const [key, value] of Object.entries(
        updateProjectDto.customLlmParams,
      )) {
        if (RESERVED_LLM_PARAM_KEYS.has(key)) {
          strippedKeys.push(key);
        } else {
          cleanParams[key] = value;
        }
      }

      if (strippedKeys.length > 0) {
        console.warn(
          `Stripped reserved LLM parameter keys for project ${id}: ${strippedKeys.join(", ")}`,
        );
      }

      updateProjectDto.customLlmParams = cleanParams;
    }

    const updateData: any = {};
    if (updateProjectDto.name !== undefined) {
      updateData.name = updateProjectDto.name;
    }
    if (updateProjectDto.customLlmParams !== undefined) {
      updateData.customLlmParams = updateProjectDto.customLlmParams;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const updated = await operations.updateProject(
      this.getDb(),
      id,
      updateData,
    );
    if (!updated) {
      return undefined;
    }
    // Get the project with members to extract userId
    const projectWithMembers = await operations.getProject(this.getDb(), id);
    if (!projectWithMembers || !projectWithMembers.members[0]) {
      return undefined;
    }

    return {
      id: updated.id,
      name: updated.name,
      userId: projectWithMembers.members[0].userId,
      defaultLlmProviderName: updated.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: updated.defaultLlmModelName ?? undefined,
      customLlmModelName: updated.customLlmModelName ?? undefined,
      customLlmBaseURL: updated.customLlmBaseURL ?? undefined,
      customInstructions: updated.customInstructions ?? undefined,
      maxInputTokens: updated.maxInputTokens ?? undefined,
      isTokenRequired: updated.isTokenRequired,
      providerType: updated.providerType,
      agentProviderType: updated.agentProviderType,
      agentName: updated.agentName ?? undefined,
      agentUrl: updated.agentUrl ?? undefined,
      customLlmParams: updated.customLlmParams,
    };
  }

  async remove(id: string): Promise<boolean> {
    return await operations.deleteProject(this.getDb(), id);
  }

  async generateApiKey(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<string> {
    const apiKeySecret = this.config.getOrThrow("API_KEY_SECRET");
    return await operations.createApiKey(this.getDb(), apiKeySecret, {
      projectId,
      userId,
      name,
    });
  }

  async findAllApiKeys(projectId: string): Promise<APIKeyResponse[]> {
    const apiKeys = await operations.getApiKeys(this.getDb(), projectId);
    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      hashedKey: apiKey.hashedKey,
      partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
      created: apiKey.createdAt,
      lastUsed: apiKey.lastUsedAt ?? undefined,
      createdByUserId: apiKey.createdByUserId,
    }));
  }

  async updateApiKeyLastUsed(apiKeyId: string, lastUsed: Date): Promise<void> {
    await operations.updateApiKeyLastUsed(this.getDb(), {
      apiKeyId,
      lastUsed,
    });
  }

  async removeApiKey(projectId: string, apiKeyId: string): Promise<boolean> {
    return await operations.deleteApiKey(this.getDb(), projectId, apiKeyId);
  }

  async validateApiKey(
    projectId: string,
    providedApiKey: string,
  ): Promise<boolean> {
    return await operations.validateApiKey(
      this.getDb(),
      projectId,
      providedApiKey,
    );
  }

  async addProviderKey(
    projectId: string,
    providerName: string,
    providerKey: string,
    userId: string,
  ): Promise<ProjectResponse> {
    const providerKeySecret = this.config.getOrThrow("PROVIDER_KEY_SECRET");
    const result = await operations.addProviderKey(
      this.getDb(),
      providerKeySecret,
      {
        projectId,
        providerName,
        providerKey,
        userId,
      },
    );
    if (!result) {
      throw new Error("Failed to add provider key");
    }
    return {
      id: result.id,
      name: result.name,
      userId,
      defaultLlmProviderName: result.defaultLlmProviderName ?? undefined,
      defaultLlmModelName: result.defaultLlmModelName ?? undefined,
      customLlmModelName: result.customLlmModelName ?? undefined,
      customLlmBaseURL: result.customLlmBaseURL ?? undefined,
      customInstructions: result.customInstructions ?? undefined,
      maxInputTokens: result.maxInputTokens ?? undefined,
      isTokenRequired: result.isTokenRequired,
      providerType: result.providerType,
      agentProviderType: result.agentProviderType,
      agentName: result.agentName ?? undefined,
      agentUrl: result.agentUrl ?? undefined,
      customLlmParams: result.customLlmParams,
    };
  }

  async findAllProviderKeys(projectId: string): Promise<ProviderKeyResponse[]> {
    const providerKeys = await operations.getProviderKeys(
      this.getDb(),
      projectId,
    );
    return providerKeys.map((providerKey) => ({
      id: providerKey.id,
      providerName: providerKey.providerName,
      partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
      providerKeyEncrypted: providerKey.providerKeyEncrypted,
    }));
  }

  async removeProviderKey(
    projectId: string,
    providerKeyId: string,
  ): Promise<SimpleProjectResponse> {
    await operations.deleteProviderKey(this.getDb(), projectId, providerKeyId);
    const project = await this.findOneWithKeys(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
    };
  }
}
