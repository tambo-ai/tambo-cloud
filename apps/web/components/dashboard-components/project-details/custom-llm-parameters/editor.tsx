"use client";

import { useToast } from "@/hooks/use-toast";
import {
  generateParameterId,
  convertValue,
  getDefaultValueForType,
  validateValue,
  extractParameters,
} from "./utils";
import { api, RouterOutputs } from "@/trpc/react";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditMode, ViewMode } from "./editor-modes";
import { PARAMETER_SUGGESTIONS, type ParameterEntry } from "./types";

interface CustomLlmParametersEditorProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
  selectedProvider?: string | null;
  selectedModel?: string | null;
  onEdited?: () => void;
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

  const providerName =
    selectedProvider || project?.defaultLlmProviderName || "openai";

  const currentProvider = selectedProvider || project?.defaultLlmProviderName;

  const currentModel = useMemo(() => {
    if (selectedModel) return selectedModel;

    // For OpenAI-compatible providers, use customLlmModelName
    if (providerName === "openai-compatible") {
      return project?.customLlmModelName;
    }

    // For other providers, use defaultLlmModelName
    return project?.defaultLlmModelName;
  }, [
    selectedModel,
    project?.defaultLlmModelName,
    project?.customLlmModelName,
    providerName,
  ]);

  // Determine if custom parameters are allowed for this provider
  // Only OpenAI-compatible providers can add custom parameters
  const allowCustomParameters = providerName === "openai-compatible";

  // Initialize parameters from project data
  useEffect(() => {
    const params = extractParameters(
      project?.customLlmParameters,
      currentProvider,
      currentModel,
    );
    setParameters(params);
    setActiveEditIndex(null);
  }, [project?.customLlmParameters, currentProvider, currentModel]);

  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setActiveEditIndex(null);
      toast({
        variant: "success",
        title: "Success",
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

  const hasValidationErrors = useMemo(() => {
    return parameters.some((p) => {
      // Check if key is empty
      if (!p.key.trim()) {
        return true;
      }
      // Check if value is invalid
      const validation = validateValue(p.value, p.type);
      return !validation.isValid;
    });
  }, [parameters]);

  const handleSave = useCallback(() => {
    if (!project || !currentProvider || !currentModel) return;

    // Convert UI parameters back to their proper types
    const parametersObject = Object.fromEntries(
      parameters
        .filter((p) => p.key)
        .map((p) => [p.key, convertValue(p.value, p.type)])
        .filter(([_, v]) => v !== undefined),
    );

    const existingParams = project.customLlmParameters ?? {};

    const customLlmParameters = {
      ...existingParams,
      [currentProvider]: {
        ...existingParams[currentProvider],
        [currentModel]: parametersObject,
      },
    };

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
  }, [project?.customLlmParameters, currentProvider, currentModel]);

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
        type: "string",
      },
    ];
    setParameters(newParams);
    setActiveEditIndex(newParams.length - 1);
  }, [parameters, allowCustomParameters, toast]);

  const handleApplySuggestion = useCallback(
    (suggestion: { key: string; type: string }) => {
      if (parameters.some((p) => p.key === suggestion.key)) {
        toast({
          variant: "default",
          title: "Info",
          description: `Parameter "${suggestion.key}" already exists`,
        });
        return;
      }

      const newParams = [
        ...parameters,
        {
          id: generateParameterId(suggestion.key),
          key: suggestion.key,
          value: getDefaultValueForType(suggestion.type),
          type: suggestion.type,
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
            suggestions={PARAMETER_SUGGESTIONS}
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
            hasValidationErrors={hasValidationErrors}
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
