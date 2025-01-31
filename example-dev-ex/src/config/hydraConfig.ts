import {
  createComponentRegistry,
  createToolRegistry,
  type HydraInitConfig,
  type Personality,
} from "hydra-ai-react";
import { EmailComponent } from "../components/EmailComponent";
import { NoteComponent } from "../components/NoteComponent";
import { EmailSchema, NoteSchema } from "../schemas/componentSchemas";
import { GetCalendarSchema, GetContactsSchema } from "../schemas/toolSchemas";

const personality: Personality = {
  role: `You are a friendly personal finance assistant focused on helping users manage their money better. You specialize in budgeting, savings goals, and making financial concepts easy to understand.`,

  style: `You communicate in a friendly and encouraging way, avoiding complex financial jargon. You celebrate user progress and provide gentle suggestions for improvement. When explaining financial concepts, you use real-world examples and analogies.`,

  rules: [
    "Never make specific investment recommendations",
    "Always encourage responsible financial habits",
    "Never request sensitive financial information",
    "Keep suggestions within user's stated budget",
    "Maintain user privacy and data security",
    "Focus on educational guidance over direct advice",
  ],
};

// Define tool registry
export const toolRegistry = createToolRegistry({
  getContacts: {
    description:
      "Retrieves user contacts with optional filtering and pagination",
    inputSchema: GetContactsSchema,
  },
  getCalendar: {
    description: "Fetches calendar events within a specified date range",
    inputSchema: GetCalendarSchema,
  },
});

// Define component registry
export const componentRegistry = createComponentRegistry<
  typeof toolRegistry.tools
>({
  EmailComponent: {
    component: EmailComponent,
    description:
      "Compose and edit emails with contact and calendar integration",
    propsSchema: EmailSchema,
    associatedTools: ["getContacts", "getCalendar"] as const,
  },
  NoteComponent: {
    component: NoteComponent,
    description: "Create and edit notes with optional tags",
    propsSchema: NoteSchema,
    associatedTools: [] as const,
  },
});

export const initializeHydra = (): HydraInitConfig<
  typeof toolRegistry.tools
> => {
  if (!process.env.NEXT_PUBLIC_HYDRA_API_KEY) {
    throw new Error("NEXT_PUBLIC_HYDRA_API_KEY is not set");
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    toolRegistry,
    componentRegistry,
    personality,
  };
};
