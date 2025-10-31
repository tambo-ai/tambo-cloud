import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import pdf from "pdf-parse";
import * as aiServiceInterface from "../ai/interfaces/ai.service.interface";
import { ExtractComponentResponseDto } from "./dto/extract-component-response.dto";
import { ExtractComponentDto } from "./dto/extract-component.dto";
import { ExtractPdfResponseDto } from "./dto/extract-pdf-response.dto";
import { ExtractPdfDto } from "./dto/extract-pdf.dto";

@Controller("extract")
export class ExtractorController {
  private readonly MAX_PDF_SIZE_MB = 50;

  constructor(
    @Inject("AIService")
    private aiService: aiServiceInterface.AIServiceInterface,
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
    summary: "Extract text from PDF",
    description:
      "Upload a PDF file and extract its text content. Maximum file size is 50MB.",
  })
  @ApiResponse({
    status: 200,
    description: "Text successfully extracted from PDF",
    type: ExtractPdfResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid file or format",
  })
  async extractPdfText(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractPdfResponseDto> {
    this.validatePdfFile(file);
    const data = await pdf(file.buffer);
    return {
      text: data.text,
      pages: data.numpages,
    };
  }

  private validatePdfFile(file: Express.Multer.File): void {
    const maxSizeBytes = this.MAX_PDF_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.MAX_PDF_SIZE_MB}MB`,
      );
    }
    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Expected application/pdf`,
      );
    }
  }
}
