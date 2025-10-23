import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export enum AudioFormat {
  WAV = "wav",
  MP3 = "mp3",
}

export class TranscribeAudioDto {
  @ApiProperty({
    description: "Audio file to transcribe",
    type: "string",
    format: "binary",
  })
  @IsNotEmpty()
  file!: any;

  @ApiProperty({
    description:
      "Audio format (optional, will be detected from file if not provided)",
    enum: AudioFormat,
    required: false,
  })
  @IsOptional()
  @IsEnum(AudioFormat)
  format?: AudioFormat;
}
