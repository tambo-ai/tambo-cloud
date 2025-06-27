import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class OAuthTokenRequestDto {
  @ApiProperty({
    description:
      "OAuth subject token from an OAuth provider (e.g., Google, Microsoft)",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ...",
  })
  @IsString()
  @IsNotEmpty()
  subjectToken!: string;
}

export class OAuthTokenResponseDto {
  @ApiProperty({
    description: "JWT access token signed by Tambo with projectId as issuer",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken!: string;
}
