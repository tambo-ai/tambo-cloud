import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  async transcribeAudio(
    audioBuffer: Buffer,
    format: string = "mp3",
  ): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new Error("Invalid audio data - buffer is empty");
    }
    try {
      this.logger.log(
        `Transcribing audio: format=${format}, bufferSize=${audioBuffer.length} bytes`,
      );

      const transcription = await this.transcribeWithOpenai(
        audioBuffer,
        format,
      );

      return this.processTranscriptionResult(transcription);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Audio transcription failed: ${errorMessage}`);
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }

  private async transcribeWithOpenai(
    audioBuffer: Buffer,
    format: string,
    model: string = "gpt-4o-mini-transcribe",
  ): Promise<string> {
    const formData = new FormData();
    const mimeType = format === "mp3" ? "audio/mpeg" : `audio/${format}`;
    const audioBlob = new Blob([audioBuffer as unknown as ArrayBuffer], {
      type: mimeType,
    });

    formData.append("file", audioBlob, `audio.${format}`);
    formData.append("model", model);
    formData.append("response_format", "text");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`,
      );
    }

    return await response.text();
  }

  private processTranscriptionResult(transcription: string): string {
    this.logger.log(
      `Transcription successful: length=${transcription.length}, content="${transcription}"`,
    );

    if (!transcription || transcription.trim().length === 0) {
      throw new Error(
        "Empty transcription received - audio might be silent or invalid",
      );
    }

    return transcription;
  }
}
