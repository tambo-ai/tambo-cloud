"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { customLlmParametersSchema } from "@/lib/llm-parameters";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

// Common parameter suggestions based on provider
// These parameters are passed directly to the provider's API as providerOptions
// See: https://ai-sdk.dev/providers/openai-compatible-providers#provider-specific-options
const PARAMETER_SUGGESTIONS: Record<
  string,
  Array<{ key: string; description: string; type: string }>
> = {
  openai: [
    {
      key: "temperature",
      description: "Controls randomness (0-2)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "frequency_penalty",
      description: "Penalty for repetition (-2 to 2)",
      type: "number",
    },
    {
      key: "presence_penalty",
      description: "Penalty for new topics (-2 to 2)",
      type: "number",
    },
    { key: "seed", description: "Deterministic sampling seed", type: "number" },
    {
      key: "logprobs",
      description: "Include log probabilities",
      type: "boolean",
    },
    {
      key: "top_logprobs",
      description: "Number of log probabilities",
      type: "number",
    },
  ],
  anthropic: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    { key: "top_k", description: "Top K sampling", type: "number" },
  ],
  mistral: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "safe_prompt",
      description: "Enable safety prompt",
      type: "boolean",
    },
  ],
  groq: [
    {
      key: "temperature",
      description: "Controls randomness (0-2)",
      type: "number",
    },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
  ],
  gemini: [
    {
      key: "temperature",
      description: "Controls randomness (0-1)",
      type: "number",
    },
    { key: "topP", description: "Nucleus sampling threshold", type: "number" },
    { key: "topK", description: "Top K sampling", type: "number" },
  ],
  "openai-compatible": [
    { key: "temperature", description: "Controls randomness", type: "number" },
    { key: "top_p", description: "Nucleus sampling threshold", type: "number" },
    {
      key: "frequency_penalty",
      description: "Penalty for repetition",
      type: "number",
    },
    {
      key: "presence_penalty",
      description: "Penalty for new topics",
      type: "number",
    },
    { key: "seed", description: "Deterministic sampling seed", type: "number" },
    {
      key: "max_tokens",
      description: "Maximum tokens to generate",
      type: "number",
    },
    // OpenAI-compatible providers may support various custom parameters
  ],
};

export const CustomLlmParametersEditorSchema = z.object({
  id: z.string().describe("The unique identifier for the project."),
  name: z.string().describe("The name of the project."),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .optional()
    .describe("Custom LLM parameters for different providers"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .optional()
    .describe("The default LLM provider name."),
  defaultLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("The default LLM model name."),
});

export const CustomLlmParametersEditorProps = z.object({
  project: CustomLlmParametersEditorSchema.nullable()
    .optional()
    .describe(
      "The project object containing the custom LLM parameters. If null or undefined, the component will show a loading state.",
    ),
  selectedProvider: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The currently selected provider from the dropdown. If provided, this takes precedence over the project's default provider.",
    ),
  selectedModel: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The currently selected model from the dropdown. If provided, this takes precedence over the project's default model.",
    ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Callback function to be called when the parameters are successfully saved.",
    ),
});

interface CustomLlmParametersEditorProps {
  project?: z.infer<typeof CustomLlmParametersEditorSchema> | null;
  selectedProvider?: string | null;
  selectedModel?: string | null;
  onEdited?: () => void;
}

interface ParameterEntry {
  key: string;
  value: string;
  type: "string" | "number" | "boolean";
}

export function CustomLlmParametersEditor({
  project,
  selectedProvider,
  selectedModel,
  onEdited,
}: CustomLlmParametersEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState<ParameterEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get provider-specific suggestions
  const providerName =
    selectedProvider || project?.defaultLlmProviderName || "openai";
  const suggestions =
    PARAMETER_SUGGESTIONS[providerName] ??
    PARAMETER_SUGGESTIONS["openai-compatible"];

  // Initialize parameters from project data
  useEffect(() => {
    if (project?.customLlmParameters) {
      // Use selectedProvider if provided, otherwise fall back to project's default provider
      const currentProvider =
        selectedProvider || project.defaultLlmProviderName;
      // Use selectedModel if provided, otherwise fall back to project's default model
      const currentModel = selectedModel || project.defaultLlmModelName;

      if (currentProvider && currentModel) {
        // Extract parameters for the current provider and model combination
        const providerParams = project.customLlmParameters[currentProvider];
        const modelParams = providerParams?.[currentModel];

        if (modelParams && typeof modelParams === "object") {
          const entries = Object.entries(modelParams).map(([key, value]) => ({
            key,
            value: String(value),
            type:
              typeof value === "boolean"
                ? "boolean"
                : typeof value === "number"
                  ? "number"
                  : "string",
          })) as ParameterEntry[];
          setParameters(entries);
        } else {
          setParameters([]);
        }
      } else {
        setParameters([]);
      }
    } else {
      setParameters([]);
    }
    setHasUnsavedChanges(false);
  }, [
    project?.customLlmParameters,
    project?.defaultLlmProviderName,
    project?.defaultLlmModelName,
    selectedProvider,
    selectedModel,
  ]);

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setHasUnsavedChanges(false);
      toast({
        description: "Custom parameters saved successfully",
      });
      if (onEdited) {
        onEdited();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving parameters",
        description: error.message,
      });
    },
  });

  const handleSave = async () => {
    if (!project) return;

    // Convert parameters array to object with proper types
    const parametersObject: Record<string, any> = {};
    for (const param of parameters) {
      if (param.key) {
        if (param.type === "boolean") {
          parametersObject[param.key] = param.value === "true";
        } else if (param.type === "number") {
          const num = parseFloat(param.value);
          if (!isNaN(num)) {
            parametersObject[param.key] = num;
          }
        } else {
          parametersObject[param.key] = param.value;
        }
      }
    }

    // Get the current provider and model
    const currentProvider =
      selectedProvider || project.defaultLlmProviderName || "openai";
    const currentModel = selectedModel || project.defaultLlmModelName || "";

    // Create nested structure with provider -> model -> parameters
    // Preserve existing parameters for other providers and models
    const existingParams = project.customLlmParameters || {};

    let customLlmParameters: z.infer<typeof customLlmParametersSchema> | null =
      null;

    if (Object.keys(parametersObject).length > 0) {
      // Add/update parameters for current provider and model
      customLlmParameters = {
        ...existingParams,
        [currentProvider]: {
          ...existingParams[currentProvider],
          [currentModel]: parametersObject,
        },
      };
    } else if (existingParams[currentProvider]?.[currentModel]) {
      // Remove parameters for current provider and model but keep others
      const providerParams = existingParams[currentProvider];
      const { [currentModel]: _, ...otherModels } = providerParams;

      if (Object.keys(otherModels).length > 0) {
        // Keep other models for this provider
        customLlmParameters = {
          ...existingParams,
          [currentProvider]: otherModels,
        };
      } else {
        // Remove entire provider if no models left
        const { [currentProvider]: _, ...otherProviders } = existingParams;
        customLlmParameters =
          Object.keys(otherProviders).length > 0 ? otherProviders : null;
      }
    } else {
      // No changes needed, keep existing
      customLlmParameters =
        Object.keys(existingParams).length > 0 ? existingParams : null;
    }

    updateProject.mutate({
      projectId: project.id,
      customLlmParameters,
    });
  };

  const handleCancel = () => {
    // Reset to original values
    if (project?.customLlmParameters) {
      // Use selectedProvider if provided, otherwise fall back to project's default provider
      const currentProvider =
        selectedProvider || project.defaultLlmProviderName;
      // Use selectedModel if provided, otherwise fall back to project's default model
      const currentModel = selectedModel || project.defaultLlmModelName;

      if (currentProvider && currentModel) {
        const providerParams = project.customLlmParameters[currentProvider];
        const modelParams = providerParams?.[currentModel];

        if (modelParams && typeof modelParams === "object") {
          const entries = Object.entries(modelParams).map(([key, value]) => ({
            key,
            value: String(value),
            type:
              typeof value === "boolean"
                ? "boolean"
                : typeof value === "number"
                  ? "number"
                  : "string",
          })) as ParameterEntry[];
          setParameters(entries);
        } else {
          setParameters([]);
        }
      } else {
        setParameters([]);
      }
    } else {
      setParameters([]);
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const addParameter = () => {
    setParameters([...parameters, { key: "", value: "", type: "string" }]);
    setHasUnsavedChanges(true);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateParameter = (
    index: number,
    field: keyof ParameterEntry,
    value: string,
  ) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
    setHasUnsavedChanges(true);
  };

  const applySuggestion = (suggestion: { key: string; type: string }) => {
    // Check if parameter already exists
    const existingIndex = parameters.findIndex((p) => p.key === suggestion.key);
    if (existingIndex >= 0) {
      toast({
        description: `Parameter "${suggestion.key}" already exists`,
      });
      return;
    }

    // Add the suggested parameter with default value
    const defaultValue =
      suggestion.type === "boolean"
        ? "false"
        : suggestion.type === "number"
          ? "0"
          : "";
    setParameters([
      ...parameters,
      {
        key: suggestion.key,
        value: defaultValue,
        type: suggestion.type as ParameterEntry["type"],
      },
    ]);
    setHasUnsavedChanges(true);
  };

  // If project is undefined, show a loading state
  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-4"
          >
            <CardDescription className="text-sm text-foreground max-w-sm mb-4">
              Add custom parameters to send with each LLM request. These will be
              passed as provider options.
            </CardDescription>

            {/* Suggestions for common parameters */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Common parameters for {providerName}:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.key}
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      className="text-xs"
                      title={suggestion.description}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {suggestion.key}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Parameter list */}
            {parameters.length > 0 ? (
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-2 items-start"
                  >
                    <Input
                      placeholder="Parameter name"
                      value={param.key}
                      onChange={(e) =>
                        updateParameter(index, "key", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Select
                      value={param.type}
                      onValueChange={(value) =>
                        updateParameter(index, "type", value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                    {param.type === "boolean" ? (
                      <Select
                        value={param.value}
                        onValueChange={(value) =>
                          updateParameter(index, "value", value)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={param.type === "number" ? "0" : "Value"}
                        value={param.value}
                        onChange={(e) =>
                          updateParameter(index, "value", e.target.value)
                        }
                        className="flex-1"
                        type={param.type === "number" ? "number" : "text"}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* No parameters - show nothing */
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No custom parameters configured.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-between gap-2 pt-2"
            >
              <Button
                variant="outline"
                onClick={addParameter}
                disabled={updateProject.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={updateProject.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProject.isPending || !hasUnsavedChanges}
                >
                  {updateProject.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="view-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1 space-y-3">
              <CardDescription className="text-sm text-foreground max-w-sm">
                Custom parameters sent with each LLM request.
              </CardDescription>

              {parameters.length > 0 ? (
                <div className="space-y-2">
                  {parameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="font-mono font-medium">
                        {param.key}:
                      </span>
                      <span className="text-muted-foreground">
                        {param.type === "string" && `"${param.value}"`}
                        {param.type === "number" && param.value}
                        {param.type === "boolean" && param.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({param.type})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom parameters configured.
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex-shrink-0"
            >
              {parameters.length > 0 ? "Edit Parameters" : "Add Parameters"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
