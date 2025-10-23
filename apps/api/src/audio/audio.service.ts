import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  async transcribeAudio(
    audioBuffer: Buffer,
    format: string = "mp3",
  ): Promise<string> {
    try {
      // Validate audio buffer
      if (audioBuffer.length === 0) {
        throw new Error("Invalid audio data - buffer is empty");
      }

      this.logger.log(
        `Transcribing audio: format=${format}, bufferSize=${audioBuffer.length} bytes`,
      );

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Create a Blob from the buffer with the correct MIME type
      const mimeType = format === "mp3" ? "audio/mpeg" : `audio/${format}`;
      const audioBlob = new Blob([audioBuffer as unknown as ArrayBuffer], {
        type: mimeType,
      });

      // Append the file to FormData
      formData.append("file", audioBlob, `audio.${format}`);
      formData.append("model", "whisper-1");
      formData.append("response_format", "text");

      // Call OpenAI Whisper API
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

      const transcription = await response.text();
      this.logger.log(
        `Transcription successful: length=${transcription.length}, content="${transcription}"`,
      );

      // Check if transcription is empty or very short
      if (!transcription || transcription.trim().length === 0) {
        this.logger.warn(
          "Empty transcription received - audio might be silent or invalid",
        );
        return "No speech detected in audio file";
      }

      return transcription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Audio transcription failed: ${errorMessage}`);
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
}
