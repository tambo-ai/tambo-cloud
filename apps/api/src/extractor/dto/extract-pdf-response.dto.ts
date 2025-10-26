import { ApiProperty } from "@nestjs/swagger";

export class ExtractPdfResponseDto {
  @ApiProperty({
    description: "Extracted text content from the PDF",
    type: "string",
  })
  text!: string;

  @ApiProperty({
    description: "Number of pages in the PDF",
    type: "number",
  })
  pages!: number;
}
