import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/nestjs";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { APIKeyResponse } from "./dto/api-key-response.dto";
import {
  ProjectResponse,
  SimpleProjectResponse,
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
    return await Sentry.startSpan(
      {
        name: "projects.create",
        op: "projects",
        attributes: {
          userId: createProjectDto.userId,
          projectName: createProjectDto.name,
        },
      },
      async () => {
        if (!createProjectDto.userId) {
          throw new Error("User ID is required");
        }

        const project = await operations.createProject(this.getDb(), {
          name: createProjectDto.name || "New Project",
          userId: createProjectDto.userId,
        });

        // Add breadcrumb for project creation
        Sentry.addBreadcrumb({
          message: "Project created",
          category: "projects",
          level: "info",
          data: { projectId: project.id, name: project.name },
        });

        return {
          id: project.id,
          name: project.name,
          userId: project.userId,
        };
      },
    );
  }

  async findAllForUser(userId: string): Promise<ProjectResponse[]> {
    return await Sentry.startSpan(
      {
        name: "projects.findAllForUser",
        op: "db.query",
        attributes: { userId },
      },
      async () => {
        const projects = await operations.getProjectsForUser(
          this.getDb(),
          userId,
        );
        return projects.map((project) => ({
          id: project.id,
          name: project.name,
          userId,
        }));
      },
    );
  }

  async findOne(id: string): Promise<ProjectResponse | undefined> {
    return await Sentry.startSpan(
      {
        name: "projects.findOne",
        op: "db.query",
        attributes: { projectId: id },
      },
      async () => {
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
        };
      },
    );
  }

  async findOneWithKeys(id: string): Promise<Project | null> {
    return await Sentry.startSpan(
      {
        name: "projects.findOneWithKeys",
        op: "db.query",
        attributes: { projectId: id },
      },
      async () => {
        const project = await operations.getProjectWithKeys(this.getDb(), id);
        if (!project || !project.members[0]) {
          return null;
        }

        if (project.id !== id) {
          console.warn(
            `[ProjectsService] Use of legacy project ID ${id} for project ${project.id}`,
          );
          // Track legacy ID usage
          Sentry.addBreadcrumb({
            message: "Legacy project ID used",
            category: "projects",
            level: "warning",
            data: { legacyId: id, actualId: project.id },
          });
        }

        const projectEntity = new Project();
        projectEntity.id = project.id;
        projectEntity.name = project.name;
        projectEntity.userId = project.members[0].userId;
        projectEntity.apiKeys = project.apiKeys.map((apiKey) => ({
          id: apiKey.id,
          name: apiKey.name,
          hashedKey: apiKey.hashedKey,
          partiallyHiddenKey: apiKey.partiallyHiddenKey ?? undefined,
          lastUsed: apiKey.lastUsedAt ?? undefined,
          created: apiKey.createdAt,
          createdByUserId: apiKey.createdByUserId,
        }));
        projectEntity.providerKeys = project.providerKeys.map(
          (providerKey) => ({
            id: providerKey.id,
            providerName: providerKey.providerName,
            providerKeyEncrypted: providerKey.providerKeyEncrypted,
            partiallyHiddenKey: providerKey.partiallyHiddenKey ?? undefined,
          }),
        );

        // Track key counts for monitoring
        Sentry.setContext("project_keys", {
          apiKeyCount: projectEntity.apiKeys.length,
          providerKeyCount: projectEntity.providerKeys.length,
        });

        return projectEntity;
      },
    );
  }

  async update(
    id: string,
    updateProjectDto: {
      name: string;
      userId: string;
    },
  ): Promise<ProjectResponse | undefined> {
    return await Sentry.startSpan(
      {
        name: "projects.update",
        op: "db.update",
        attributes: { projectId: id },
      },
      async () => {
        if (!updateProjectDto.name) {
          throw new Error("Project name is required");
        }

        const updated = await operations.updateProject(this.getDb(), id, {
          name: updateProjectDto.name,
        });

        if (!updated) {
          return undefined;
        }

        Sentry.addBreadcrumb({
          message: "Project updated",
          category: "projects",
          level: "info",
          data: { projectId: id, newName: updateProjectDto.name },
        });

        return {
          id: updated.id,
          name: updated.name,
          userId: updateProjectDto.userId,
        };
      },
    );
  }

  async remove(id: string): Promise<boolean> {
    return await Sentry.startSpan(
      {
        name: "projects.remove",
        op: "db.delete",
        attributes: { projectId: id },
      },
      async () => {
        const result = await operations.deleteProject(this.getDb(), id);

        if (result) {
          Sentry.addBreadcrumb({
            message: "Project deleted",
            category: "projects",
            level: "info",
            data: { projectId: id },
          });
        }

        return result;
      },
    );
  }

  async generateApiKey(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<string> {
    return await Sentry.startSpan(
      {
        name: "projects.generateApiKey",
        op: "security.apikey",
        attributes: { projectId, userId, keyName: name },
      },
      async () => {
        try {
          const apiKeySecret = this.config.getOrThrow("API_KEY_SECRET");
          const apiKey = await operations.createApiKey(
            this.getDb(),
            apiKeySecret,
            {
              projectId,
              userId,
              name,
            },
          );

          // Track API key generation
          Sentry.addBreadcrumb({
            message: "API key generated",
            category: "security",
            level: "info",
            data: { projectId, keyName: name },
          });

          return apiKey;
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              operation: "generateApiKey",
              projectId,
            },
          });
          throw error;
        }
      },
    );
  }

  async findAllApiKeys(projectId: string): Promise<APIKeyResponse[]> {
    return await Sentry.startSpan(
      {
        name: "projects.findAllApiKeys",
        op: "db.query",
        attributes: { projectId },
      },
      async () => {
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
      },
    );
  }

  async updateApiKeyLastUsed(
    projectId: string,
    hashedKey: string,
    lastUsed: Date,
  ): Promise<void> {
    await operations.updateApiKeyLastUsed(this.getDb(), {
      projectId,
      hashedKey,
      lastUsed,
    });
  }

  async removeApiKey(projectId: string, apiKeyId: string): Promise<boolean> {
    return await Sentry.startSpan(
      {
        name: "projects.removeApiKey",
        op: "security.apikey",
        attributes: { projectId, apiKeyId },
      },
      async () => {
        const result = await operations.deleteApiKey(
          this.getDb(),
          projectId,
          apiKeyId,
        );

        if (result) {
          Sentry.addBreadcrumb({
            message: "API key removed",
            category: "security",
            level: "info",
            data: { projectId, apiKeyId },
          });
        }

        return result;
      },
    );
  }

  async validateApiKey(
    projectId: string,
    providedApiKey: string,
  ): Promise<boolean> {
    return await Sentry.startSpan(
      {
        name: "projects.validateApiKey",
        op: "security.validation",
        attributes: { projectId },
      },
      async () => {
        const isValid = await operations.validateApiKey(
          this.getDb(),
          projectId,
          providedApiKey,
        );

        if (!isValid) {
          // Track failed validations for security monitoring
          Sentry.addBreadcrumb({
            message: "API key validation failed",
            category: "security",
            level: "warning",
            data: { projectId },
          });
        }

        return isValid;
      },
    );
  }

  async addProviderKey(
    projectId: string,
    providerName: string,
    providerKey: string,
    userId: string,
  ): Promise<ProjectResponse> {
    return await Sentry.startSpan(
      {
        name: "projects.addProviderKey",
        op: "security.providerkey",
        attributes: { projectId, providerName, userId },
      },
      async () => {
        try {
          const providerKeySecret = this.config.getOrThrow(
            "PROVIDER_KEY_SECRET",
          );
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

          // Track provider key addition
          Sentry.addBreadcrumb({
            message: "Provider key added",
            category: "security",
            level: "info",
            data: { projectId, providerName },
          });

          return {
            id: result.id,
            name: result.name,
            userId,
          };
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              operation: "addProviderKey",
              projectId,
              providerName,
            },
          });
          throw error;
        }
      },
    );
  }

  async findAllProviderKeys(projectId: string): Promise<ProviderKeyResponse[]> {
    return await Sentry.startSpan(
      {
        name: "projects.findAllProviderKeys",
        op: "db.query",
        attributes: { projectId },
      },
      async () => {
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
      },
    );
  }

  async removeProviderKey(
    projectId: string,
    providerKeyId: string,
  ): Promise<SimpleProjectResponse> {
    return await Sentry.startSpan(
      {
        name: "projects.removeProviderKey",
        op: "security.providerkey",
        attributes: { projectId, providerKeyId },
      },
      async () => {
        await operations.deleteProviderKey(
          this.getDb(),
          projectId,
          providerKeyId,
        );

        const project = await this.findOneWithKeys(projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        Sentry.addBreadcrumb({
          message: "Provider key removed",
          category: "security",
          level: "info",
          data: { projectId, providerKeyId },
        });

        return {
          id: project.id,
          name: project.name,
        };
      },
    );
  }
}
