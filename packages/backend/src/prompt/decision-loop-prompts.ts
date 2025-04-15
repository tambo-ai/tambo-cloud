import { createPromptTemplate } from "@tambo-ai-cloud/core";

export function generateDecisionLoopPrompt() {
  return createPromptTemplate(
    `
    respond with hello
    `,
    {},
  );
}
