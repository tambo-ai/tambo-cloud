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
          description: "Audio file (MP3 or WAV)",
        },
        format: {
          type: "string",
          enum: ["mp3", "wav"],
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
      "Upload an audio file and get its transcription. Supports MP3 and WAV formats.",
  })
  @ApiResponse({
    status: 200,
    description: "Audio transcribed successfully",
    schema: {
      type: "string",
      example: "Hello, this is a transcription of the audio file.",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid audio file or format",
  })
  async transcribeAudio(
    @UploadedFile() file: any,
    @Body("format") format?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No audio file provided");
    }

    // Validate file type
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(", ")}`,
      );
    }

    // Determine format from file extension or mime type
    let audioFormat = format;
    if (!audioFormat) {
      if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3") {
        audioFormat = "mp3";
      } else if (
        file.mimetype === "audio/wav" ||
        file.mimetype === "audio/wave"
      ) {
        audioFormat = "wav";
      } else {
        // Fallback to file extension
        const extension = file.originalname.split(".").pop()?.toLowerCase();
        audioFormat = extension === "wav" ? "wav" : "mp3";
      }
    }

    return await this.audioService.transcribeAudio(file.buffer, audioFormat);
  }
}
