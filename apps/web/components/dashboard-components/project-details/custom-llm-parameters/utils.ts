import { type ParameterType } from "./types";

/**
 * Validates if a value is valid for the given parameter type
 */
export const validateValue = (value: string, type: ParameterType) => {
  if (!value.trim()) return { isValid: false, error: "Value cannot be empty" }; // Empty values are not allowed

  // Handle string type separately since it doesn't need JSON parsing
  if (type === "string") {
    return { isValid: true, error: null };
  }

  // For all other types, use JSON.parse for validation
  try {
    const parsed = JSON.parse(value);

    switch (type) {
      case "boolean": {
        const isValid = typeof parsed === "boolean";
        return {
          isValid,
          error: isValid ? null : "Must be 'true' or 'false'",
        };
      }

      case "number": {
        const isValidNumber = typeof parsed === "number" && isFinite(parsed);
        return {
          isValid: isValidNumber,
          error: isValidNumber ? null : "Must be a valid number",
        };
      }

      case "array": {
        const isValidArray = Array.isArray(parsed);
        return {
          isValid: isValidArray,
          error: isValidArray
            ? null
            : "Must be a valid JSON array (e.g., [1, 2, 3])",
        };
      }

      case "object": {
        const isValidObject =
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed);
        return {
          isValid: isValidObject,
          error: isValidObject
            ? null
            : 'Must be a valid JSON object (e.g., {"key": "value"})',
        };
      }

      default:
        return { isValid: true, error: null };
    }
  } catch {
    const errorMessages = {
      boolean: "Must be valid JSON boolean format",
      number: "Must be valid JSON number format",
      array: "Must be valid JSON array format",
      object: "Must be valid JSON object format",
    };

    return {
      isValid: false,
      error:
        errorMessages[type as keyof typeof errorMessages] ||
        "Must be valid JSON format",
    };
  }
};

/**
 * Converts string values from form inputs to their proper types for storage.
 * The AI SDK expects proper JSON types, not strings.
 */
export const convertValue = (value: string, type: ParameterType) => {
  // Handle string type separately
  if (type === "string") {
    return value;
  }

  // Use the validation function to check if the value is valid first
  const validation = validateValue(value, type);
  if (!validation.isValid) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
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
  if (Array.isArray(value)) return "array"; // check arrays before objects
  return typeof value as ParameterType; // for boolean, number, object, string
};

/**
 * Formats a value for display based on its type
 */
export const formatValueForDisplay = (value: string, type: ParameterType) => {
  // Handle string type separately to add quotes
  if (type === "string") {
    return `"${value}"`;
  }

  // For other types, use JSON.stringify for consistent formatting
  try {
    const parsed = JSON.parse(value);
    return type === "array" || type === "object"
      ? JSON.stringify(parsed, null, 2)
      : JSON.stringify(parsed);
  } catch {
    // Fallback to original value if parsing fails
    return value;
  }
};

/**
 * Checks if a value should use a textarea (for arrays and objects)
 */
export const shouldUseTextarea = (type: ParameterType) => {
  return type === "array" || type === "object";
};

/**
 * Gets the default value for a given parameter type
 */
export const getDefaultValueForType = (type: ParameterType): string => {
  switch (type) {
    case "boolean":
      return "false";
    case "number":
      return "0";
    case "array":
      return "[]";
    case "object":
      return "{}";
    case "string":
    default:
      return "";
  }
};
