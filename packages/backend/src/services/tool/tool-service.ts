import OpenAI from "openai";
import {
  AvailableComponent,
  ComponentContextToolMetadata,
  ComponentPropsMetadata,
} from "../../model/component-metadata";

// Public functions
export function convertMetadataToTools(
  toolsMetadata: ComponentContextToolMetadata[],
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return toolsMetadata.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: {
          ...Object.fromEntries(
            tool.parameters.map((parameter) => {
              if (parameter.type === "enum") {
                return [
                  parameter.name,
                  {
                    type: "string",
                    enum: parameter.enumValues || [],
                  },
                ];
              } else if (parameter.type === "array") {
                return [
                  parameter.name,
                  {
                    type: "array",
                    items: { type: parameter.items?.type || "string" },
                  },
                ];
              } else if (parameter.type === "object") {
                return [
                  parameter.name,
                  { type: "object", ...parameter.schema },
                ];
              } else {
                return [parameter.name, { type: parameter.type }];
              }
            }),
          ),
        },
        required: tool.parameters
          .filter((parameter) => parameter.isRequired)
          .map((parameter) => parameter.name),
        additionalProperties: false,
      },
    },
  }));
}

export function convertComponentsToUITools(components: AvailableComponent[]) {
  return components.map((component) => ({
    type: "function" as const,
    function: {
      name: `show_${component.name.toLowerCase().replace(/-/g, "_")}`,
      description: `Show the ${component.name} UI component the user. Here is a description of the component: ${component.description}`,
      parameters: {
        type: "object",
        properties: Object.entries(component.props).reduce<
          Record<string, { type: string; description: string }>
        >(
          (acc, [key, value]) => ({
            ...acc,
            [key]: {
              type: (value as ComponentPropsMetadata).type,
              description:
                (value as ComponentPropsMetadata).description ||
                `Parameter ${key} for ${component.name}`,
            },
          }),
          {},
        ),
        required: Object.keys(component.props).filter(
          (key) => (component.props[key] as ComponentPropsMetadata).isRequired,
        ),
      },
    },
  }));
}
