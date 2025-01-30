import { toolRegistry } from "../config/hydraConfig";
import {
  type GetCalendarInput,
  type GetContactsInput,
} from "../schemas/toolSchemas";

// Tool implementations with auth context
const createContactsTool = (authToken: string) => {
  return async (input: GetContactsInput): Promise<unknown> => {
    const response = await fetch(
      `/api/contacts?userId=${input.userId}&limit=${input.limit || 10}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch contacts");
    }

    return response.json();
  };
};

const createCalendarTool = (authToken: string) => {
  return async (input: GetCalendarInput): Promise<unknown> => {
    const response = await fetch(
      `/api/calendar?userId=${input.userId}&start=${input.dateRange.start}&end=${input.dateRange.end}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch calendar");
    }

    return response.json();
  };
};

// Mock auth for example
const mockAuth = {
  token: null as string | null,
  isReady: false,
  async init() {
    // Simulate auth initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.token = "mock_token";
    this.isReady = true;
  },
};

// Register tools after auth
export async function registerAuthenticatedTools() {
  await mockAuth.init();

  if (!mockAuth.isReady || !mockAuth.token) {
    throw new Error("Auth not ready");
  }

  // Register tools with auth context
  toolRegistry.registerTool("getContacts", createContactsTool(mockAuth.token));
  toolRegistry.registerTool("getCalendar", createCalendarTool(mockAuth.token));
}

// Export tool factories for testing/direct usage
export const tools = {
  createContactsTool,
  createCalendarTool,
};
