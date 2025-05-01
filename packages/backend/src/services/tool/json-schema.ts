import { JSONSchema7Definition } from "json-schema";

/** Sanitizes a JSON Schema object to ensure it is valid for OpenAI function calling. */
export function sanitizeJSONSchemaProperties(
  properties: Record<string, JSONSchema7Definition>,
  requiredProperties: string[],
) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      return [
        key,
        sanitizeJSONSchemaProperty(value, requiredProperties.includes(key)),
      ] as const;
    }),
  );
}
export function sanitizeJSONSchemaProperty(
  property: JSONSchema7Definition,
  isRequired: boolean,
): JSONSchema7Definition {
  if (typeof property === "boolean") {
    if (isRequired) {
      return property;
    }
    return {
      anyOf: [
        {
          type: "null",
        },
        property,
      ],
    };
  }
  const { format: _format, default: _default, ...restOfProperty } = property;
  if (property.type === "object") {
    const objectProperty = {
      ...restOfProperty,
      properties: sanitizeJSONSchemaProperties(
        (property.properties ?? {}) as Record<string, JSONSchema7Definition>,
        Object.keys(restOfProperty.properties || {}),
      ),
      required: Object.keys(restOfProperty.properties || {}),
      additionalProperties: false,
    };
    if (isRequired) {
      return objectProperty;
    }
    return {
      anyOf: [{ type: "null" }, objectProperty],
    };
  }
  if (property.type === "array") {
    const arrayProperty = {
      ...restOfProperty,
      items: Array.isArray(property.items)
        ? property.items.map((item) =>
            sanitizeJSONSchemaProperty(item, isRequired),
          )
        : sanitizeJSONSchemaProperty(
            property.items as JSONSchema7Definition,
            isRequired,
          ),
    };
    if (isRequired) {
      return arrayProperty;
    }
    return {
      anyOf: [{ type: "null" }, arrayProperty],
    };
  }
  return restOfProperty;
}
