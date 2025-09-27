import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

export function toToolSafeName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const prefixed = base.startsWith("run_") ? base : `run_${base}`;
  return prefixed.replace(/_{2,}/g, "_");
}

export function validateToolName(name: string): void {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(
      `Invalid tool name '${name}'. Only letters, numbers, and underscores are allowed.`,
    );
  }
}

/**
 * Build the MCP tool input schema from an agent's parameter schema, adding a
 * secondary `agent` argument for runtime options like `tools`.
 */
export function buildToolInputSchema(paramsSchema?: JSONSchema7): JSONSchema7 {
  const agentToolsSchema: JSONSchema7 = {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        inputSchema: { type: "object" } as JSONSchema7Definition,
      },
      required: ["name"],
      additionalProperties: false,
    },
  };

  return {
    type: "object",
    properties: {
      params: (paramsSchema ?? { type: "object" }) as JSONSchema7Definition,
      agent: {
        type: "object",
        properties: {
          tools: agentToolsSchema as JSONSchema7Definition,
          headers: { type: "object", additionalProperties: { type: "string" } },
        },
        additionalProperties: false,
      } as JSONSchema7Definition,
    },
    required: ["params"],
    additionalProperties: false,
  };
}

/** Minimal schema asking the client to acknowledge an event. */
export const ACK_REQUESTED_SCHEMA: JSONSchema7 = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["accept"] },
  },
  required: ["action"],
  additionalProperties: false,
};
