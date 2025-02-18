import "dotenv/config";
import fetch from "node-fetch";

// Types
interface ThreadResponse {
  id: string;
  projectId: string;
  contextKey?: string;
}

interface MessageResponse {
  id: string;
  threadId: string;
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface SuggestionResponse {
  id: string;
  messageId: string;
  title: string;
  detailedSuggestion: string;
}

async function testEndpointWithoutApiKey(
  baseUrl: string,
  endpoint: string,
  method = "GET",
  body?: object,
) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (response.status === 401 || response.status === 403) {
    console.log(`✓ ${method} ${endpoint} correctly requires API key`);
  } else {
    throw new Error(
      `${method} ${endpoint} does not properly validate API key. Status: ${response.status}`,
    );
  }
}

async function testSuggestions(): Promise<void> {
  try {
    const baseUrl = process.env.HYDRA_API_URL || "http://localhost:3001";
    const apiKey = process.env.HYDRA_API_KEY;

    if (!apiKey) {
      throw new Error("HYDRA_API_KEY environment variable is required");
    }

    // Test endpoints without API key
    console.log("\nTesting API key validation...");
    await testEndpointWithoutApiKey(baseUrl, "/threads", "POST", {
      contextKey: "test-context",
    });
    await testEndpointWithoutApiKey(baseUrl, "/threads/project");
    await testEndpointWithoutApiKey(baseUrl, "/threads/some-id");
    await testEndpointWithoutApiKey(
      baseUrl,
      "/threads/some-id/messages",
      "POST",
      {
        role: "user",
        content: [{ type: "text", text: "test" }],
      },
    );
    await testEndpointWithoutApiKey(baseUrl, "/threads/some-id/messages");
    await testEndpointWithoutApiKey(
      baseUrl,
      "/threads/some-id/messages/some-message-id/suggestions",
    );
    await testEndpointWithoutApiKey(
      baseUrl,
      "/threads/some-id/messages/some-message-id/suggestions",
      "POST",
      { maxSuggestions: 5 },
    );

    console.log("\nAll endpoints properly validate API key");

    // Happy path testing
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };

    // Create a thread
    console.log("\nCreating thread...");
    const threadData = (await fetch(`${baseUrl}/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contextKey: "test-context",
      }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to create thread: ${await res.text()}`);
      }
      return res.json();
    })) as ThreadResponse;
    console.log("Thread created:", threadData);

    // Add a message to the thread
    console.log("\nAdding message to thread...");
    const messageData = (await fetch(
      `${baseUrl}/threads/${threadData.id}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "user",
          content: [
            {
              type: "text",
              text: "Hello, this is a test message for suggestions!",
            },
          ],
        }),
      },
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to add message: ${await res.text()}`);
      }
      return res.json();
    })) as MessageResponse;
    console.log("Message added:", messageData);

    // Generate suggestions
    console.log("\nGenerating suggestions...");
    const suggestionsData = (await fetch(
      `${baseUrl}/threads/${threadData.id}/messages/${messageData.id}/suggestions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ maxSuggestions: 5 }),
      },
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to generate suggestions: ${await res.text()}`);
      }
      return res.json();
    })) as SuggestionResponse[];
    console.log("Suggestions generated:", suggestionsData);

    // Get suggestions
    console.log("\nGetting suggestions...");
    const getSuggestionsData = (await fetch(
      `${baseUrl}/threads/${threadData.id}/messages/${messageData.id}/suggestions`,
      {
        method: "GET",
        headers,
      },
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to get suggestions: ${await res.text()}`);
      }
      return res.json();
    })) as SuggestionResponse[];
    console.log("Retrieved suggestions:", getSuggestionsData);

    console.log("\n✓ All tests completed successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

testSuggestions();
