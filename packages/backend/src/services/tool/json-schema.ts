import { JSONSchema7Definition } from "json-schema";

/** Sanitizes a JSON Schema object to ensure it is valid for OpenAI function calling. */
export function sanitizeJSONSchemaProperties(
  properties: Record<string, JSONSchema7Definition>,
) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      return [key, sanitizeJSONSchemaProperty(value)] as const;
    }),
  );
}
export function sanitizeJSONSchemaProperty(
  property: JSONSchema7Definition,
): JSONSchema7Definition {
  if (typeof property === "boolean") {
    return property;
  }
  const { format: _format, default: _default, ...restOfProperty } = property;
  if (property.type === "object") {
    return {
      ...restOfProperty,
      properties: sanitizeJSONSchemaProperties(
        (property.properties ?? {}) as Record<string, JSONSchema7Definition>,
      ),
      required: Object.keys(restOfProperty.properties || {}),
      additionalProperties: false,
    };
  }
  if (property.type === "array") {
    return {
      ...restOfProperty,
      items: Array.isArray(property.items)
        ? property.items.map(sanitizeJSONSchemaProperty)
        : sanitizeJSONSchemaProperty(property.items as JSONSchema7Definition),
    };
  }
  return restOfProperty;
}
