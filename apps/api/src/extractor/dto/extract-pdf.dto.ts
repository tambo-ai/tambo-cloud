import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ExtractPdfDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "File to upload",
  })
  @IsNotEmpty()
  file!: unknown;
}
