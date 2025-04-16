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

export function convertComponentsToUITools(
  components: AvailableComponent[],
  toolNamePrefix: string = "show_",
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return components.map((component) => ({
    type: "function" as const,
    function: {
      name: `${toolNamePrefix}${component.name}`,
      description: `Show the ${component.name} UI component the user. Here is a description of the component: ${component.description}`,
      parameters: {
        type: "object",
        properties:
          typeof component.props === "object" && "properties" in component.props
            ? component.props.properties
            : component.props,
        required: Object.entries(component.props)
          .filter(([_, value]) => (value as ComponentPropsMetadata).isRequired)
          .map(([key]) => key),
        additionalProperties: false,
      },
    },
  }));
}
