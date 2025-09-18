import { type ParameterType } from "./types";

/**
 * Validates if a value is valid for the given parameter type
 */
export const validateValue = (value: string, type: ParameterType) => {
  if (!value.trim()) return { isValid: true, error: null }; // Empty values are allowed

  switch (type) {
    case "boolean":
      return {
        isValid: value === "true" || value === "false",
        error:
          value !== "true" && value !== "false"
            ? "Must be 'true' or 'false'"
            : null,
      };

    case "number": {
      const num = parseFloat(value);
      return {
        isValid: !isNaN(num) && isFinite(num),
        error: isNaN(num) || !isFinite(num) ? "Must be a valid number" : null,
      };
    }

    case "array":
      try {
        const parsed = JSON.parse(value);
        return {
          isValid: Array.isArray(parsed),
          error: !Array.isArray(parsed)
            ? "Must be a valid JSON array (e.g., [1, 2, 3])"
            : null,
        };
      } catch {
        return {
          isValid: false,
          error: "Must be valid JSON array format",
        };
      }

    case "object":
      try {
        const parsed = JSON.parse(value);
        const isValidObject =
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed);
        return {
          isValid: isValidObject,
          error: !isValidObject
            ? 'Must be a valid JSON object (e.g., {"key": "value"})'
            : null,
        };
      } catch {
        return {
          isValid: false,
          error: "Must be valid JSON object format",
        };
      }

    case "string":
    default:
      return { isValid: true, error: null };
  }
};

/**
 * Converts string values from form inputs to their proper types for storage.
 * The AI SDK expects proper JSON types, not strings.
 */
export const convertValue = (value: string, type: ParameterType) => {
  if (type === "boolean") return value === "true";
  if (type === "number") {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  if (type === "array") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  if (type === "object") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
        ? parsed
        : undefined;
    } catch {
      return undefined;
    }
  }
  return value;
};

/**
 * Converts a value to a string for UI display, properly handling objects and arrays
 */
export const valueToString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Generates a unique ID for parameter entries.
 * Uses timestamp and random number to ensure uniqueness.
 */
export const generateParameterId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random()}`;
};

/**
 * Detects the type of a value from stored JSON.
 * Used when loading parameters from the database.
 */
export const detectType = (value: unknown): ParameterType => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  return "string";
};

/**
 * Formats a value for display based on its type
 */
export const formatValueForDisplay = (value: string, type: ParameterType) => {
  switch (type) {
    case "boolean":
      return value;
    case "number":
      return value;
    case "array":
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    case "object":
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    case "string":
    default:
      return `"${value}"`;
  }
};

/**
 * Checks if a value should use a textarea (for arrays and objects)
 */
export const shouldUseTextarea = (type: ParameterType) => {
  return type === "array" || type === "object";
};
