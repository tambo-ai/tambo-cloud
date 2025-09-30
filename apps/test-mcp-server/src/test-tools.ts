import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { type Tool } from "@modelcontextprotocol/sdk/types.js";

// Test tool definitions
export const testTools: Tool[] = [
  {
    name: "ask_user_for_choice",
    description:
      "Ask the user to choose among a list of string options using MCP elicitation",
    inputSchema: {
      type: "object",
      properties: {
        choices: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of string choices for the user to select from",
        },
        prompt: {
          type: "string",
          description: "Optional prompt message to display to the user",
          default: "Please choose from the following options:",
        },
      },
      required: ["choices"],
    },
  },
  {
    name: "call_llm",
    description: "Send a message to the caller's LLM using MCP sampling",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to send to the LLM",
        },
        model: {
          type: "string",
          description: "Optional model identifier to use for the LLM call",
          default: "claude-3-5-sonnet-20241022",
        },
      },
      required: ["message"],
    },
  },
];

// Test tool handlers
export const testHandlers = {
  ask_user_for_choice: async (args: unknown, server: Server) => {
    try {
      const { choices, prompt = "Please choose from the following options:" } =
        args as {
          choices: string[];
          prompt?: string;
        };

      if (!choices.length || !Array.isArray(choices) || choices.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: choices must be a non-empty array of strings",
            },
          ],
          isError: true,
        };
      }

      console.log("Eliciting input", prompt);

      const response = await server.elicitInput({
        message: prompt,
        requestedSchema: {
          type: "object",
          properties: {
            choice: { type: "string" },
          },
        },
        required: ["choice"],
      });
      console.log("Elicitation response", response);

      // Format the choices for display
      const choicesText = choices
        .map((choice, index) => `${index + 1}. ${choice}`)
        .join("\n");

      // Return the elicitation request
      return {
        content: [
          {
            type: "text",
            text: `${prompt}\n\n${choicesText}\n\nPlease respond with the number (1-${choices.length}) of your choice.`,
          },
        ],
        // Note: In a real implementation, this would trigger MCP elicitation
        // For now, we'll return the formatted prompt
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in ask_user_for_choice: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },

  call_llm: async (args: unknown) => {
    try {
      const { message, model = "claude-3-5-sonnet-20241022" } = args as {
        message: string;
        model?: string;
      };

      if (!message || typeof message !== "string") {
        return {
          content: [
            {
              type: "text",
              text: "Error: message must be a non-empty string",
            },
          ],
          isError: true,
        };
      }

      // In a real implementation, this would use MCP sampling to call the LLM
      // For now, we'll return a mock response
      return {
        content: [
          {
            type: "text",
            text: `[MOCK LLM RESPONSE for model "${model}"]\n\nUser message: "${message}"\n\nThis is a mock response. In a real implementation, this would use MCP sampling to send the message to the LLM and return its response.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in call_llm: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
};
