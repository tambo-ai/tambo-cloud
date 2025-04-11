import { Composio } from "composio-core";

export type ComposioClient = Composio;

export function getComposio(): ComposioClient {
  return new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
  });
}
