"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { Plus, Trash2, AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomParametersEditorProps {
  project: {
    id: string;
    name: string;
    customLlmParams?: Record<string, unknown>;
  };
  onEdited: () => void;
}

interface ParameterPair {
  id: string;
  key: string;
  value: string;
  error?: string;
}

// Reserved keys that cannot be overridden
const RESERVED_KEYS = new Set([
  "model",
  "messages",
  "tools",
  "tool_choice",
  "stream",
  "response_format",
  "user",
  "system",
  "assistant",
  "function",
  "n",
  "stop",
  "logit_bias",
  "logprobs",
  "top_logprobs",
  "seed",
  "service_tier",
]);

// Common parameter examples for quick insertion
const COMMON_PARAMETERS = [
  {
    key: "temperature",
    value: "0.7",
    description: "Controls randomness (0-2)",
  },
  { key: "top_p", value: "0.9", description: "Nucleus sampling (0-1)" },
  { key: "max_tokens", value: "1000", description: "Maximum response length" },
  {
    key: "presence_penalty",
    value: "0",
    description: "Penalize new topics (-2 to 2)",
  },
  {
    key: "frequency_penalty",
    value: "0",
    description: "Penalize repetition (-2 to 2)",
  },
];

export function CustomParametersEditor({
  project,
  onEdited,
}: CustomParametersEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState<ParameterPair[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    api.project.updateProject.useMutation();

  // Initialize parameters from project data
  useEffect(() => {
    const customParams = project.customLlmParams || {};
    const paramPairs: ParameterPair[] = Object.entries(customParams).map(
      ([key, value], index) => ({
        id: `param-${index}`,
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      }),
    );

    // Add empty row if no parameters exist
    if (paramPairs.length === 0) {
      paramPairs.push({ id: "param-0", key: "", value: "" });
    }

    setParameters(paramPairs);
    setHasChanges(false);
  }, [project.customLlmParams]);

  const validateParameters = (params: ParameterPair[]): string[] => {
    const errors: string[] = [];
    const seenKeys = new Set<string>();

    for (const param of params) {
      if (!param.key.trim() && !param.value.trim()) continue; // Skip empty rows

      if (!param.key.trim()) {
        errors.push("Parameter key cannot be empty");
        continue;
      }

      if (RESERVED_KEYS.has(param.key.toLowerCase())) {
        errors.push(
          `"${param.key}" is a reserved key and cannot be overridden`,
        );
      }

      if (seenKeys.has(param.key)) {
        errors.push(`Duplicate key: "${param.key}"`);
      }
      seenKeys.add(param.key);

      // Try to parse value as JSON to validate it
      if (param.value.trim()) {
        try {
          JSON.parse(param.value);
        } catch {
          // If it's not valid JSON, treat as string (which is fine)
        }
      }
    }

    return errors;
  };

  const updateParameter = (
    id: string,
    field: "key" | "value",
    newValue: string,
  ) => {
    const updatedParams = parameters.map((param) =>
      param.id === id ? { ...param, [field]: newValue } : param,
    );
    setParameters(updatedParams);
    setHasChanges(true);
    setValidationErrors(validateParameters(updatedParams));
  };

  const addParameter = () => {
    const newParam: ParameterPair = {
      id: `param-${Date.now()}`,
      key: "",
      value: "",
    };
    setParameters([...parameters, newParam]);
    setHasChanges(true);
  };

  const removeParameter = (id: string) => {
    const updatedParams = parameters.filter((param) => param.id !== id);
    setParameters(updatedParams);
    setHasChanges(true);
    setValidationErrors(validateParameters(updatedParams));
  };

  const addCommonParameter = (key: string, value: string) => {
    // Check if key already exists
    if (parameters.some((p) => p.key === key)) {
      toast({
        title: "Parameter exists",
        description: `"${key}" is already configured`,
        variant: "destructive",
      });
      return;
    }

    const newParam: ParameterPair = {
      id: `param-${Date.now()}`,
      key,
      value,
    };
    setParameters([...parameters, newParam]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const errors = validateParameters(parameters);
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    // Convert parameters to object, filtering out empty rows
    const customLlmParams: Record<string, unknown> = {};
    for (const param of parameters) {
      if (param.key.trim() && param.value.trim()) {
        try {
          // Try to parse as JSON first
          customLlmParams[param.key] = JSON.parse(param.value);
        } catch {
          // If not valid JSON, store as string
          customLlmParams[param.key] = param.value;
        }
      }
    }

    try {
      await updateProject({
        projectId: project.id,
        customLlmParams,
      });

      toast({
        title: "Success",
        description: "Custom parameters updated successfully",
      });

      setIsEditing(false);
      setHasChanges(false);
      onEdited();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update custom parameters",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Reset to original values
    const customParams = project.customLlmParams || {};
    const paramPairs: ParameterPair[] = Object.entries(customParams).map(
      ([key, value], index) => ({
        id: `param-${index}`,
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      }),
    );

    if (paramPairs.length === 0) {
      paramPairs.push({ id: "param-0", key: "", value: "" });
    }

    setParameters(paramPairs);
    setIsEditing(false);
    setHasChanges(false);
    setValidationErrors([]);
  };

  const parameterCount = Object.keys(project.customLlmParams || {}).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Custom Parameters</CardTitle>
            <TooltipProvider>
              <Tooltip
                content={
                  <p>
                    Add custom parameters to send to your LLM provider. These
                    will be merged with default parameters and sent with every
                    request.
                  </p>
                }
              >
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
        <CardDescription>
          {parameterCount > 0
            ? `${parameterCount} custom parameter${parameterCount === 1 ? "" : "s"} configured`
            : "No custom parameters configured"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-2">
            {parameterCount > 0 ? (
              Object.entries(project.customLlmParams || {}).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="font-mono text-sm">{key}</span>
                    <span className="text-sm text-muted-foreground">
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value)}
                    </span>
                  </div>
                ),
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Click &quot;Edit&quot; to add custom parameters for your LLM
                provider.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors[0]}</AlertDescription>
              </Alert>
            )}

            {/* Quick Insert Common Parameters */}
            <div>
              <Label className="text-sm font-medium">Quick Insert</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_PARAMETERS.map((param) => (
                  <TooltipProvider key={param.key}>
                    <Tooltip content={<p>{param.description}</p>}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addCommonParameter(param.key, param.value)
                          }
                          className="text-xs"
                        >
                          {param.key}
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Parameter Editor */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Parameters</Label>
              {parameters.map((param) => (
                <motion.div
                  key={param.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-start"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Parameter key (e.g., temperature)"
                      value={param.key}
                      onChange={(e) =>
                        updateParameter(param.id, "key", e.target.value)
                      }
                      className={
                        RESERVED_KEYS.has(param.key.toLowerCase())
                          ? "border-destructive"
                          : ""
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Value (e.g., 0.7 or JSON object)"
                      value={param.value}
                      onChange={(e) =>
                        updateParameter(param.id, "value", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeParameter(param.id)}
                    disabled={parameters.length === 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            <Button variant="outline" onClick={addParameter} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={
                  isUpdating || validationErrors.length > 0 || !hasChanges
                }
                className="flex-1"
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            {/* Help Text */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Tips:</strong> Values can be strings, numbers, or JSON
                objects. Reserved keys like &quot;model&quot; and
                &quot;messages&quot; cannot be overridden. Parameters are merged
                with defaults and sent to your LLM provider.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
