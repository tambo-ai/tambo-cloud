import { SlackAPIError } from "./types/slack";

const SLACK_API_BASE = "https://slack.com/api";

export async function callSlackAPI<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${SLACK_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error((data as SlackAPIError).error);
  }

  return data as T;
}
