import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import mimeTypes from "mime-types";
import { Request } from "express";
import * as aiServiceInterface from "../ai/interfaces/ai.service.interface";
import { StorageService } from "../common/services/storage.service";
import { extractContextInfo } from "../common/utils/extract-context-info";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { ExtractComponentResponseDto } from "./dto/extract-component-response.dto";
import { ExtractComponentDto } from "./dto/extract-component.dto";
import { ExtractPdfResponseDto } from "./dto/extract-pdf-response.dto";
import { ExtractPdfDto } from "./dto/extract-pdf.dto";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

const SUPPORTED_APPLICATION_TYPES = new Set(["application/pdf"]);

const SUPPORTED_TYPE_DESCRIPTION =
  "PDF, plain text, Markdown, CSV, JPEG, and PNG files";

@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
@Controller("extract")
export class ExtractorController {
  private readonly MAX_FILE_SIZE_MB = 50;

  constructor(
    @Inject("AIService")
    private aiService: aiServiceInterface.AIServiceInterface,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  async extractComponent(
    @Body() extractComponentDto: ExtractComponentDto,
  ): Promise<ExtractComponentResponseDto[]> {
    return await this.aiService.extractComponentDefinitions(
      extractComponentDto.content ?? "",
    );
  }

  @Post("pdf")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ExtractPdfDto })
  @ApiOperation({
    summary: "Upload file to storage",
    description:
      "Upload a file (PDF, TXT, MD, CSV, JPG, PNG) to Supabase Storage. Maximum file size is 50MB.",
  })
  @ApiResponse({
    status: 200,
    description: "File successfully uploaded",
    type: ExtractPdfResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid file or format",
  })
  async extractPdfText(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractPdfResponseDto> {
    const mimeType = this.validateFile(file);
    const { projectId } = extractContextInfo(request, undefined);
    const storagePath = await this.storageService.upload(
      projectId,
      file.originalname,
      file.buffer,
      mimeType,
    );
    return {
      storagePath,
      mimeType,
    };
  }

  private validateFile(file: Express.Multer.File): string {
    const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.MAX_FILE_SIZE_MB}MB`,
      );
    }
    const normalizedMimeType = this.normalizeMimeType(file);
    if (!normalizedMimeType || !this.isSupportedMimeType(normalizedMimeType)) {
      const fallbackMimeType = file.mimetype || "unknown";
      throw new BadRequestException(
        `Invalid file type: ${
          normalizedMimeType ?? fallbackMimeType
        }. Supported types: ${SUPPORTED_TYPE_DESCRIPTION}`,
      );
    }
    return normalizedMimeType;
  }

  private normalizeMimeType(file: Express.Multer.File): string | undefined {
    if (file.mimetype && file.mimetype !== "application/octet-stream") {
      return file.mimetype;
    }
    const detectedType = mimeTypes.lookup(file.originalname);
    return typeof detectedType === "string" ? detectedType : undefined;
  }

  private isSupportedMimeType(mimeType: string): boolean {
    if (SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      return true;
    }
    if (mimeType.startsWith("text/")) {
      return true;
    }
    return SUPPORTED_APPLICATION_TYPES.has(mimeType);
  }
}
