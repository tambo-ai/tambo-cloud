import { NextResponse } from "next/server";

interface ValidateApiKeyRequest {
  apiKey: string;
  provider: string;
  options?: {
    allowEmpty?: boolean;
    timeout?: number;
  };
}

interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  provider?: string;
  details?: {
    note?: string;
    modelCount?: number;
    quotaInfo?: any;
  };
}

export async function POST(req: Request) {
  try {
    let parsedBody: ValidateApiKeyRequest;
    try {
      parsedBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { apiKey, provider, options = {} } = parsedBody;
    const { timeout = 10000 } = options;

    // Validate required fields
    if (!apiKey || !provider) {
      const missingFields = [];
      if (!apiKey) missingFields.push("apiKey");
      if (!provider) missingFields.push("provider");

      return NextResponse.json(
        { error: "Missing required fields", fields: missingFields },
        { status: 400 },
      );
    }

    // Basic format validation first
    const basicValidation = validateBasicFormat(apiKey.trim(), provider);
    if (!basicValidation.isValid) {
      return NextResponse.json(basicValidation);
    }

    // Perform provider-specific validation
    let result: ApiKeyValidationResult;
    switch (provider.toLowerCase()) {
      case "openai":
        result = await validateOpenAIKey(apiKey.trim(), timeout);
        break;
      case "anthropic":
        result = await validateAnthropicKey(apiKey.trim(), timeout);
        break;
      case "mistral":
        result = await validateMistralKey(apiKey.trim(), timeout);
        break;
      case "openai-compatible":
        // Static validation only for OpenAI-compatible providers
        result = {
          isValid: true,
          provider,
          details: {
            note: "Format validation only - endpoint structures vary by provider",
          },
        };
        break;
      default:
        result = {
          isValid: true,
          provider,
          details: {
            note: "Dynamic validation not available for this provider - basic format validation only",
          },
        };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json(
      {
        isValid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

// Basic format validation
function validateBasicFormat(
  key: string,
  providerName: string,
): ApiKeyValidationResult {
  if (key.length < 8) {
    return {
      isValid: false,
      error: "API key appears to be too short",
      provider: providerName,
    };
  }

  const invalidPatterns = [
    /^(your|api|key|token|secret|test|demo|example|sample)/i,
    /\s/,
    /<|>/,
    /^[x]+$/i,
    /\*{3,}/,
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(key)) {
      return {
        isValid: false,
        error:
          "API key appears to be a placeholder or contains invalid characters",
        provider: providerName,
      };
    }
  }

  // Provider-specific basic format checks
  switch (providerName.toLowerCase()) {
    case "openai":
      if (!key.startsWith("sk-")) {
        return {
          isValid: false,
          error: "OpenAI API key must start with 'sk-'",
          provider: providerName,
        };
      }
      break;
    case "anthropic":
      if (!key.startsWith("sk-ant-api03-")) {
        return {
          isValid: false,
          error: "Anthropic API key must start with 'sk-ant-api03-'",
          provider: providerName,
        };
      }
      break;
    // No specific format requirements for Mistral or OpenAI-compatible
  }

  return { isValid: true, provider: providerName };
}

// OpenAI validation
async function validateOpenAIKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "openai";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}

// Anthropic validation
async function validateAnthropicKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "anthropic";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}

// Mistral validation
async function validateMistralKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "mistral";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.mistral.ai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}
