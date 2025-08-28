import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import {
  ContentPartType,
  GenerationStage,
  MessageRole,
} from "@tambo-ai-cloud/core";
import { type operations as dbOperations } from "@tambo-ai-cloud/db";
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
  const mockRunDecisionLoop = jest.fn();
  const MockTamboBackend = jest.fn().mockImplementation(() => ({
    runDecisionLoop: mockRunDecisionLoop,
  }));
  return {
    ...actual,
    TamboBackend: MockTamboBackend,
    generateChainId: jest.fn().mockResolvedValue("chain-1"),
    __mock: { MockTamboBackend, mockRunDecisionLoop },
  };
});

const { __mock: backendMock } = jest.requireMock("@tambo-ai-cloud/backend");
const { MockTamboBackend } = backendMock;

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
    getMessages: jest.fn(),
    deleteMessage: jest.fn(),

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
  } satisfies Partial<typeof dbOperations>;
  return {
    ...actual,
    operations: mockedOperations,
    schema: actual.schema,
  };
});

// Access the mocked operations for configuring behavior in tests
const { operations } = jest.requireMock("@tambo-ai-cloud/db");

// Mock helper modules used inside ThreadsService flows
jest.mock("../../common/systemTools", () => ({
  getSystemTools: jest.fn(),
}));

jest.mock("../util/messages", () => {
  const actual = jest.requireActual("../util/messages");
  return {
    ...actual,
    addMessage: jest.fn(),
  };
});

// processThreadMessage will be intercepted in non-streaming init tests
jest.mock("../util/thread-state", () => {
  const actual = jest.requireActual("../util/thread-state");
  return {
    ...actual,
    processThreadMessage: jest.fn(),
  };
});

// Utilities to access mocked modules with types
import { getSystemTools } from "../../common/systemTools";
import { addMessage as addMessageUtil } from "../util/messages";
import { processThreadMessage } from "../util/thread-state";

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
  } as any;

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

  const fakeDb: any = {
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

  beforeAll(() => {
    process.env.FALLBACK_OPENAI_API_KEY = "sk-fallback";
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-seed DB thread lookup after clearing mocks
    (fakeDb.query.threads.findFirst as jest.Mock).mockResolvedValue({
      id: threadId,
      projectId,
      generationStage: GenerationStage.COMPLETE,
    });

    // Default operations behavior
    operations.createThread.mockResolvedValue({
      id: threadId,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId,
      name: null,
      generationStage: GenerationStage.COMPLETE,
      statusMessage: null,
      contextKey: null,
      metadata: null,
    });
    operations.getProjectMessageUsage.mockResolvedValue({
      messageCount: 2,
      hasApiKey: true,
      firstMessageSentAt: new Date(),
    });
    operations.getProject.mockResolvedValue({
      maxToolCallLimit: 7,
      customInstructions: undefined,
    });
    operations.getMessages.mockResolvedValue([
      {
        id: "m1",
        threadId,
        role: MessageRole.User,
        content: [{ type: ContentPartType.Text, text: "hi" }],
        createdAt: new Date(),
        componentState: {},
      },
    ]);

    (getSystemTools as jest.Mock).mockResolvedValue({});
    (addMessageUtil as jest.Mock).mockResolvedValue({
      id: "u1",
      threadId,
      role: MessageRole.User,
      content: [{ type: ContentPartType.Text, text: "hi" }],
      createdAt: new Date(),
      componentState: {},
    });

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

  test("streaming: initialization calls generateStreamingResponse with no tools/components", async () => {
    const dto = makeDto({ withComponents: false, withClientTools: false });

    const spyGen = jest
      .spyOn<any, any>(service as any, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(projectId, dto, undefined, true),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(getSystemTools).toHaveBeenCalledWith(fakeDb, projectId);
    const initArgs = (MockTamboBackend as jest.Mock).mock.calls[0];
    expect(initArgs[0]).toBe("sk-fallback");
    expect(initArgs[2]).toBe(`${projectId}-tambo:anon-user`);
    expect(initArgs[3]).toEqual(
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4.1-2025-04-14",
      }),
    );
    expect(spyGen).toHaveBeenCalled();
  });

  test("streaming: initialization passes system tools when present", async () => {
    (getSystemTools as jest.Mock).mockResolvedValue({ sysTool: {} });
    const dto = makeDto();

    const spyGen = jest
      .spyOn<any, any>(service as any, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(projectId, dto, undefined, true),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(getSystemTools).toHaveBeenCalled();
    expect(spyGen).toHaveBeenCalled();
  });

  test("streaming: initialization with client tools and components", async () => {
    const dto = makeDto({ withComponents: true, withClientTools: true });
    const spyGen = jest
      .spyOn<any, any>(service as any, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(projectId, dto, undefined, true),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(spyGen).toHaveBeenCalled();
  });

  test("streaming: initialization uses contextKey in backend user id and token", async () => {
    const dto = makeDto();
    const contextKey = "ctx_123";
    const spyGen = jest
      .spyOn<any, any>(service as any, "generateStreamingResponse")
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
        contextKey,
      ),
    ).rejects.toThrow("STOP_AFTER_INIT");

    const initArgs2 = (MockTamboBackend as jest.Mock).mock.calls[0];
    expect(initArgs2[2]).toBe(`${projectId}-${contextKey}`);
    expect(initArgs2[3]).toEqual(expect.any(Object));
    expect(authService.generateMcpAccessToken).toHaveBeenCalledWith(
      projectId,
      threadId,
      contextKey,
    );
    expect(spyGen).toHaveBeenCalled();
  });

  test("non-streaming: initialization calls processThreadMessage with variations", async () => {
    const dto = makeDto({ withComponents: true, withClientTools: false });
    (processThreadMessage as jest.Mock).mockImplementation(async () => {
      throw new Error("STOP_AFTER_INIT");
    });

    await expect(
      service.advanceThread(projectId, dto, undefined, false),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(getSystemTools).toHaveBeenCalled();
    expect(processThreadMessage).toHaveBeenCalled();
  });

  test("non-streaming: initialization handles no tools/components", async () => {
    const dto = makeDto({ withComponents: false, withClientTools: false });
    (processThreadMessage as jest.Mock).mockImplementation(async () => {
      throw new Error("STOP_AFTER_INIT");
    });

    await expect(
      service.advanceThread(projectId, dto, undefined, false),
    ).rejects.toThrow("STOP_AFTER_INIT");

    expect(processThreadMessage).toHaveBeenCalled();
  });
});
