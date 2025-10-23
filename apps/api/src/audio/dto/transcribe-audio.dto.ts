import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class TranscribeAudioDto {
  @ApiProperty({
    description: "Audio file to transcribe",
    type: "string",
    format: "binary",
  })
  @IsNotEmpty()
  file!: any;
}
