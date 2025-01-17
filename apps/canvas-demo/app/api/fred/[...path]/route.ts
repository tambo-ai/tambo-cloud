import { NextResponse } from "next/server";
import { z } from "zod";

if (!process.env.FRED_API_KEY) {
  throw new Error("FRED_API_KEY environment variable is required");
}

const FRED_API_KEY = process.env.FRED_API_KEY;
const BASE_URL = "https://api.stlouisfed.org/fred";

// Schema for FRED API error response
const fredErrorSchema = z.object({
  error_code: z.number().optional(),
  error_message: z.string().optional(),
  error: z.string().optional(),
});

// Schema for route parameters
const paramsSchema = z.object({
  path: z.array(z.string()),
});

// Cache responses for 1 hour
export const revalidate = 3600;

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    if (!FRED_API_KEY) {
      console.error("FRED API key not configured");
      return NextResponse.json(
        {
          error:
            "FRED API key not configured. Please check .env.example for setup instructions.",
        },
        { status: 500 }
      );
    }

    // Await and validate path parameters
    const params = await context.params;
    const pathParams = { path: params.path };
    const result = paramsSchema.safeParse(pathParams);
    if (!result.success) {
      console.error("Invalid route parameters:", result.error);
      return NextResponse.json(
        {
          error: "Invalid route parameters",
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const { path } = result.data;
    if (!path.length) {
      return NextResponse.json(
        {
          error: "No FRED API endpoint path provided",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = new URL(`${BASE_URL}/${path.join("/")}`);

    url.searchParams.append("api_key", FRED_API_KEY);
    url.searchParams.append("file_type", "json");

    // Forward all search parameters except file_type which we already set
    searchParams.forEach((value, key) => {
      if (key !== "file_type") {
        url.searchParams.append(key, value);
      }
    });

    console.warn(
      "Fetching FRED API:",
      url.toString().replace(FRED_API_KEY, "[REDACTED]")
    );

    const response = await fetch(url.toString(), {
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });
    const rawData = (await response.json()) as unknown;

    if (!response.ok) {
      const errorResult = fredErrorSchema.safeParse(rawData);
      const errorMessage = errorResult.success
        ? errorResult.data.error ||
          errorResult.data.error_message ||
          "FRED API request failed"
        : "FRED API request failed";

      console.error("FRED API error response:", {
        status: response.status,
        data: rawData,
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Cache the successful response
    const cachedResponse = NextResponse.json(rawData);
    cachedResponse.headers.set(
      "Cache-Control",
      "max-age=3600, s-maxage=3600, stale-while-revalidate"
    );

    return cachedResponse;
  } catch (error) {
    console.error("FRED API unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
