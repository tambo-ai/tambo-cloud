"use client";

import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
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
import {
  customLlmParametersSchema,
  PARAMETER_SUGGESTIONS,
} from "@/lib/llm-parameters";
import { api } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

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

type ParameterType = "string" | "number" | "boolean";

/**
 * Represents a single parameter entry in the UI.
 * All values are stored as strings for form inputs, then converted based on type.
 */
interface ParameterEntry {
  key: string;
  value: string; // Always string for input fields
  type: ParameterType;
}

/**
 * Converts string values from form inputs to their proper types for storage.
 * The AI SDK expects proper JSON types, not strings.
 */
const convertValue = (value: string, type: ParameterType): any => {
  if (type === "boolean") return value === "true";
  if (type === "number") {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return value;
};

/**
 * Detects the type of a value from stored JSON.
 * Used when loading parameters from the database.
 */
const detectType = (value: any): ParameterType => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
};

// Parameter row component
interface ParameterRowProps {
  param: ParameterEntry;
  index: number;
  onUpdate: (index: number, field: keyof ParameterEntry, value: string) => void;
  onRemove: (index: number) => void;
}

const ParameterRow = ({
  param,
  index,
  onUpdate,
  onRemove,
}: ParameterRowProps) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className="flex gap-2 items-start"
  >
    <Input
      placeholder="Parameter name"
      value={param.key}
      onChange={(e) => onUpdate(index, "key", e.target.value)}
      className="flex-1"
    />
    <Select
      value={param.type}
      onValueChange={(v) => onUpdate(index, "type", v)}
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
        onValueChange={(v) => onUpdate(index, "value", v)}
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
        onChange={(e) => onUpdate(index, "value", e.target.value)}
        className="flex-1"
        type={param.type === "number" ? "number" : "text"}
      />
    )}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onRemove(index)}
      className="text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </motion.div>
);

/**
 * CustomLlmParametersEditor Component
 *
 * Manages custom LLM parameters with a nested storage structure:
 * provider -> model -> parameters
 *
 * Architecture Decision:
 * We store parameters per model rather than per provider because:
 * - Different models may need different optimizations
 * - Users can switch between models without losing settings
 * - Allows fine-tuning for specific use cases per model
 *
 * The trade-off is added complexity in this component and ai-sdk-client.ts,
 * but it provides better UX for power users who need model-specific configs.
 */
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

  // Memoized values
  const providerName = useMemo(
    () => selectedProvider || project?.defaultLlmProviderName || "openai",
    [selectedProvider, project?.defaultLlmProviderName],
  );

  const suggestions = useMemo(
    () =>
      PARAMETER_SUGGESTIONS[providerName] ??
      PARAMETER_SUGGESTIONS["openai-compatible"],
    [providerName],
  );

  const currentProvider = useMemo(
    () => selectedProvider || project?.defaultLlmProviderName,
    [selectedProvider, project?.defaultLlmProviderName],
  );

  const currentModel = useMemo(
    () => selectedModel || project?.defaultLlmModelName,
    [selectedModel, project?.defaultLlmModelName],
  );

  /**
   * Extracts parameters from the nested storage structure.
   *
   * Storage format: provider -> model -> parameters
   * This nested structure allows:
   * - Different parameter sets for different models (GPT-4 vs GPT-3.5)
   * - Preserving settings when switching between models
   * - Model-specific optimizations
   *
   * @example
   * Input: { "openai": { "gpt-4": { "temperature": 0.7 } } }
   * Output: [{ key: "temperature", value: "0.7", type: "number" }]
   */
  const extractParameters = useCallback(
    (
      customParams: any,
      provider?: string | null,
      model?: string | null,
    ): ParameterEntry[] => {
      if (!customParams || !provider || !model) return [];
      const modelParams = customParams[provider]?.[model];
      if (!modelParams || typeof modelParams !== "object") return [];

      return Object.entries(modelParams).map(([key, value]) => ({
        key,
        value: String(value), // Convert to string for input fields
        type: detectType(value),
      }));
    },
    [],
  );

  // Initialize parameters from project data
  useEffect(() => {
    const params = extractParameters(
      project?.customLlmParameters,
      currentProvider,
      currentModel,
    );
    setParameters(params);
    setHasUnsavedChanges(false);
  }, [
    project?.customLlmParameters,
    currentProvider,
    currentModel,
    extractParameters,
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

  const handleSave = useCallback(() => {
    if (!project || !currentProvider || !currentModel) return;

    /**
     * Convert UI parameters (all strings) back to their proper types.
     * This ensures the stored JSON has correct types for the AI SDK.
     * The AI SDK expects: { "temperature": 0.7 } not { "temperature": "0.7" }
     */
    const parametersObject = parameters.reduce<Record<string, any>>(
      (acc, param) => {
        if (param.key) {
          const converted = convertValue(param.value, param.type);
          if (converted !== undefined) {
            acc[param.key] = converted;
          }
        }
        return acc;
      },
      {},
    );

    /**
     * Build the nested structure for storage: provider -> model -> parameters
     *
     * Why this complex structure?
     * 1. Users may want different settings for different models
     *    (e.g., creative writing with GPT-4, factual responses with GPT-3.5)
     * 2. Preserves settings when switching between models
     * 3. Allows model-specific optimizations
     *
     * Note: The AI SDK expects provider -> parameters (flat),
     * so ai-sdk-client.ts extracts the current model's params:
     * this.customLlmParameters?.[providerKey]?.[this.model]
     */
    const existingParams = project.customLlmParameters || {};
    let customLlmParameters: z.infer<typeof customLlmParametersSchema> | null =
      null;

    if (Object.keys(parametersObject).length > 0) {
      // Add/update parameters for the current model
      customLlmParameters = {
        ...existingParams,
        [currentProvider]: {
          ...existingParams[currentProvider],
          [currentModel]: parametersObject,
        },
      };
    } else if (existingParams[currentProvider]?.[currentModel]) {
      // User cleared all parameters - remove this model's config
      const { [currentModel]: _, ...otherModels } =
        existingParams[currentProvider];

      if (Object.keys(otherModels).length > 0) {
        // Keep other models' parameters for this provider
        customLlmParameters = {
          ...existingParams,
          [currentProvider]: otherModels,
        };
      } else {
        // No models left for this provider - remove the provider entirely
        const { [currentProvider]: _, ...otherProviders } = existingParams;
        customLlmParameters =
          Object.keys(otherProviders).length > 0 ? otherProviders : null;
      }
    } else {
      // No changes needed - preserve existing parameters
      customLlmParameters =
        Object.keys(existingParams).length > 0 ? existingParams : null;
    }

    updateProject.mutate({
      projectId: project.id,
      customLlmParameters,
    });
  }, [project, currentProvider, currentModel, parameters, updateProject]);

  const handleCancel = useCallback(() => {
    const params = extractParameters(
      project?.customLlmParameters,
      currentProvider,
      currentModel,
    );
    setParameters(params);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, [
    project?.customLlmParameters,
    currentProvider,
    currentModel,
    extractParameters,
  ]);

  const addParameter = useCallback(() => {
    setParameters((prev) => [...prev, { key: "", value: "", type: "string" }]);
    setHasUnsavedChanges(true);
  }, []);

  const removeParameter = useCallback((index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  }, []);

  const updateParameter = useCallback(
    (index: number, field: keyof ParameterEntry, value: string) => {
      setParameters((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
      setHasUnsavedChanges(true);
    },
    [],
  );

  const applySuggestion = useCallback(
    (suggestion: { key: string; type: string }) => {
      if (parameters.some((p) => p.key === suggestion.key)) {
        toast({ description: `Parameter "${suggestion.key}" already exists` });
        return;
      }

      const defaultValue =
        suggestion.type === "boolean"
          ? "false"
          : suggestion.type === "number"
            ? "0"
            : "";

      setParameters((prev) => [
        ...prev,
        {
          key: suggestion.key,
          value: defaultValue,
          type: suggestion.type as ParameterType,
        },
      ]);
      setHasUnsavedChanges(true);
    },
    [parameters, toast],
  );

  // Loading state
  if (!project) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-muted rounded w-40" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
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

            {/* Parameter suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Common parameters for {providerName}:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Button
                      key={s.key}
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(s)}
                      className="text-xs"
                      title={s.description}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {s.key}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Parameter list */}
            <div className="space-y-3">
              {parameters.length > 0 ? (
                parameters.map((param, idx) => (
                  <ParameterRow
                    key={idx}
                    param={param}
                    index={idx}
                    onUpdate={updateParameter}
                    onRemove={removeParameter}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom parameters configured.
                </p>
              )}
            </div>

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
                  {parameters.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-medium">{p.key}:</span>
                      <span className="text-muted-foreground">
                        {p.type === "string" ? `"${p.value}"` : p.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({p.type})
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
