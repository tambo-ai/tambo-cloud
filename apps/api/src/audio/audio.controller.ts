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
    this.validateAudioFile(file);
    return await this.audioService.transcribeAudio(file.buffer, file.mimetype);
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
      "video/mp4",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(", ")}`,
      );
    }
  }
}
