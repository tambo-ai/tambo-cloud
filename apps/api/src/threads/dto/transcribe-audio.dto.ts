import { IsNotEmpty } from "class-validator";
import { InputAudio } from "./message.dto";

export class TranscribeAudioDto {
  @IsNotEmpty()
  audio!: InputAudio;
}
