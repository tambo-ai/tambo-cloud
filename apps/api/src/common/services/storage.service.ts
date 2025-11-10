import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class StorageService {
  private readonly client: SupabaseClient;
  private readonly bucketName = "user-files";

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseKey = this.configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured",
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async upload(
    projectId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `${projectId}/${timestamp}-${fileName}`;

    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      return path;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upload file: ${message}`);
    }
  }

  async get(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(path, 3600);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}
