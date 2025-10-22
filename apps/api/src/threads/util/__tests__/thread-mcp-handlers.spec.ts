import type { CreateMessageRequest } from "@modelcontextprotocol/sdk/types.js";
import type { ITamboBackend } from "@tambo-ai-cloud/backend";
import {
  AsyncQueue,
  ContentPartType,
  GenerationStage,
  MessageRole,
} from "@tambo-ai-cloud/core";
import type { HydraDb } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";
import { AdvanceThreadResponseDto } from "../../dto/advance-thread.dto";
import { createMcpHandlers } from "../thread-mcp-handlers";

// Mock dependencies
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    addMessage: jest.fn(),
  },
}));

// Import the actual module so we can mock it
import { convertContentPartToDto } from "../content";

jest.mock("../content");

describe("createMcpHandlers", () => {
  const mockDb = {} as HydraDb;
  const mockThreadId = "thread-123";
  let mockQueue: AsyncQueue<AdvanceThreadResponseDto>;
  let mockTamboBackend: ITamboBackend;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock convertContentPartToDto to return input as-is
    jest
      .mocked(convertContentPartToDto)
      .mockImplementation((content) => content as any);

    mockQueue = {
      push: jest.fn(),
      fail: jest.fn(),
      finish: jest.fn(),
    } as any;

    mockTamboBackend = {
      llmClient: {
        complete: jest.fn(),
      },
      modelOptions: {
        model: "gpt-4o",
        provider: "openai",
      },
    } as any;
  });

  describe("sampling handler", () => {
    describe("basic flow", () => {
      it("should convert MCP messages to internal format and add to database", async () => {
        const mockInputMessage = {
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [{ type: ContentPartType.Text, text: "Hello" }],
          componentState: {},
          createdAt: new Date(),
        };

        const mockResponseMessage = {
          id: "msg-2",
          threadId: mockThreadId,
          role: MessageRole.Assistant,
          content: [{ type: ContentPartType.Text, text: "Hi there" }],
          componentState: {},
          createdAt: new Date(),
        };

        jest
          .mocked(operations.addMessage)
          .mockResolvedValueOnce(mockInputMessage as any)
          .mockResolvedValueOnce(mockResponseMessage as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: {
            role: "assistant",
            content: "Hi there",
          },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        const mcpRequest: CreateMessageRequest = {
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: { type: "text", text: "Hello" },
              },
            ],
            maxTokens: 1000,
          },
        };

        const result = await handlers.sampling(mcpRequest);

        // Verify input message was added to db
        expect(operations.addMessage).toHaveBeenNthCalledWith(1, mockDb, {
          threadId: mockThreadId,
          role: "user",
          content: [{ type: ContentPartType.Text, text: "Hello" }],
          parentMessageId: undefined,
        });

        // Verify response message was added to db
        expect(operations.addMessage).toHaveBeenNthCalledWith(2, mockDb, {
          threadId: mockThreadId,
          role: "assistant",
          content: [{ type: "text", text: "Hi there" }],
          parentMessageId: undefined,
        });

        // Verify result structure
        expect(result).toEqual({
          role: "assistant",
          content: { type: "text", text: "Hi there" },
          model: "gpt-4o",
        });
      });

      it("should push messages to queue with correct structure", async () => {
        const mockInputMessageContent = [
          { type: ContentPartType.Text, text: "Hello" },
        ];
        const mockResponseMessageContent = [
          { type: ContentPartType.Text, text: "Response" },
        ];

        const mockInputMessage = {
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: mockInputMessageContent,
          componentState: {},
          createdAt: new Date(),
        };

        const mockResponseMessage = {
          id: "msg-2",
          threadId: mockThreadId,
          role: MessageRole.Assistant,
          content: mockResponseMessageContent,
          componentState: {},
          createdAt: new Date(),
        };

        jest
          .mocked(operations.addMessage)
          .mockResolvedValueOnce(mockInputMessage as any)
          .mockResolvedValueOnce(mockResponseMessage as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        // Verify input message pushed to queue
        expect(mockQueue.push).toHaveBeenNthCalledWith(1, {
          responseMessageDto: {
            id: "msg-1",
            parentMessageId: undefined,
            role: MessageRole.User,
            content: mockInputMessageContent,
            componentState: {},
            threadId: mockThreadId,
            createdAt: mockInputMessage.createdAt,
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          statusMessage: `Streaming response...`,
        });

        // Verify response message pushed to queue
        expect(mockQueue.push).toHaveBeenNthCalledWith(2, {
          responseMessageDto: {
            id: "msg-2",
            parentMessageId: undefined,
            role: MessageRole.Assistant,
            content: mockResponseMessageContent,
            componentState: {},
            threadId: mockThreadId,
            createdAt: mockResponseMessage.createdAt,
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          statusMessage: `Streaming response...`,
        });

        expect(mockQueue.push).toHaveBeenCalledTimes(2);
      });

      it("should call LLM client with converted messages", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith({
          stream: false,
          promptTemplateName: "sampling",
          promptTemplateParams: {},
          messages: [
            {
              role: "user",
              content: [{ type: ContentPartType.Text, text: "Hello" }],
            },
          ],
        });
      });
    });

    describe("parent message ID handling", () => {
      it("should extract parentMessageId from _meta when present", async () => {
        const parentMsgId = "parent-msg-123";

        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
            _meta: {
              "tambo.co/parentMessageId": parentMsgId,
            },
          },
        });

        // Verify parentMessageId passed to database operations
        expect(operations.addMessage).toHaveBeenCalledWith(
          mockDb,
          expect.objectContaining({
            parentMessageId: parentMsgId,
          }),
        );
      });

      it("should handle missing _meta gracefully", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        // Verify parentMessageId is undefined
        expect(operations.addMessage).toHaveBeenCalledWith(
          mockDb,
          expect.objectContaining({
            parentMessageId: undefined,
          }),
        );
      });

      it("should pass parentMessageId to queue messages", async () => {
        const parentMsgId = "parent-msg-456";

        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
            _meta: {
              "tambo.co/parentMessageId": parentMsgId,
            },
          },
        });

        // Verify queue messages include parentMessageId
        expect(mockQueue.push).toHaveBeenCalledWith(
          expect.objectContaining({
            responseMessageDto: expect.objectContaining({
              parentMessageId: parentMsgId,
            }),
          }),
        );
      });
    });

    describe("multiple messages", () => {
      it("should handle multiple messages in sequence", async () => {
        const messages = [
          { id: "msg-1", role: MessageRole.User, text: "First" },
          { id: "msg-2", role: MessageRole.User, text: "Second" },
          { id: "msg-3", role: MessageRole.User, text: "Third" },
        ];

        let callCount = 0;
        jest.mocked(operations.addMessage).mockImplementation(async () => {
          const msg = messages[callCount] || messages[messages.length - 1];
          callCount++;
          return {
            id: msg.id,
            threadId: mockThreadId,
            role: msg.role,
            content: [{ type: ContentPartType.Text, text: msg.text }],
            componentState: {},
            createdAt: new Date(),
          } as any;
        });

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "First" } },
              { role: "user", content: { type: "text", text: "Second" } },
              { role: "user", content: { type: "text", text: "Third" } },
            ],
            maxTokens: 1000,
          },
        });

        // Verify each message was added to database
        expect(operations.addMessage).toHaveBeenCalledTimes(4); // 3 input + 1 response

        // Verify 3 input messages were added with correct content
        expect(operations.addMessage).toHaveBeenNthCalledWith(1, mockDb, {
          threadId: mockThreadId,
          role: "user",
          content: [{ type: ContentPartType.Text, text: "First" }],
          parentMessageId: undefined,
        });

        expect(operations.addMessage).toHaveBeenNthCalledWith(2, mockDb, {
          threadId: mockThreadId,
          role: "user",
          content: [{ type: ContentPartType.Text, text: "Second" }],
          parentMessageId: undefined,
        });

        expect(operations.addMessage).toHaveBeenNthCalledWith(3, mockDb, {
          threadId: mockThreadId,
          role: "user",
          content: [{ type: ContentPartType.Text, text: "Third" }],
          parentMessageId: undefined,
        });
      });

      it("should push each message to queue individually", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "First" } },
              { role: "user", content: { type: "text", text: "Second" } },
            ],
            maxTokens: 1000,
          },
        });

        // 2 input messages + 1 response = 3 queue pushes
        expect(mockQueue.push).toHaveBeenCalledTimes(3);
      });
    });

    describe("content type conversion", () => {
      it("should convert text content correctly", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello world" } },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [{ type: ContentPartType.Text, text: "Hello world" }],
              },
            ],
          }),
        );
      });

      it("should convert image content to base64 data URL", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "image",
                  data: "base64encodeddata",
                  mimeType: "image/png",
                },
              },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: ContentPartType.ImageUrl,
                    image_url: {
                      url: "data:image/png;base64,base64encodeddata",
                    },
                  },
                ],
              },
            ],
          }),
        );
      });

      it("should convert MP3 audio content correctly", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "audio",
                  data: "base64audiodata",
                  mimeType: "audio/mp3",
                },
              },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: ContentPartType.InputAudio,
                    input_audio: {
                      data: "base64audiodata",
                      format: "mp3",
                    },
                  },
                ],
              },
            ],
          }),
        );
      });

      it("should convert WAV audio content correctly", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "audio",
                  data: "base64audiodata",
                  mimeType: "audio/wav",
                },
              },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: ContentPartType.InputAudio,
                    input_audio: {
                      data: "base64audiodata",
                      format: "wav",
                    },
                  },
                ],
              },
            ],
          }),
        );
      });

      it("should handle unsupported audio formats with text fallback", async () => {
        const consoleWarnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "audio",
                  data: "base64audiodata",
                  mimeType: "audio/ogg",
                },
              },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: ContentPartType.Text,
                    text: "[Audio content not supported]",
                  },
                ],
              },
            ],
          }),
        );

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Unknown audio format"),
        );

        consoleWarnSpy.mockRestore();
      });

      it("should handle unknown content types with text fallback", async () => {
        const consoleWarnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              {
                role: "user",
                content: {
                  type: "video" as any,
                  data: "videodata",
                },
              },
            ],
            maxTokens: 1000,
          },
        });

        expect(mockTamboBackend.llmClient.complete).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: ContentPartType.Text,
                    text: "[Unsupported content type: video]",
                  },
                ],
              },
            ],
          }),
        );

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Unknown content type"),
        );

        consoleWarnSpy.mockRestore();
      });
    });

    describe("edge cases", () => {
      it("should handle empty response content from LLM", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        const result = await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        expect(result.content).toEqual({ type: "text", text: "" });
      });

      it("should handle null response content from LLM", async () => {
        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: null as any },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        const result = await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        expect(result.content).toEqual({ type: "text", text: "" });
      });

      it("should use correct model from tamboBackend.modelOptions", async () => {
        mockTamboBackend.modelOptions = {
          model: "gpt-4-turbo",
          provider: "openai",
        };

        jest.mocked(operations.addMessage).mockResolvedValue({
          id: "msg-1",
          threadId: mockThreadId,
          role: MessageRole.User,
          content: [],
          componentState: {},
          createdAt: new Date(),
        } as any);

        jest.mocked(mockTamboBackend.llmClient.complete).mockResolvedValue({
          message: { role: "assistant", content: "Response" },
        } as any);

        const handlers = createMcpHandlers(
          mockDb,
          mockTamboBackend,
          mockThreadId,
          mockQueue,
        );

        const result = await handlers.sampling({
          method: "sampling/createMessage",
          params: {
            messages: [
              { role: "user", content: { type: "text", text: "Hello" } },
            ],
            maxTokens: 1000,
          },
        });

        expect(result.model).toBe("gpt-4-turbo");
      });
    });
  });

  describe("elicitation handler", () => {
    it("should throw 'Not implemented yet' error", () => {
      const handlers = createMcpHandlers(
        mockDb,
        mockTamboBackend,
        mockThreadId,
        mockQueue,
      );

      // The handler throws synchronously even though the signature is async
      expect(() => {
        void handlers.elicitation({} as any);
      }).toThrow("Not implemented yet");
    });
  });
});
