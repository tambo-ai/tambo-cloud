import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { createTamboBackend } from "@tambo-ai-cloud/backend";
import {
  AgentProviderType,
  AiProviderType,
  ContentPartType,
  GenerationStage,
  MessageRole,
  OAuthValidationMode,
} from "@tambo-ai-cloud/core";
import { schema, type operations as dbOperations } from "@tambo-ai-cloud/db";
import {
  createMockDBMessage,
  createMockDBProject,
  createMockDBThread,
} from "@tambo-ai-cloud/testing";
import { DATABASE } from "../../common/middleware/db-transaction-middleware";
import { AuthService } from "../../common/services/auth.service";
import { EmailService } from "../../common/services/email.service";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectsService } from "../../projects/projects.service";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ThreadsService } from "../threads.service";

// Mock backend pieces (TamboBackend and helpers)
jest.mock("@tambo-ai-cloud/backend", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/backend");
  const makeStream = () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        id: "dec1",
        role: MessageRole.Assistant,
        message: "hello",
        componentState: {},
      } as any;
    },
  });
  const __testRunDecisionLoop__ = jest.fn().mockReturnValue(makeStream());
  const createTamboBackend = jest.fn().mockResolvedValue({
    runDecisionLoop: __testRunDecisionLoop__,
    generateSuggestions: jest.fn(),
    generateThreadName: jest.fn(),
    modelOptions: {
      provider: "openai",
      model: "gpt-4.1-2025-04-14",
      baseURL: undefined,
      maxInputTokens: undefined,
    },
  });
  return {
    ...actual,
    createTamboBackend,
    generateChainId: jest.fn().mockResolvedValue("chain-1"),
    __testRunDecisionLoop__,
  };
});

const {
  createTamboBackend: mockedCreateTamboBackend,
}: {
  createTamboBackend: jest.MockedFunction<typeof createTamboBackend>;
} = jest.requireMock("@tambo-ai-cloud/backend");

const { __testRunDecisionLoop__ }: { __testRunDecisionLoop__: jest.Mock } =
  jest.requireMock("@tambo-ai-cloud/backend");

// Mock DB operations used by the service
jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  const mockedOperations = {
    // threads
    createThread: jest.fn(),
    getThreadsByProject: jest.fn(),
    countThreadsByProject: jest.fn(),
    getThreadForProjectId: jest.fn(),
    updateThread: jest.fn(),
    deleteThread: jest.fn(),
    ensureThreadByProjectId: jest.fn(),
    getLatestMessage: jest.fn(),
    updateMessage: jest.fn(),
    updateThreadGenerationStatus: jest.fn(),
    getThreadGenerationStage: jest.fn(),

    // messages
    addMessage: jest.fn(),
    getMessages: jest.fn(),
    deleteMessage: jest.fn(),
    findPreviousToolCallMessage: jest.fn(),

    // suggestions
    getSuggestions: jest.fn(),
    createSuggestions: jest.fn(),

    // usage / limits
    getProjectMessageUsage: jest.fn(),
    updateProjectMessageUsage: jest.fn(),
    incrementMessageCount: jest.fn(),
    hasUserReceivedFirstMessageEmail: jest.fn(),
    getProjectMembers: jest.fn(),

    // projects
    getProject: jest.fn(),

    // mcp/system tools
    getProjectMcpServers: jest.fn(),
    addProjectLogEntry: jest.fn(),
  } satisfies Partial<typeof dbOperations>;
  return {
    ...actual,
    operations: mockedOperations,
    schema: actual.schema,
  };
});

// Access the mocked operations for configuring behavior in tests
const { operations }: { operations: jest.Mocked<typeof dbOperations> } =
  jest.requireMock("@tambo-ai-cloud/db");

// Intentionally do NOT mock systemTools or thread/message utils.

describe("ThreadsService.advanceThread initialization", () => {
  let module: TestingModule;
  let service: ThreadsService;
  let authService: AuthService;
  let _projectsService: ProjectsService;

  const projectId = "proj_1";
  const threadId = "thread_1";

  const baseMessage: AdvanceThreadDto["messageToAppend"] = {
    role: MessageRole.User,
    content: [{ type: ContentPartType.Text, text: "hi" }],
    componentState: {},
  };

  const makeDto = (opts?: {
    withComponents?: boolean;
    withClientTools?: boolean;
    forceToolChoice?: string;
  }): AdvanceThreadDto => ({
    messageToAppend: baseMessage,
    availableComponents: opts?.withComponents
      ? [
          {
            name: "CompA",
            description: "desc",
            contextTools: [],
            props: {},
          },
        ]
      : [],
    clientTools: opts?.withClientTools
      ? [
          {
            name: "client.tool",
            description: "c tool",
            parameters: [],
          },
        ]
      : [],
    forceToolChoice: opts?.forceToolChoice,
  });

  const fakeDb = {
    transaction: async (fn: any) => fn(fakeDb),
    query: {
      threads: {
        findFirst: jest.fn().mockResolvedValue({
          id: threadId,
          projectId,
          generationStage: GenerationStage.COMPLETE,
        }),
      },
    },
  };

  const prevFallbackOpenaiApiKey = process.env.FALLBACK_OPENAI_API_KEY;
  beforeAll(() => {
    process.env.FALLBACK_OPENAI_API_KEY = "sk-fallback";
  });
  afterAll(() => {
    process.env.FALLBACK_OPENAI_API_KEY = prevFallbackOpenaiApiKey;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-seed DB thread lookup after clearing mocks
    jest.mocked(fakeDb.query.threads.findFirst).mockResolvedValue({
      id: threadId,
      projectId,
      generationStage: GenerationStage.COMPLETE,
    });

    // Default operations behavior
    operations.createThread.mockResolvedValue(
      createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
    );
    operations.getProjectMessageUsage.mockResolvedValue({
      messageCount: 2,
      hasApiKey: true,
      firstMessageSentAt: new Date(),
      createdAt: new Date(),
      notificationSentAt: null,
      updatedAt: new Date(),
      projectId,
    });
    operations.getProject.mockResolvedValue(
      createMockDBProject(projectId, {
        name: "My Project",
        agentProviderType: AgentProviderType.MASTRA,
        defaultLlmProviderName: "openai",
        defaultLlmModelName: "gpt-4.1-2025-04-14",
        oauthValidationMode: OAuthValidationMode.NONE,
        providerType: AiProviderType.LLM,
        maxToolCallLimit: 7,
        creatorId: "user_1",
      }),
    );
    operations.getProjectMcpServers.mockResolvedValue([]);
    operations.getMessages.mockResolvedValue([
      createMockDBMessage("m1", threadId, MessageRole.User, [
        { type: "text", text: "hi" },
      ]),
    ]);

    operations.addMessage.mockImplementation(
      async (_db: any, input: typeof schema.messages.$inferInsert) => ({
        id: "u1",
        threadId: input.threadId,
        role: input.role,
        parentMessageId: input.parentMessageId ?? null,
        content: input.content,
        createdAt: new Date(),
        metadata: input.metadata ?? null,
        actionType: input.actionType ?? null,
        toolCallRequest: input.toolCallRequest ?? null,
        toolCallId: input.toolCallId ?? null,
        componentState: input.componentState ?? {},
        componentDecision: input.componentDecision ?? null,
        error: input.error ?? null,
        isCancelled: input.isCancelled ?? false,
        additionalContext: input.additionalContext ?? {},
        reasoning: input.reasoning ?? null,
      }),
    );

    module = await Test.createTestingModule({
      providers: [
        ThreadsService,
        { provide: DATABASE, useValue: fakeDb },
        {
          provide: CorrelationLoggerService,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: {
            sendMessageLimitNotification: jest.fn(),
            sendFirstMessageEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("secret") },
        },
        {
          provide: AuthService,
          useValue: {
            generateMcpAccessToken: jest.fn().mockResolvedValue("mcp-token"),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            findOneWithKeys: jest
              .fn()
              .mockResolvedValue({ getProviderKeys: () => [] }),
            findOne: jest.fn().mockResolvedValue({
              id: projectId,
              defaultLlmProviderName: "openai",
              defaultLlmModelName: "gpt-4.1-2025-04-14",
              customLlmModelName: null,
              customLlmBaseURL: null,
              maxInputTokens: undefined,
              maxToolCallLimit: 7,
              customInstructions: undefined,
              getProviderKeys: () => [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ThreadsService);
    authService = module.get(AuthService);
    _projectsService = module.get(ProjectsService);
  });

  afterEach(async () => {
    await module.close();
  });

  test("retrieves MCP system tools from database", async () => {
    const dto = makeDto({ withComponents: false, withClientTools: false });

    // Stop execution before hitting complex streaming logic
    jest
      .spyOn<any, any>(service, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(projectId, dto, undefined, true),
    ).rejects.toThrow("STOP_AFTER_INIT");

    // Verify system tools were retrieved from database
    expect(operations.getProjectMcpServers).toHaveBeenCalledWith(
      fakeDb,
      projectId,
      null,
    );
  });

  test("uses contextKey in backend user id and MCP token generation", async () => {
    const dto = makeDto();
    const contextKey = "ctx_123";
    jest
      .spyOn<any, any>(service, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(
        projectId,
        dto,
        undefined,
        true,
        {},
        undefined,
        undefined, // queue
        contextKey,
      ),
    ).rejects.toThrow("STOP_AFTER_INIT");

    const initArgs2 = mockedCreateTamboBackend.mock.calls[0];
    expect(initArgs2[2]).toBe(`${projectId}-${contextKey}`);
    expect(authService.generateMcpAccessToken).toHaveBeenCalledWith(
      projectId,
      threadId,
      contextKey,
    );
  });

  test("passes forceToolChoice parameter to decision loop", async () => {
    const dto = makeDto({
      withComponents: true,
      withClientTools: true,
      forceToolChoice: "someTool",
    });
    // Ensure backend instance is properly returned for this test
    jest
      .spyOn<any, any>(service as any, "createTamboBackendForThread")
      .mockResolvedValue({
        runDecisionLoop: __testRunDecisionLoop__,
        generateSuggestions: jest.fn(),
        generateThreadName: jest.fn(),
        modelOptions: {
          provider: "openai",
          model: "gpt-4.1-2025-04-14",
          baseURL: undefined,
          maxInputTokens: undefined,
        },
      } as any);
    __testRunDecisionLoop__.mockImplementationOnce(() => {
      throw new Error("STOP_AFTER_INIT");
    });

    await expect(
      service.advanceThread(projectId, dto, undefined, false),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(__testRunDecisionLoop__).toHaveBeenCalledTimes(1);
    const callArg = __testRunDecisionLoop__.mock.calls[0][0];
    expect(callArg).toEqual(
      expect.objectContaining({
        messages: expect.any(Array),
        strictTools: expect.any(Array),
        forceToolChoice: "someTool",
      }),
    );
  });
});
