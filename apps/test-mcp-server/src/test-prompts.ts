import { Prompt } from "@modelcontextprotocol/sdk/types";

export const testPrompts: Prompt[] = [
  {
    name: "test_prompt",
    title: "Test Prompt",
    description: "A test prompt",
    inputSchema: {
      type: "object",
    },
  },
];
