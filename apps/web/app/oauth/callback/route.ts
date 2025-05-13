import { env } from "@/lib/env";
import { OAuthLocalProvider } from "@/lib/OAuthLocalProvider";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define schema for validating query parameters
const callbackParamsSchema = z
  .object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
    error: z.string().optional(),
    redirect_uri: z.string().url().optional(),
    projectId: z.string(),
    sessionId: z.string(),
  })
  .passthrough();

// Schema for the token response from the OAuth provider
const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

/**
 * Handler for OAuth callback
 * This is called by the OAuth provider after the user has authorized the application
 */
export async function GET(request: NextRequest) {
  // Get query parameters from URL
  const url = new URL(request.url);
  console.log("--> /oauth/callback", url.toString());
  const queryParams = Object.fromEntries(url.searchParams.entries());

  try {
    // Validate query parameters
    const validatedParams = callbackParamsSchema.parse(queryParams);
    const { projectId, sessionId, code } = validatedParams;
    const db = getDb(env.DATABASE_URL);
    const session = await db.query.mcpOauthClients.findFirst({
      where: eq(schema.mcpOauthClients.sessionId, sessionId),
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const oauthProvider = new OAuthLocalProvider(db, projectId, {
      clientInformation: session.sessionInfo.clientInformation,
      serverUrl: session.sessionInfo.serverUrl,
      sessionId,
    });

    console.log("--> /oauth/callback", url.toString(), queryParams);
    const result = await auth(oauthProvider, {
      serverUrl: session.sessionInfo.serverUrl,
      authorizationCode: code,
    });
    console.log("--> result", result);
    // Check for errors returned from OAuth provider
    if (validatedParams.error) {
      console.error("OAuth error:", validatedParams.error);
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(validatedParams.error)}`,
          request.url,
        ),
      );
    }

    // // Exchange authorization code for access token
    // const tokenResponse = await exchangeCodeForToken(validatedParams.code);

    // // Store tokens in database
    // await storeTokensInDatabase(tokenResponse);

    // Handle redirect after successful authentication
    const redirectUrl = validatedParams.redirect_uri
      ? validatedParams.redirect_uri
      : new URL(`/dashboard/${projectId}`, request.url).toString();

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling OAuth callback:", error);
    console.trace();

    if (error instanceof z.ZodError) {
      // Format validation errors
      const errorMessage = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(", ");
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(errorMessage)}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(
      new URL("/auth/error?error=unknown_error", request.url),
    );
  }
}
