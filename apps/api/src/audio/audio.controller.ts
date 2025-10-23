import {
  BadRequestException,
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
import mimeTypes from "mime-types";
import { ApiKeyGuard } from "src/projects/guards/apikey.guard";
import { AudioService } from "./audio.service";
import { TranscribeAudioDto } from "./dto/transcribe-audio.dto";

@ApiTags("audio")
@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post("transcribe")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Audio file to transcribe",
    type: TranscribeAudioDto,
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
  async transcribeAudio(@UploadedFile() file: any) {
    const mimeType = this.validateAudioFile(file);
    return await this.audioService.transcribeAudio(file.buffer, mimeType);
  }

  private validateAudioFile(file: any): string {
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
      "video/mp4",
    ];

    const mimeType = file.mimetype || mimeTypes.contentType(file.originalname);
    console.log("mimeType", mimeType);

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Supported types: ${allowedMimeTypes.join(", ")}`,
      );
    }

    return mimeType;
  }
}
