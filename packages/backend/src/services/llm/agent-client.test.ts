import { EventType } from "@ag-ui/core";
import { AgentProviderType } from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { AgentClient, AgentResponse } from "./agent-client";

// Mock the async-adapters module
jest.mock("./async-adapters", () => ({
  runStreamingAgent: jest.fn(),
}));

import { RunAgentResult } from "@ag-ui/client";
import { EventHandlerParams, runStreamingAgent } from "./async-adapters";

const mockRunStreamingAgent = jest.mocked(runStreamingAgent);

describe("AgentClient", () => {
  let agentClient: AgentClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the runStreamingAgent to return our mock generator
    mockRunStreamingAgent.mockReturnValue({
      next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
      [Symbol.asyncIterator]: jest.fn(),
    });
  });

  describe("create", () => {
    it("should create a CrewAI agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should create a LlamaIndex agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.LLAMAINDEX,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should create a PydanticAI agent", async () => {
      const client = await AgentClient.create({
        agentProviderType: AgentProviderType.PYDANTICAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      expect(client).toBeInstanceOf(AgentClient);
      expect(client.chainId).toBe("test-chain");
    });

    it("should throw error for Mastra agent", async () => {
      await expect(
        AgentClient.create({
          agentProviderType: AgentProviderType.MASTRA,
          agentUrl: "http://test-url",
          chainId: "test-chain",
          headers: { Authorization: "Bearer test" },
        }),
      ).rejects.toThrow("Mastra support is not implemented");
    });

    it("should throw error for unsupported agent type", async () => {
      await expect(
        AgentClient.create({
          agentProviderType: "UNSUPPORTED" as AgentProviderType,
          agentUrl: "http://test-url",
          chainId: "test-chain",
          headers: { Authorization: "Bearer test" },
        }),
      ).rejects.toThrow("Unsupported agent provider type: UNSUPPORTED");
    });
  });

  describe("streamRunAgent", () => {
    let mockGenerator: AsyncIterableIterator<
      EventHandlerParams,
      RunAgentResult
    >;

    beforeEach(async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      // Create a mock generator that we can control
      const events: any[] = [];
      let isDone = false;

      mockGenerator = {
        async next() {
          if (events.length === 0) {
            return { done: true, value: undefined };
          }
          return { done: false, value: events.shift() };
        },
        async return() {
          isDone = true;
          return { done: true, value: undefined };
        },
        async throw() {
          isDone = true;
          return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      } as AsyncIterableIterator<any>;

      // Add a method to push events for testing
      (mockGenerator as any).pushEvent = (event: any) => {
        events.push(event);
      };

      (mockGenerator as any).finish = () => {
        isDone = true;
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
    });

    it("should throw error if agent not initialized", async () => {
      const client = new (AgentClient as any)("test-chain", undefined);

      await expect(
        client
          .streamRunAgent({
            messages: [],
            tools: [],
          })
          .next(),
      ).rejects.toThrow("Agent not initialized");
    });

    it("should convert messages and tools correctly", async () => {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: "Hello, world!",
        },
        {
          role: "assistant",
          content: "Hi there!",
          tool_calls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "test_tool",
                arguments: '{"param": "value"}',
              },
            },
          ],
        },
        {
          role: "tool",
          content: "Tool result",
          tool_call_id: "call_123",
        },
      ];

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "test_tool",
            description: "A test tool",
            parameters: {
              type: "object",
              properties: {
                param: { type: "string" },
              },
            },
          },
        },
      ];

      // Mock the agent's setMessages method
      const mockSetMessages = jest.fn();
      (agentClient as any).aguiAgent = { setMessages: mockSetMessages };

      // Create a mock generator that finishes immediately
      const mockGenerator = {
        async next() {
          return { done: true, value: undefined };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);

      // Start the stream
      const stream = agentClient.streamRunAgent({ messages, tools });

      // Consume the stream to trigger the message conversion
      const responses: AgentResponse[] = [];
      for await (const response of stream) {
        responses.push(response);
      }

      // Verify setMessages was called with converted messages
      expect(mockSetMessages).toHaveBeenCalledWith([
        {
          role: "user",
          content: "Hello, world!",
          id: "tambo-user-0",
        },
        {
          role: "assistant",
          content: "Hi there!",
          id: "tambo-assistant-1",
          toolCalls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "test_tool",
                arguments: '{"param": "value"}',
              },
            },
          ],
        },
        {
          role: "tool",
          content: "Tool result",
          id: "tambo-tool-2",
          toolCallId: "call_123",
        },
      ]);

      // Verify runStreamingAgent was called with converted tools
      expect(mockRunStreamingAgent).toHaveBeenCalledWith(
        (agentClient as any).aguiAgent,
        [
          {
            tools: [
              {
                name: "test_tool",
                description: "A test tool",
                parameters: {
                  type: "object",
                  properties: {
                    param: { type: "string" },
                  },
                },
              },
            ],
          },
        ],
      );
    });

    it("should throw error for function messages", async () => {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "function" as any,
          content: "Function result",
        },
      ];

      const stream = agentClient.streamRunAgent({ messages, tools: [] });

      await expect(stream.next()).rejects.toThrow(
        "Function messages are not supported",
      );
    });

    it("should throw error for non-function tools", async () => {
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "code_interpreter" as any,
          code_interpreter: {},
        },
      ];

      const stream = agentClient.streamRunAgent({ messages: [], tools });

      await expect(stream.next()).rejects.toThrow(
        "Only function tools are supported",
      );
    });
  });

  describe("Event Processing", () => {
    let mockGenerator: any;

    beforeEach(async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      // Create a controllable mock generator
      const events: any[] = [];
      let isFinished = false;

      mockGenerator = {
        async next() {
          if (isFinished) {
            return { done: true, value: undefined };
          }
          if (events.length === 0) {
            // If no events and not finished, return a wait event
            return { done: false, value: { event: { type: "WAIT" } } };
          }
          const event = events.shift();
          // If this is the last event, mark as finished for next call
          if (events.length === 0) {
            isFinished = true;
          }
          return { done: false, value: event };
        },
        async return() {
          isFinished = true;
          return { done: true, value: undefined };
        },
        async throw() {
          isFinished = true;
          return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
        pushEvent: (event: any) => {
          events.push({ event });
        },
        finish: () => {
          isFinished = true;
        },
      };

      mockRunStreamingAgent.mockReturnValue(mockGenerator);
    });

    describe("Text Message Events", () => {
      it("should handle text message start/content/end sequence", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        // Push text message events
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: "Hello",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "msg-1",
          delta: " there!",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "msg-1",
        });

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle text message chunk events", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CHUNK,
          messageId: "msg-1",
          delta: "Chunk 1",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CHUNK,
          messageId: "msg-1",
          delta: " Chunk 2",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Tool Call Events", () => {
      it("should handle tool call start/args/end sequence", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"param": "value"}',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call-1",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool call chunk events", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "call-1",
          delta: '{"param": "value',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "call-1",
          delta: '"}',
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool call result", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [
            {
              type: "function",
              function: {
                name: "test_tool",
                description: "A test tool",
                parameters: { type: "object" },
              },
            },
          ],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-1",
          messageId: "tool-msg-1",
          content: "Tool execution result",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Thinking Events", () => {
      it("should handle thinking start/content/end sequence", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Think about this" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Let me think about this...",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: " I need to consider multiple factors.",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_END,
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle multiple thinking text messages", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Think step by step" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_START,
        });

        // First thinking message
        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Step 1: Analyze the problem",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        // Second thinking message
        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_START,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
          delta: "Step 2: Consider solutions",
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_TEXT_MESSAGE_END,
        });

        mockGenerator.pushEvent({
          type: EventType.THINKING_END,
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Run Events", () => {
      it("should handle run started/finished sequence", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Run something" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_STARTED,
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Task completed successfully",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle run error", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Run something" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_ERROR,
          error: "Something went wrong",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Step Events", () => {
      it("should handle step started/finished sequence", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Execute steps" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STEP_STARTED,
        });

        mockGenerator.pushEvent({
          type: EventType.STEP_FINISHED,
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("State Events", () => {
      it("should handle state snapshot", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Check state" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STATE_SNAPSHOT,
          state: { key: "value" },
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle state delta", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Update state" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.STATE_DELTA,
          delta: { newKey: "newValue" },
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Messages Snapshot Events", () => {
      it("should handle messages snapshot with assistant message", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "msg-1",
              role: "assistant",
              content: "Hello! How can I help you?",
            },
          ],
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle messages snapshot with tool message", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "tool-msg-1",
              role: "tool",
              content: "Tool result",
              toolCallId: "call-1",
            },
          ],
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle messages snapshot with user message", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.MESSAGES_SNAPSHOT,
          messages: [
            {
              id: "user-msg-1",
              role: "user",
              content: "Hello, world!",
            },
          ],
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Complex Conversation Flow", () => {
      it("should handle a complete conversation with assistant message, tool call, tool result, user message, and another assistant message", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [
            {
              type: "function",
              function: {
                name: "get_weather",
                description: "Get weather information",
                parameters: {
                  type: "object",
                  properties: {
                    location: { type: "string" },
                  },
                },
              },
            },
          ],
        });

        // Assistant message start
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "assistant-msg-1",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "assistant-msg-1",
          delta: "I can help you with that! Let me check the weather for you.",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "assistant-msg-1",
        });

        // Tool call start
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-weather-1",
          toolCallName: "get_weather",
          parentMessageId: "assistant-msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-weather-1",
          delta: '{"location": "New York"}',
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call-weather-1",
        });

        // Tool result
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call-weather-1",
          messageId: "tool-msg-1",
          content: '{"temperature": 72, "condition": "sunny"}',
        });

        // User message
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "user-msg-1",
          role: "user",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "user-msg-1",
          delta: "Thanks! What about tomorrow?",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "user-msg-1",
        });

        // Another assistant message
        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_START,
          messageId: "assistant-msg-2",
          role: "assistant",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: "assistant-msg-2",
          delta: "Tomorrow will be partly cloudy with a high of 75°F.",
        });

        mockGenerator.pushEvent({
          type: EventType.TEXT_MESSAGE_END,
          messageId: "assistant-msg-2",
        });

        // Run finished
        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Conversation completed",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });

    describe("Error Handling", () => {
      it("should handle missing current message in text content", async () => {
        // Create a new mock generator for this test
        const errorGenerator = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId: "msg-1",
                  delta: "This should fail",
                },
              },
            };
          },
          async return() {
            return { done: true, value: undefined };
          },
          async throw() {
            return { done: true, value: undefined };
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No current message");
      });

      it("should handle missing tool call in args event", async () => {
        // Create a new mock generator for this test
        const errorGenerator = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId: "call-1",
                  delta: '{"param": "value"}',
                },
              },
            };
          },
          async return() {
            return { done: true, value: undefined };
          },
          async throw() {
            return { done: true, value: undefined };
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No tool call found");
      });

      it("should handle missing tool call in end event", async () => {
        // Create a new mock generator for this test
        const errorGenerator = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.TOOL_CALL_END,
                  toolCallId: "call-1",
                },
              },
            };
          },
          async return() {
            return { done: true, value: undefined };
          },
          async throw() {
            return { done: true, value: undefined };
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No tool call found");
      });

      it("should handle missing current message in thinking content", async () => {
        // Create a new mock generator for this test
        const errorGenerator = {
          async next() {
            return {
              done: false,
              value: {
                event: {
                  type: EventType.THINKING_TEXT_MESSAGE_CONTENT,
                  delta: "This should fail",
                },
              },
            };
          },
          async return() {
            return { done: true, value: undefined };
          },
          async throw() {
            return { done: true, value: undefined };
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };

        mockRunStreamingAgent.mockReturnValue(errorGenerator);

        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Think" }],
          tools: [],
        });

        const responses: AgentResponse[] = [];
        await expect(async () => {
          for await (const response of stream) {
            responses.push(response);
          }
        }).rejects.toThrow("No current message");
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty tool calls array", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"param": "value"}',
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle tool calls with non-function type", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call-1",
          toolCallName: "test_tool",
          parentMessageId: "msg-1",
        });

        // Simulate a tool call with unexpected type
        mockGenerator.pushEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call-1",
          delta: '{"type": "unexpected"}',
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle run finished with string result", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: "Simple string result",
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });

      it("should handle run finished with object result", async () => {
        const stream = agentClient.streamRunAgent({
          messages: [{ role: "user", content: "Hello" }],
          tools: [],
        });

        mockGenerator.pushEvent({
          type: EventType.RUN_FINISHED,
          result: { status: "success", data: { key: "value" } },
        });

        mockGenerator.finish();

        const responses: AgentResponse[] = [];
        for await (const response of stream) {
          responses.push(response);
        }

        expect(responses).toMatchSnapshot();
      });
    });
  });

  describe("nonStreamingComplete", () => {
    it("should throw error if agent not initialized", async () => {
      const client = new (AgentClient as any)("test-chain", undefined);

      await expect(client.nonStreamingComplete({} as any)).rejects.toThrow(
        "Agent not initialized",
      );
    });

    it("should throw not implemented error", async () => {
      agentClient = await AgentClient.create({
        agentProviderType: AgentProviderType.CREWAI,
        agentUrl: "http://test-url",
        chainId: "test-chain",
        headers: { Authorization: "Bearer test" },
      });

      await expect(agentClient.nonStreamingComplete({} as any)).rejects.toThrow(
        "Method not implemented.",
      );
    });
  });
});
