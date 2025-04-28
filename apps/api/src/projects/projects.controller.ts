import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiSecurity } from "@nestjs/swagger";
import { Request } from "express";
import { ProjectResponse } from "./dto/project-response.dto";
import { ApiKeyGuard, ProjectId } from "./guards/apikey.guard";
import { ProjectAccessOwnGuard } from "./guards/project-access-own.guard";
import { ProjectsService } from "./projects.service";

@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
// @UseInterceptors(TransactionInterceptor)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getCurrentProject(@Req() request: Request) {
    if (!request[ProjectId]) {
      throw new BadRequestException("Project ID is required");
    }
    const result = await this.projectsService.findOne(request[ProjectId]);
    return result;
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<ProjectResponse | undefined> {
    const project = await await this.projectsService.findOne(id);
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    return project;
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<boolean> {
    return await this.projectsService.remove(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(":id/api-keys")
  async findAllApiKeys(@Param("id") id: string) {
    return await this.projectsService.findAllApiKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(":id/api-key/:apiKeyId")
  async removeApiKey(
    @Param("id") id: string,
    @Param("apiKeyId") apiKeyId: string,
  ) {
    return await this.projectsService.removeApiKey(id, apiKeyId);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Get(":id/provider-keys")
  async findAllProviderKeys(@Param("id") id: string) {
    return await this.projectsService.findAllProviderKeys(id);
  }

  @UseGuards(ProjectAccessOwnGuard)
  @Delete(":id/provider-key/:providerKeyId")
  async removeProviderKey(
    @Param("id") id: string,
    @Param("providerKeyId") providerKeyId: string,
  ): Promise<ProjectResponse> {
    return await this.projectsService.removeProviderKey(id, providerKeyId);
  }
}
