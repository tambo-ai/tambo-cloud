import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ExtractPdfDto {
  @ApiProperty({
    description: "PDF file to extract text from (max 50MB)",
    type: "string",
    format: "binary",
  })
  @IsNotEmpty()
  file!: Express.Multer.File;
}
