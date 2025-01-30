import { type HydraInitConfig } from "hydra-ai-react";
import { getCalendar, getContacts } from "../api/apiTools";
import { EmailComponent } from "../components/EmailComponent";
import { NoteComponent } from "../components/NoteComponent";
import { EmailPropsSchema, NotePropsSchema } from "../schemas/componentSchemas";
import { GetCalendarSchema, GetContactsSchema } from "../schemas/toolSchemas";

const systemMessage = `You are a helpful AI assistant focused on productivity and communication. Always be professional, concise, and clear in your responses.`;

const prompt = `For all tasks:
- Maintain consistent formatting
- Be clear and structured
- Focus on user's needs
- Provide concise, actionable responses
- Use professional language`;

// Define available tools
const tools = {
  getContacts: {
    name: "Get Contacts",
    description:
      "Retrieves user contacts with optional filtering and pagination",
    func: getContacts,
    inputSchema: GetContactsSchema,
  },
  getCalendar: {
    name: "Get Calendar",
    description: "Fetches calendar events within a specified date range",
    func: getCalendar,
    inputSchema: GetCalendarSchema,
  },
};

// Define components with their associated tools
const components = {
  EmailComponent: {
    name: "Email Composer",
    description:
      "Compose and edit emails with contact and calendar integration",
    component: EmailComponent,
    propsSchema: EmailPropsSchema,
    associatedTools: ["getContacts", "getCalendar"],
  },
  NoteComponent: {
    name: "Note Editor",
    description: "Create and edit notes with optional tags",
    component: NoteComponent,
    propsSchema: NotePropsSchema,
    associatedTools: [], // This component doesn't need any tools
  },
};

export const initializeHydra = (): HydraInitConfig => {
  if (!process.env.NEXT_PUBLIC_HYDRA_API_KEY) {
    throw new Error("NEXT_PUBLIC_HYDRA_API_KEY is not set");
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    components,
    tools,
    systemMessage,
    prompt,
  };
};
