import { type HydraThreadState } from "hydra-ai-react";
import { EmailComponent } from "../components/EmailComponent";
import { NoteComponent } from "../components/NoteComponent";

// Example thread state structure showing different message types and states
export const exampleThreadState: Record<string, HydraThreadState> = {
  "thread-1": {
    messages: [
      {
        role: "user",
        message: "Can you draft an email for me?",
      },
      {
        role: "ai",
        message: "Here's an email draft:",
        aiStatus: [
          {
            state: "evaluating",
            message:
              "It sounds like you want to send an email to Jill about getting lunch.",
          },
          {
            state: "tools",
            message:
              "Requesting contacts with the name Jill and calendar events for the next week.",
          },
          {
            state: "evaluating",
            message:
              "Found contact details for Jill Hill and determined that you are free for lunch Monday 12-2pm and Wednesday 11am-2pm.",
          },
          {
            state: "generating",
            message:
              "Generating an email to Jill Hill to get lunch on Monday or Wednesday.",
          },
        ],
        streamingState: {
          // TODO: Make this V2
          subject: { isStreaming: true, isComplete: false },
          body: { isStreaming: false, isComplete: true },
          recipients: { isStreaming: false, isComplete: true },
        },
        generatedComponent: {
          component: EmailComponent,
          generatedProps: {
            subject: "Lunch with Jill",
            body: "Hey Jill,\n\nI hope you're doing well! I was wondering if you'd like to grab lunch together this week? I'm free on Monday between 12-2pm or Wednesday between 11am-2pm.\n\nLet me know what works best for you!\n\nBest regards",
            recipients: ["jill.hill@example.com"],
          },
          interactiveProps: {
            subject: "Lunch with Jill",
            body: "Hey Jill, would you like to grab lunch on Monday or Wednesday?",
            recipients: ["jill.hill@example.com"],
          },
        },
        suggestions: [
          {
            title: "Schedule Follow-up",
            detailedSuggestion:
              "Would you like me to help schedule a calendar reminder for the lunch meeting once Jill responds?",
            suggestedTools: ["getCalendar", "createEvent"],
            components: ["CalendarComponent"],
          },
          {
            title: "Draft Response Template",
            detailedSuggestion:
              "I can prepare a response template for when Jill confirms her preferred time.",
            suggestedTools: ["getContacts", "getCalendar"],
            components: ["EmailComponent"],
          },
        ],
      },
    ],
    contextId: "user123-emails",
  },
  "thread-2": {
    messages: [
      {
        role: "user",
        message: "Create a grocery note.",
      },
      {
        role: "ai",
        message: "Here's your note:",
        aiStatus: [
          { state: "evaluating", message: "You want to create a note." },
          { state: "tools", message: "Looking for groceries note." },
          {
            state: "generating",
            message: "Sending grocery note.",
          },
        ],
        streamingState: {
          title: { isStreaming: false, isComplete: true },
          content: { isStreaming: true, isComplete: false },
          tags: { isStreaming: false, isComplete: true },
        },
        generatedComponent: {
          component: NoteComponent,
          generatedProps: { title: "", content: "", tags: [] },
          interactiveProps: {
            title: "Shopping List",
            content: "Milk, eggs, bread",
            tags: ["groceries"],
          },
        },
        suggestions: [
          {
            title: "Add Categories",
            detailedSuggestion:
              "Would you like to organize your shopping list by categories (produce, dairy, etc.)?",
            components: ["NoteComponent"],
          },
          {
            title: "Create Shopping Schedule",
            detailedSuggestion:
              "I can help you create a regular shopping schedule and set reminders.",
            suggestedTools: ["getCalendar", "createRecurringEvent"],
            components: ["CalendarComponent", "NoteComponent"],
          },
          {
            title: "Share List",
            detailedSuggestion:
              "Would you like to share this shopping list with someone?",
            suggestedTools: ["getContacts", "shareNote"],
            components: ["ShareComponent"],
          },
        ],
      },
    ],
    contextId: "user123-notes",
  },
};
