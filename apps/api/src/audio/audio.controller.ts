import {
  BadRequestException,
  Body,
  Controller,
  Post,
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
  ApiTags,
} from "@nestjs/swagger";
import { ApiKeyGuard } from "src/projects/guards/apikey.guard";
import { BearerTokenGuard } from "src/projects/guards/bearer-token.guard";
import { AudioService } from "./audio.service";

@ApiTags("audio")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post("transcribe")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Audio file to transcribe",
    type: "multipart/form-data",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Audio file (MP3, WAV, MP4, MPEG, MPGA, M4A, or WEBM)",
        },
        format: {
          type: "string",
          enum: ["mp3", "wav", "mp4", "mpeg", "mpga", "m4a", "webm"],
          description:
            "Audio format (optional, will be auto-detected if not provided)",
        },
      },
      required: ["file"],
    },
  })
  @ApiOperation({
    summary: "Transcribe audio to text",
    description:
      "Upload an audio file and get its transcription. Supports MP3, WAV, MP4, MPEG, MPGA, M4A, and WEBM formats.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid audio file or format",
  })
  async transcribeAudio(
    @UploadedFile() file: any,
    @Body("format") format?: string,
  ) {
    this.validateAudioFile(file);
    const audioFormat = this.determineAudioFormat(file, format);
    return await this.audioService.transcribeAudio(file.buffer, audioFormat);
  }

  private validateAudioFile(file: any): void {
    if (!file) {
      throw new BadRequestException("No audio file provided");
    }

    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/mp4",
      "audio/m4a",
      "audio/webm",
      "video/mp4", // MP4 can be video container with audio
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(", ")}`,
      );
    }
  }

  private determineAudioFormat(file: any, format?: string): string {
    if (format) {
      return format;
    }

    // Check MIME types first
    if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3") {
      return "mp3";
    }

    if (file.mimetype === "audio/wav" || file.mimetype === "audio/wave") {
      return "wav";
    }

    if (file.mimetype === "audio/mp4" || file.mimetype === "video/mp4") {
      return "mp4";
    }

    if (file.mimetype === "audio/m4a") {
      return "m4a";
    }

    if (file.mimetype === "audio/webm") {
      return "webm";
    }

    // Fallback to file extension
    const extension = file.originalname.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "wav":
        return "wav";
      case "mp3":
        return "mp3";
      case "mp4":
        return "mp4";
      case "mpeg":
        return "mpeg";
      case "mpga":
        return "mpga";
      case "m4a":
        return "m4a";
      case "webm":
        return "webm";
      default:
        return "mp3"; // Default fallback
    }
  }
}
