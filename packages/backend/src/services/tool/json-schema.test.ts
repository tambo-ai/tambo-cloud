import { JSONSchema7Definition } from "json-schema";
import { sanitizeJSONSchemaProperties } from "./json-schema";

describe("sanitizeJSONSchemaProperties", () => {
  it("should handle empty properties object", () => {
    const result = sanitizeJSONSchemaProperties({}, []);
    expect(result).toEqual({});
  });

  it("should sanitize simple string property", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      name: {
        type: "string",
        description: "User name",
      },
    });
  });

  it("should handle required properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      name: { type: "string", description: "User name" },
      age: { type: "number", description: "User age" },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["name"]);
    expect(result).toEqual({
      name: {
        type: "string",
        description: "User name",
      },
      age: {
        type: "number",
        description: "User age",
      },
    });
  });

  it("should handle nested object properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      user: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["user"]);
    expect(result).toEqual({
      user: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
        additionalProperties: false,
      },
    });
  });

  it("should handle array properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      tags: {
        type: "array",
        items: { type: "string" },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["tags"]);
    expect(result).toEqual({
      tags: {
        type: "array",
        items: { type: "string" },
      },
    });
  });

  it("should remove format and default properties", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      email: {
        type: "string",
        format: "email",
        default: "test@example.com",
        description: "User email",
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["email"]);
    expect(result).toEqual({
      email: {
        type: "string",
        description: "User email",
      },
    });
  });

  it("should handle boolean schema definitions", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      isActive: true,
      isArchived: false,
    };
    const result = sanitizeJSONSchemaProperties(properties, ["isActive"]);
    expect(result).toEqual({
      isActive: true,
      isArchived: {
        anyOf: [{ type: "null" }, false],
      },
    });
  });

  it("should handle array with multiple item types", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      mixed: {
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, ["mixed"]);
    expect(result).toEqual({
      mixed: {
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      },
    });
  });

  it("should handle non-required object properties by adding null type option", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      profile: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      profile: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name", "age"],
            additionalProperties: false,
          },
        ],
      },
    });
  });

  it("should handle non-required array properties by adding null type option", () => {
    const properties: Record<string, JSONSchema7Definition> = {
      hobbies: {
        type: "array",
        items: { type: "string" },
        description: "List of hobbies",
      },
    };
    const result = sanitizeJSONSchemaProperties(properties, []);
    expect(result).toEqual({
      hobbies: {
        anyOf: [
          { type: "null" },
          {
            type: "array",
            items: { type: "string" },
            description: "List of hobbies",
          },
        ],
      },
    });
  });
});
