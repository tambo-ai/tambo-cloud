import {
  createComponentRegistry,
  createToolRegistry,
  type HydraInitConfig,
} from "hydra-ai-react";
import { EmailComponent } from "../components/EmailComponent";
import { NoteComponent } from "../components/NoteComponent";
import { EmailSchema, NoteSchema } from "../schemas/componentSchemas";
import { GetCalendarSchema, GetContactsSchema } from "../schemas/toolSchemas";

const systemMessage = `You are a helpful AI assistant focused on productivity and communication. Always be professional, concise, and clear in your responses.`;

const prompt = `For all tasks:
- Maintain consistent formatting
- Be clear and structured
- Focus on user's needs
- Provide concise, actionable responses
- Use professional language`;

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
    systemMessage,
    prompt,
  };
};
