import { createPromptTemplate } from "@tambo-ai-cloud/core";
import Ajv from "ajv";
import draft7MetaSchema from "ajv/dist/refs/json-schema-draft-07.json";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { AvailableComponents } from "../model/component-metadata";

const ajv = new Ajv({ strict: true });

function isValidJSONSchema(schema: any) {
  if (!schema || typeof schema !== "object") {
    return false;
  }
  return ajv.validate(draft7MetaSchema, schema);
}
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

type PropInfo =
  | string
  | {
      type?: string;
      description?: string;
      required?: boolean;
    }
  | null;

const formatPropInfo = (propName: string, propInfo?: PropInfo): string => {
  if (propInfo === null) {
    return `${propName}: unknown`;
  }

  if (typeof propInfo === "string") {
    return `${propName}: ${propInfo}`;
  }

  const typeStr = String(propInfo?.type || "");

  const description =
    typeof propInfo === "object" && propInfo?.description
      ? ` - ${propInfo.description}`
      : "";

  const required =
    typeof propInfo === "object" && propInfo?.required ? " (required)" : "";

  return `${propName}: ${typeStr}${required}${description}`;
};

const formatComponentProps = (
  props: Record<string, PropInfo> | z.ZodType | undefined,
  indentStr = "",
): string => {
  if (!props || Object.keys(props).length === 0) {
    return "";
  }

  if (props instanceof z.ZodType) {
    const jsonSchema = zodToJsonSchema(props);
    const indentedJsonSchema = JSON.stringify(jsonSchema, null, 2).replace(
      /\n/g,
      `\n${indentStr}`,
    );
    return `${indentStr}${indentedJsonSchema}`;
  }
  if (isValidJSONSchema(props)) {
    const indentedJsonSchema = JSON.stringify(props, null, 2).replace(
      /\n/g,
      `\n${indentStr}`,
    );
    return `${indentStr}${indentedJsonSchema}`;
  }

  const propsWithDetails = Object.entries(props)
    .map(([propName, propInfo]) => formatPropInfo(propName, propInfo))
    .join(", ");

  return ` (Props: ${propsWithDetails})`;
};

const formatComponent = (component: {
  name: string;
  description: string;
  props?: Record<string, PropInfo> | z.ZodType;
}): string => {
  const propsStr = formatComponentProps(component.props, "    ");
  return `
- componentName: "${component.name}":
    description: ${component.description}
    props:
${propsStr}`;
};

export const generateAvailableComponentsList = (
  availableComponents: AvailableComponents,
): string =>
  Object.values(availableComponents).map(formatComponent).join("\n") + "\n";

export function getAvailableComponentsPromptTemplate(
  availableComponents: AvailableComponents,
) {
  const availableComponentsStr =
    Object.keys(availableComponents).length > 0
      ? generateAvailableComponentsList(availableComponents)
      : "No components available, do not try and generate a component.";
  return createPromptTemplate(
    `You may use only the following components:
{availableComponents}`,
    { availableComponents: availableComponentsStr },
  );
}

export function generateAvailableComponentsPrompt(
  availableComponents: AvailableComponents,
): string {
  const template = getAvailableComponentsPromptTemplate(availableComponents);
  return replaceTemplateVariables(template.template, template.args);
}
