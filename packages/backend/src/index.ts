export * from "./model";
export * from "./services/suggestion/suggestion.types";
export { getToolsFromSources } from "./services/tool/tool-service";
export type * from "./systemTools";
export { generateChainId, default as TamboBackend } from "./tambo-backend";
export { llmProviderConfig } from "./config/llm.config";
export { type LlmProviderConfig } from "./config/llm-config-types";

// Email utilities (TAM-199)
export {
  sendEmail,
  type SendEmailOptions,
  type SendEmailResult,
} from "./email/sendEmail";
export {
  EMAIL_JOB_NAME,
  enqueueEmail,
  initEmailQueue,
  attachEmailWorker,
  type EmailJobPayload,
} from "./email/queue";
export { startEmailWorker } from "./email/worker";
