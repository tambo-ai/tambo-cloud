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
import { PARAMETER_SUGGESTIONS } from "@/lib/llm-parameters";
import { api, RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CustomLlmParametersEditorProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
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
  id: string;
  key: string;
  value: string; // Always string for input fields
  type: ParameterType;
}

/**
 * Converts string values from form inputs to their proper types for storage.
 * The AI SDK expects proper JSON types, not strings.
 */
const convertValue = (
  value: string,
  type: ParameterType,
): string | number | boolean | undefined => {
  if (type === "boolean") return value === "true";
  if (type === "number") {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return value;
};

/**
 * Generates a unique ID for parameter entries.
 * Uses timestamp and random number to ensure uniqueness.
 */
const generateParameterId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random()}`;
};

/**
 * Detects the type of a value from stored JSON.
 * Used when loading parameters from the database.
 */
const detectType = (value: unknown): ParameterType => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
};

/**
 * ParameterSuggestions Component - Displays clickable parameter suggestions
 */
interface ParameterSuggestionsProps {
  providerName: string;
  suggestions: Array<{ key: string; type: string; description?: string }>;
  onApply: (suggestion: { key: string; type: string }) => void;
}

function ParameterSuggestions({
  providerName,
  suggestions,
  onApply,
}: ParameterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
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
            onClick={() => onApply(s)}
            className="text-xs"
            title={s.description}
          >
            <Plus className="h-3 w-3 mr-1" />
            {s.key}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * ViewMode Component - Read-only display mode for parameters
 * Shows loading placeholders when project data is not yet available
 */
interface ViewModeProps {
  parameters: ParameterEntry[];
  onEdit: () => void;
  isLoading?: boolean;
}

function ViewMode({ parameters, onEdit, isLoading }: ViewModeProps) {
  return (
    <motion.div
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

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse" />
          </div>
        ) : parameters.length > 0 ? (
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
        onClick={onEdit}
        className="flex-shrink-0"
        disabled={isLoading}
      >
        {parameters.length > 0 ? "Edit Parameters" : "Add Parameters"}
      </Button>
    </motion.div>
  );
}

/**
 * EditMode Component - Interactive edit mode for managing parameters
 * Handles adding, modifying, and removing parameters with per-row editing state
 */
interface EditModeProps {
  parameters: ParameterEntry[];
  providerName: string;
  suggestions: Array<{ key: string; type: string; description?: string }>;
  isPending: boolean;
  activeEditIndex: number | null;
  onParametersChange: (index: number, updatedParam: ParameterEntry) => void;
  onBeginEdit: (index: number) => void;
  onRemoveRow: (index: number) => void;
  onAddParameter: () => void;
  onApplySuggestion: (suggestion: { key: string; type: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  allowCustomParameters?: boolean;
}

function EditMode({
  parameters,
  providerName,
  suggestions,
  isPending,
  activeEditIndex,
  onParametersChange,
  onBeginEdit,
  onRemoveRow,
  onAddParameter,
  onApplySuggestion,
  onSave,
  onCancel,
  allowCustomParameters = true,
}: EditModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-4"
    >
      <CardDescription className="text-sm text-foreground max-w-sm mb-4">
        {allowCustomParameters
          ? "Add custom parameters to send with each LLM request. These will be passed as provider options."
          : "Add parameters from the suggestions below. Custom parameters are only available for OpenAI-compatible providers."}
      </CardDescription>

      <ParameterSuggestions
        providerName={providerName}
        suggestions={suggestions}
        onApply={onApplySuggestion}
      />

      <div className="space-y-3">
        {parameters.length > 0 ? (
          <AnimatePresence>
            {parameters.map((param, idx) => (
              <ParameterRow
                key={param.id}
                index={idx}
                param={param}
                isEditing={activeEditIndex === idx}
                onBeginEdit={onBeginEdit}
                onRemoveRow={onRemoveRow}
                onParameterChange={onParametersChange}
                allowCustomParameters={allowCustomParameters}
              />
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-sm text-muted-foreground">
            No custom parameters configured.
          </p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-between gap-2 pt-2"
      >
        {allowCustomParameters && (
          <Button
            variant="outline"
            onClick={onAddParameter}
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * ParameterRow Component - Individual parameter entry with self-contained state
 */
interface ParameterRowProps {
  index: number;
  param: ParameterEntry;
  isEditing: boolean;
  onBeginEdit: (rowIndex: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  onParameterChange: (index: number, updatedParam: ParameterEntry) => void;
  allowCustomParameters?: boolean;
}

function ParameterRow({
  index,
  param,
  isEditing,
  onBeginEdit,
  onRemoveRow,
  onParameterChange,
  allowCustomParameters = true,
}: ParameterRowProps) {
  const [local, setLocal] = useState<ParameterEntry>(param);

  // Reset local state when param changes from parent
  useEffect(() => {
    if (!isEditing) {
      setLocal(param);
    }
  }, [param, isEditing]);

  const handleChange = (field: keyof ParameterEntry, value: string) => {
    if (!isEditing) onBeginEdit(index);
    const updatedParam = { ...local, [field]: value };
    setLocal(updatedParam);
    onParameterChange(index, updatedParam);
  };

  // Check if this parameter was added from suggestions (exists in PARAMETER_SUGGESTIONS)
  const isFromSuggestions = useMemo(() => {
    return Object.values(PARAMETER_SUGGESTIONS).some((suggestions) =>
      suggestions.some((s) => s.key === param.key),
    );
  }, [param.key]);

  // For parameters from suggestions: only allow value editing
  // For custom parameters: allow full editing only if allowCustomParameters is true
  const canEditKey = allowCustomParameters && !isFromSuggestions;
  const canEditType = allowCustomParameters && !isFromSuggestions;
  const canEditValue = true; // Values can always be edited

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 },
      }}
    >
      <div className="flex gap-2 items-start">
        <Input
          placeholder="Parameter name"
          value={local.key}
          onChange={(e) => handleChange("key", e.target.value)}
          className="flex-1 focus:ring-inset"
          disabled={!canEditKey}
        />
        <Select
          value={local.type}
          onValueChange={(v) => handleChange("type", v as ParameterType)}
          disabled={!canEditType}
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

        {local.type === "boolean" ? (
          <Select
            value={local.value}
            onValueChange={(v) => handleChange("value", v)}
            disabled={!canEditValue}
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
            placeholder={local.type === "number" ? "0" : "Value"}
            value={local.value}
            onChange={(e) => handleChange("value", e.target.value)}
            className="flex-1"
            type={local.type === "number" ? "number" : "text"}
            step={local.type === "number" ? "0.01" : undefined}
            disabled={!canEditValue}
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveRow(index)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

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
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

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

  // Determine if custom parameters are allowed for this provider
  // Only OpenAI-compatible providers can add custom parameters
  const allowCustomParameters = useMemo(
    () => providerName === "openai-compatible",
    [providerName],
  );

  /**
   * Extracts parameters from the nested storage structure (provider -> model -> parameters)
   * and converts them to the UI format for editing
   */
  const extractParameters = useCallback(
    (
      customParams: unknown,
      provider?: string | null,
      model?: string | null,
    ): ParameterEntry[] => {
      if (!customParams || !provider || !model) return [];
      if (typeof customParams !== "object") return [];

      const providerParams = (customParams as Record<string, unknown>)[
        provider
      ];
      if (!providerParams || typeof providerParams !== "object") return [];

      const modelParams = (providerParams as Record<string, unknown>)[model];
      if (!modelParams || typeof modelParams !== "object") return [];

      return Object.entries(modelParams).map(([key, value]) => ({
        id: generateParameterId(key),
        key,
        value: String(value),
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
    setActiveEditIndex(null);
  }, [
    project?.customLlmParameters,
    currentProvider,
    currentModel,
    extractParameters,
  ]);

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setActiveEditIndex(null);
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

    // Convert UI parameters back to their proper types
    const parametersObject = Object.fromEntries(
      parameters
        .filter((p) => p.key)
        .map((p) => [p.key, convertValue(p.value, p.type)])
        .filter(([_, v]) => v !== undefined),
    ) as Record<string, string | number | boolean>;

    const existingParams = project.customLlmParameters ?? {};
    const hasNewParams = Object.keys(parametersObject).length > 0;

    // Get existing parameters for current provider
    const currentProviderParams = existingParams[currentProvider] ?? {};

    // Extract other models (excluding current model)
    const { [currentModel]: _, ...otherModels } = currentProviderParams;
    const hasOtherModels = Object.keys(otherModels).length > 0;

    // Determine updated parameters for this provider
    let updatedProviderParams;
    if (hasNewParams) {
      // Case A: User added new parameters
      updatedProviderParams = {
        ...currentProviderParams, // Keep existing model params
        [currentModel]: parametersObject, // Add/update current model
      };
    } else if (hasOtherModels) {
      // Case B: No new params, but other models exist for this provider
      updatedProviderParams = otherModels; // Keep other models
    } else {
      // Case C: No params and no other models
      updatedProviderParams = null; // Remove provider entirely
    }

    // Extract other providers (excluding current provider)
    const { [currentProvider]: __, ...otherProviders } = existingParams;
    const hasOtherProviders = Object.keys(otherProviders).length > 0;

    let customLlmParameters;
    if (updatedProviderParams) {
      // Provider still has params - merge back
      customLlmParameters = {
        ...existingParams,
        [currentProvider]: updatedProviderParams,
      };
    } else if (hasOtherProviders) {
      // No params for current provider, but other providers exist
      customLlmParameters = otherProviders;
    } else {
      // No params anywhere
      customLlmParameters = null;
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
    setActiveEditIndex(null);
  }, [
    project?.customLlmParameters,
    currentProvider,
    currentModel,
    extractParameters,
  ]);

  const handleBeginEdit = useCallback((rowIndex: number) => {
    setActiveEditIndex(rowIndex);
  }, []);

  const handleRemoveRow = useCallback((rowIndex: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== rowIndex));
    setActiveEditIndex(null);
  }, []);

  const handleAddParameter = useCallback(() => {
    // Only allow adding parameters for OpenAI-compatible providers
    if (!allowCustomParameters) {
      toast({
        variant: "destructive",
        title: "Custom parameters not allowed",
        description:
          "Custom parameters are only available for OpenAI-compatible providers. Please use the suggested parameters instead.",
      });
      return;
    }

    const newParams = [
      ...parameters,
      {
        id: generateParameterId("new"),
        key: "",
        value: "",
        type: "string" as ParameterType,
      },
    ];
    setParameters(newParams);
    setActiveEditIndex(newParams.length - 1);
  }, [parameters, allowCustomParameters, toast]);

  const handleApplySuggestion = useCallback(
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

      const newParams = [
        ...parameters,
        {
          id: generateParameterId(suggestion.key),
          key: suggestion.key,
          value: defaultValue,
          type: suggestion.type as ParameterType,
        },
      ];
      setParameters(newParams);
      setActiveEditIndex(newParams.length - 1);
    },
    [parameters, toast],
  );

  const handleParameterChange = useCallback(
    (index: number, updatedParam: ParameterEntry) => {
      setParameters((prev) =>
        prev.map((p, i) => (i === index ? updatedParam : p)),
      );
    },
    [],
  );

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <EditMode
            key="edit-mode"
            parameters={parameters}
            providerName={providerName}
            suggestions={suggestions}
            isPending={updateProject.isPending}
            activeEditIndex={activeEditIndex}
            onParametersChange={handleParameterChange}
            onBeginEdit={handleBeginEdit}
            onRemoveRow={handleRemoveRow}
            onAddParameter={handleAddParameter}
            onApplySuggestion={handleApplySuggestion}
            onSave={handleSave}
            onCancel={handleCancel}
            allowCustomParameters={allowCustomParameters}
          />
        ) : (
          <ViewMode
            key="view-mode"
            parameters={parameters}
            onEdit={() => project && setIsEditing(true)}
            isLoading={!project}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
