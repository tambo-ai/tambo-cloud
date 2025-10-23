import { Injectable, Logger } from "@nestjs/common";
import { OpenAI, toFile } from "openai";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly openaiClient = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
  });

  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new Error("Invalid audio data - buffer is empty");
    }
    try {
      this.logger.log(
        `Transcribing audio: mimeType=${mimeType}, bufferSize=${audioBuffer.length} bytes`,
      );

      const transcription = await this.transcribeWithOpenai(
        audioBuffer,
        mimeType,
      );

      if (!transcription || transcription.trim().length === 0) {
        throw new Error(
          "Empty transcription received - audio might be silent or invalid",
        );
      }

      return transcription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Audio transcription failed: ${errorMessage}`);
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }

  private async transcribeWithOpenai(
    audioBuffer: Buffer,
    mimeType: string,
    model: string = "gpt-4o-mini-transcribe",
  ): Promise<string> {
    const audioFile = await toFile(
      audioBuffer as unknown as ArrayBuffer,
      `audio`,
      {
        type: mimeType,
      },
    );
    const transcription = await this.openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: model,
      response_format: "text",
    });

    return transcription;
  }
}
