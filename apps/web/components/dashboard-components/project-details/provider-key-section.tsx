import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { DEFAULT_OPENAI_MODEL } from "@tambo-ai-cloud/core";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  Check,
  ChevronsUpDown,
  ExternalLinkIcon,
  InfoIcon,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { z } from "zod";

export const ProviderKeySectionSchema = z
  .object({
    id: z.string().describe("The unique identifier for the project."),
    name: z.string().describe("The name of the project."),
  })
  .describe("Project data from the router output.");

export const ProviderKeySectionProps = z.object({
  project: z
    .lazy(() =>
      ProviderKeySectionSchema.describe(
        "The project to configure LLM providers for.",
      ),
    )
    .optional()
    .describe("Props for the ProviderKeySection component."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when settings are successfully updated.",
    ),
});

interface ProviderKeySectionProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
  onEdited?: () => void;
}

const sectionAnimationVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const shortTransition = { duration: 0.2 };

export const FREE_MESSAGE_LIMIT = 500;

interface ProviderModelOption {
  value: string;
  label: string;
  provider: {
    apiName: string;
    displayName: string;
    isCustomProvider: boolean;
    requiresBaseUrl?: boolean;
    apiKeyLink?: string;
  };
  model?: {
    apiName: string;
    displayName: string;
    isDefaultModel?: boolean;
    status?: string;
    notes?: string;
    docLink?: string;
    properties?: {
      inputTokenLimit?: number;
    };
  };
}

export function ProviderKeySection({
  project,
  onEdited,
}: ProviderKeySectionProps) {
  const { toast } = useToast();

  const getModelConfig = useCallback(
    (
      providerName: string | undefined,
      modelName: string | undefined,
      configData: typeof llmProviderConfigData,
    ) => {
      if (!providerName || !modelName || !configData) {
        return { modelConfig: undefined, inputTokenLimit: undefined };
      }

      const modelConfig = configData[providerName]?.models?.[modelName];

      const isValidModelConfig =
        modelConfig &&
        typeof modelConfig === "object" &&
        "properties" in modelConfig;

      return {
        modelConfig: isValidModelConfig ? modelConfig : undefined,
        inputTokenLimit: isValidModelConfig
          ? modelConfig.properties.inputTokenLimit
          : undefined,
      };
    },
    [],
  );

  // --- TRPC API Calls ---
  const { data: llmProviderConfigData, isLoading: isLoadingLlmProviderConfig } =
    api.llm.getLlmProviderConfig.useQuery(undefined, {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

  const {
    data: projectLlmSettings,
    isLoading: isLoadingProjectSettingsInitial,
    refetch: refetchProjectLlmSettings,
  } = api.project.getProjectLlmSettings.useQuery(
    { projectId: project?.id ?? "" },
    {
      enabled: !!project?.id,
    },
  );

  const { data: messageUsage } = api.project.getProjectMessageUsage.useQuery(
    { projectId: project?.id ?? "" },
    {
      enabled: !!project?.id,
    },
  );

  const {
    data: storedApiKeys,
    isLoading: isLoadingStoredKeysInitial,
    refetch: refetchStoredApiKeys,
  } = api.project.getProviderKeys.useQuery(project?.id ?? "", {
    enabled: !!project?.id,
  });

  // Re-fetch data when project changes
  useEffect(() => {
    if (project?.id) {
      refetchProjectLlmSettings();
      refetchStoredApiKeys();
    }
  }, [project?.id, refetchProjectLlmSettings, refetchStoredApiKeys]);

  // --- UI State ---
  const [selectedProviderApiName, setSelectedProviderApiName] = useState<
    string | undefined
  >();
  const [selectedModelApiName, setSelectedModelApiName] = useState<
    string | undefined
  >();
  const [combinedSelectValue, setCombinedSelectValue] = useState<string>("");
  const [combinedSelectOpen, setCombinedSelectOpen] = useState(false);
  const [customModelName, setCustomModelName] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [maxInputTokens, setMaxInputTokens] = useState<string>("");

  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [isEditingApiKey, setIsEditingApiKey] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Generate combined provider-model options
  const providerModelOptions: ProviderModelOption[] = useMemo(() => {
    if (!llmProviderConfigData) return [];

    const options: ProviderModelOption[] = [];

    Object.values(llmProviderConfigData).forEach((provider) => {
      if (provider.isCustomProvider) {
        // For custom providers, add a single option
        options.push({
          value: `${provider.apiName}|custom`,
          label: `${provider.displayName} • Custom Model`,
          provider: {
            apiName: provider.apiName,
            displayName: provider.displayName,
            isCustomProvider: true,
            requiresBaseUrl: provider.requiresBaseUrl,
            apiKeyLink: provider.apiKeyLink,
          },
        });
      } else {
        // For regular providers, add all their models
        const models = provider.models || {};
        Object.values(models).forEach((model) => {
          options.push({
            value: `${provider.apiName}|${model.apiName}`,
            label: `${provider.displayName} • ${model.displayName}${
              model.apiName === DEFAULT_OPENAI_MODEL ? " (default)" : ""
            }`,
            provider: {
              apiName: provider.apiName,
              displayName: provider.displayName,
              isCustomProvider: false,
              apiKeyLink: provider.apiKeyLink,
            },
            model: {
              apiName: model.apiName,
              displayName: model.displayName,
              isDefaultModel: model.isDefaultModel,
              status: model.status,
              notes: model.notes,
              docLink: model.docLink,
              properties: model.properties,
            },
          });
        });
      }
    });

    return options.sort((a, b) => {
      // First, prioritize tested models
      const aIsTested = a.model?.status === "tested";
      const bIsTested = b.model?.status === "tested";
      if (aIsTested && !bIsTested) return -1;
      if (!aIsTested && bIsTested) return 1;

      return 0;
    });
  }, [llmProviderConfigData]);

  const currentProviderConfig =
    selectedProviderApiName && llmProviderConfigData
      ? llmProviderConfigData[selectedProviderApiName]
      : undefined;

  // Find current selected option
  const currentSelectedOption = providerModelOptions.find(
    (option) => option.value === combinedSelectValue,
  );

  // Update combinedSelectValue when individual states change
  useEffect(() => {
    if (selectedProviderApiName) {
      if (currentProviderConfig?.isCustomProvider) {
        setCombinedSelectValue(`${selectedProviderApiName}|custom`);
      } else if (selectedModelApiName) {
        setCombinedSelectValue(
          `${selectedProviderApiName}|${selectedModelApiName}`,
        );
      }
    }
  }, [
    selectedProviderApiName,
    selectedModelApiName,
    currentProviderConfig?.isCustomProvider,
  ]);

  // Effect for initializing state from fetched projectLlmSettings
  useEffect(() => {
    if (projectLlmSettings) {
      // If no provider is set, find and set OpenAI as default
      if (!projectLlmSettings.defaultLlmProviderName && llmProviderConfigData) {
        const openaiProvider = Object.values(llmProviderConfigData).find(
          (provider) => provider.apiName === "openai",
        );
        if (openaiProvider) {
          setSelectedProviderApiName("openai");
          setSelectedModelApiName(DEFAULT_OPENAI_MODEL);
          return;
        }
      }

      setSelectedProviderApiName(
        projectLlmSettings.defaultLlmProviderName ?? undefined,
      );
      if (projectLlmSettings.defaultLlmProviderName === "openai-compatible") {
        setCustomModelName(projectLlmSettings.customLlmModelName ?? "");
        setSelectedModelApiName(undefined);
        setMaxInputTokens(projectLlmSettings.maxInputTokens?.toString() ?? "");
      } else {
        // If OpenAI is selected and no model is set, default to DEFAULT_OPENAI_MODEL
        if (
          projectLlmSettings.defaultLlmProviderName === "openai" &&
          !projectLlmSettings.defaultLlmModelName
        ) {
          setSelectedModelApiName(DEFAULT_OPENAI_MODEL);
        } else {
          setSelectedModelApiName(
            projectLlmSettings.defaultLlmModelName ?? undefined,
          );
        }
        setCustomModelName("");
        // For non-custom providers, use the saved maxInputTokens or the model's default
        if (projectLlmSettings.maxInputTokens) {
          setMaxInputTokens(projectLlmSettings.maxInputTokens.toString());
        } else {
          const { inputTokenLimit } = getModelConfig(
            projectLlmSettings.defaultLlmProviderName ?? undefined,
            projectLlmSettings.defaultLlmModelName ?? undefined,
            llmProviderConfigData,
          );
          setMaxInputTokens(inputTokenLimit?.toString() ?? "");
        }
      }
      setBaseUrl(projectLlmSettings.customLlmBaseURL ?? "");
      setHasUnsavedChanges(false);
    }
  }, [projectLlmSettings, llmProviderConfigData, getModelConfig]);

  // API key validation
  const [debouncedApiKey] = useDebounce(apiKeyInput, 500);

  const { data: apiKeyValidation, isFetching: isValidatingApiKey } =
    api.validate.validateApiKey.useQuery(
      {
        apiKey: debouncedApiKey,
        provider: selectedProviderApiName ?? "",
        options: {
          allowEmpty: ["openai", "openai-compatible"].includes(
            selectedProviderApiName ?? "",
          ),
          timeout: 5000,
        },
      },
      {
        enabled: !!selectedProviderApiName && !!debouncedApiKey,
        staleTime: 30000,
        retry: false,
      },
    );

  // --- TRPC Mutations ---
  const { mutate: updateLlmSettings, isPending: isSavingDefaults } =
    api.project.updateProjectLlmSettings.useMutation({
      onSuccess: async () => {
        toast({
          title: "Success",
          description: "LLM configuration saved.",
        });
        setHasUnsavedChanges(false);
        await refetchProjectLlmSettings();
        onEdited?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save configuration: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  const { mutate: addOrUpdateApiKey, isPending: isUpdatingApiKey } =
    api.project.addProviderKey.useMutation({
      onSuccess: async () => {
        toast({ title: "Success", description: "API key saved successfully." });
        await refetchStoredApiKeys();
        setIsEditingApiKey(false);
        setApiKeyInput("");
        onEdited?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save API key: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  // --- Derived State & Data (using TRPC data now) ---
  const currentApiKeyRecord = storedApiKeys?.find(
    (k) => k.providerName === selectedProviderApiName,
  );

  const isUsingDefaultModel = selectedModelApiName === DEFAULT_OPENAI_MODEL;
  const canUseFreeMessages =
    selectedProviderApiName === "openai" && isUsingDefaultModel;

  const maskedApiKeyDisplay = isLoadingStoredKeysInitial
    ? "Loading..."
    : currentApiKeyRecord
      ? currentApiKeyRecord.partiallyHiddenKey || "s•••••••••••••••••••••••key"
      : canUseFreeMessages
        ? messageUsage?.messageCount &&
          messageUsage.messageCount >= FREE_MESSAGE_LIMIT
          ? "free messages used, please add a key"
          : `using free messages (${messageUsage?.messageCount ?? 0}/${FREE_MESSAGE_LIMIT})`
        : "API key required";

  // Effect to sync UI state when selectedProviderApiName changes
  useEffect(() => {
    if (selectedProviderApiName && projectLlmSettings) {
      const currentProviderFromSettings =
        projectLlmSettings.defaultLlmProviderName;
      if (selectedProviderApiName === currentProviderFromSettings) {
        if (selectedProviderApiName === "openai-compatible") {
          setCustomModelName(projectLlmSettings.customLlmModelName ?? "");
          setSelectedModelApiName(undefined);
          setBaseUrl(projectLlmSettings.customLlmBaseURL ?? "");
          setMaxInputTokens(
            projectLlmSettings.maxInputTokens?.toString() ?? "",
          );
        } else {
          // If OpenAI is selected and no model is set, default to gpt-4o-mini
          if (
            selectedProviderApiName === "openai" &&
            !projectLlmSettings.defaultLlmModelName
          ) {
            setSelectedModelApiName(DEFAULT_OPENAI_MODEL);
          } else {
            setSelectedModelApiName(
              projectLlmSettings.defaultLlmModelName ?? undefined,
            );
          }
          setCustomModelName("");
          setBaseUrl("");
          // For non-custom providers, use the saved maxInputTokens or the model's default
          if (projectLlmSettings.maxInputTokens) {
            setMaxInputTokens(projectLlmSettings.maxInputTokens.toString());
          } else {
            const { inputTokenLimit } = getModelConfig(
              projectLlmSettings.defaultLlmProviderName ?? undefined,
              projectLlmSettings.defaultLlmModelName ?? undefined,
              llmProviderConfigData,
            );
            setMaxInputTokens(inputTokenLimit?.toString() ?? "");
          }
        }
      } else {
        // If switching to OpenAI and no model is selected, set DEFAULT_OPENAI_MODEL
        if (selectedProviderApiName === "openai") {
          setSelectedModelApiName(DEFAULT_OPENAI_MODEL);
        } else {
          setSelectedModelApiName(undefined);
        }
        setCustomModelName("");
        setBaseUrl("");
        setMaxInputTokens("");
      }
    } else if (selectedProviderApiName) {
      if (selectedProviderApiName === "openai") {
        setSelectedModelApiName(DEFAULT_OPENAI_MODEL);
      } else if (selectedProviderApiName !== "openai-compatible") {
        setCustomModelName("");
        setBaseUrl("");
        setSelectedModelApiName(undefined);
        setMaxInputTokens("");
      }
    }
  }, [
    selectedProviderApiName,
    projectLlmSettings,
    llmProviderConfigData,
    getModelConfig,
  ]);

  // Update maxInputTokens when model changes
  useEffect(() => {
    if (
      selectedModelApiName &&
      selectedProviderApiName &&
      llmProviderConfigData
    ) {
      const { inputTokenLimit } = getModelConfig(
        selectedProviderApiName,
        selectedModelApiName,
        llmProviderConfigData,
      );
      if (inputTokenLimit && !maxInputTokens) {
        setMaxInputTokens(inputTokenLimit.toString());
        setHasUnsavedChanges(true);
      }
    }
  }, [
    selectedModelApiName,
    selectedProviderApiName,
    llmProviderConfigData,
    maxInputTokens,
    getModelConfig,
  ]);

  // --- Event Handlers (basic implementation for UI interaction) ---
  const handleCombinedSelectChange = useCallback((value: string) => {
    setCombinedSelectValue(value);
    setCombinedSelectOpen(false);

    const [providerApiName, modelApiName] = value.split("|");
    setSelectedProviderApiName(providerApiName);

    if (modelApiName === "custom") {
      setSelectedModelApiName(undefined);
      setCustomModelName("");
      setBaseUrl("");
      setMaxInputTokens("");
    } else {
      setSelectedModelApiName(modelApiName);
      setCustomModelName("");
    }

    setApiKeyInput("");
    setIsEditingApiKey(false);
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveDefaults = useCallback(() => {
    if (!project?.id) {
      toast({
        title: "Error",
        description: "No project selected.",
        variant: "destructive",
      });
      return;
    }

    setShowValidationErrors(true);

    if (!selectedProviderApiName) {
      toast({
        title: "Error",
        description: "Please select a provider first.",
        variant: "destructive",
      });
      return;
    }

    // Check if API key is required
    const requiresApiKey = !canUseFreeMessages;

    if (requiresApiKey && !currentApiKeyRecord?.partiallyHiddenKey) {
      const errorMessage =
        selectedProviderApiName === "openai" && !isUsingDefaultModel
          ? `Free messages are only available for the default model (${DEFAULT_OPENAI_MODEL}). Please add your OpenAI API key to use other models, or switch to the default model.`
          : "Please add an API key before saving settings for this provider.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    let modelToSave: string | null = null;
    let customNameToSave: string | null = null;
    let maxInputTokensToSave: number | null = null;

    if (currentProviderConfig?.isCustomProvider) {
      if (!customModelName.trim()) {
        toast({
          title: "Error",
          description: "Model Name is required for this provider.",
          variant: "destructive",
        });
        return;
      }
      modelToSave = null;
      customNameToSave = customModelName.trim();

      // Validate maxInputTokens for openai-compatible provider
      if (selectedProviderApiName === "openai-compatible") {
        const tokens = parseInt(maxInputTokens);
        if (isNaN(tokens) || tokens <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid maximum input tokens value.",
            variant: "destructive",
          });
          return;
        }
        maxInputTokensToSave = tokens;
      }
    } else {
      if (!selectedModelApiName) {
        toast({
          title: "Error",
          description: "Please select a model.",
          variant: "destructive",
        });
        return;
      }
      modelToSave = selectedModelApiName;
      customNameToSave = null;
      const { inputTokenLimit: modelMaxTokens } = getModelConfig(
        selectedProviderApiName,
        selectedModelApiName,
        llmProviderConfigData,
      );

      if (maxInputTokens.trim()) {
        const tokens = parseInt(maxInputTokens);
        if (isNaN(tokens) || tokens <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid maximum input tokens value.",
            variant: "destructive",
          });
          return;
        }

        // Check if tokens exceed the model's maximum

        if (modelMaxTokens && tokens > modelMaxTokens) {
          toast({
            title: "Error",
            description: `Input token limit (${tokens.toLocaleString()}) cannot exceed the model's maximum (${modelMaxTokens.toLocaleString()}).`,
            variant: "destructive",
          });
          return;
        }

        maxInputTokensToSave = tokens;
      } else {
        // Use model's default if no custom value provided
        maxInputTokensToSave = modelMaxTokens ?? null;
      }
    }

    let baseUrlToSave: string | null = null;
    if (currentProviderConfig?.apiName === "openai-compatible") {
      if (
        currentProviderConfig.requiresBaseUrl &&
        (!baseUrl || !baseUrl.trim())
      ) {
        toast({
          title: "Error",
          description:
            "Base URL is required for this OpenAI Compatible provider.",
          variant: "destructive",
        });
        return;
      }
      baseUrlToSave = baseUrl.trim() || null;
    }

    setShowValidationErrors(false);
    updateLlmSettings({
      projectId: project.id,
      defaultLlmProviderName: selectedProviderApiName,
      defaultLlmModelName: modelToSave,
      customLlmModelName: customNameToSave,
      customLlmBaseURL: baseUrlToSave,
      maxInputTokens: maxInputTokensToSave,
    });
  }, [
    selectedProviderApiName,
    currentProviderConfig,
    customModelName,
    selectedModelApiName,
    baseUrl,
    maxInputTokens,
    updateLlmSettings,
    project?.id,
    toast,
    currentApiKeyRecord,
    setShowValidationErrors,
    llmProviderConfigData,
    getModelConfig,
    canUseFreeMessages,
    isUsingDefaultModel,
  ]);

  const handleSaveApiKey = useCallback(async () => {
    if (!project?.id) {
      toast({
        title: "Error",
        description: "No project selected.",
        variant: "destructive",
      });
      return;
    }

    if (apiKeyInput.trim() && apiKeyValidation && !apiKeyValidation.isValid) {
      toast({
        title: "Invalid API Key",
        description:
          apiKeyValidation.error || "Please make sure you have a valid api key",
        variant: "destructive",
      });
      return;
    }

    // Allow empty key for OpenAI to switch back to free messages
    if (
      !["openai", "openai-compatible"].includes(
        currentProviderConfig?.apiName ?? "",
      ) &&
      !apiKeyInput.trim()
    ) {
      toast({
        title: "Error",
        description: "API key cannot be empty for this provider.",
        variant: "destructive",
      });
      return;
    }

    addOrUpdateApiKey({
      projectId: project.id,
      provider: selectedProviderApiName ?? "",
      providerKey: apiKeyInput.trim() || undefined,
    });
  }, [
    selectedProviderApiName,
    apiKeyInput,
    apiKeyValidation,
    addOrUpdateApiKey,
    project?.id,
    toast,
    currentProviderConfig,
  ]);

  // --- UI Rendering ---
  const isLoadingInitialData =
    isLoadingLlmProviderConfig || isLoadingProjectSettingsInitial;

  if (isLoadingInitialData) {
    return (
      <Card className="overflow-hidden rounded-md border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full animate-pulse space-y-4 rounded-md bg-muted p-4">
            <div className="h-10 rounded bg-muted-foreground/10" />
            <div className="h-24 rounded bg-muted-foreground/10" />
            <div className="h-10 rounded bg-muted-foreground/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">No project selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-md border">
      <CardHeader className="pb-0 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">LLM Providers</CardTitle>
          {hasUnsavedChanges && (
            <Button
              size="sm"
              className="font-sans bg-transparent border hover:bg-accent"
              onClick={handleSaveDefaults}
              disabled={isSavingDefaults}
            >
              {isSavingDefaults ? (
                <span className="text-primary">Saving...</span>
              ) : (
                <span className="text-primary">Save Settings</span>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Combined Provider • Model Select */}
        <div className="space-y-2 max-w-xl">
          <Label htmlFor="provider-model-select">Provider • Model</Label>
          <Popover
            open={combinedSelectOpen}
            onOpenChange={setCombinedSelectOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={combinedSelectOpen}
                className="w-full justify-between h-10 font-normal"
                disabled={isLoadingLlmProviderConfig}
              >
                {currentSelectedOption ? (
                  <span className="truncate">
                    {currentSelectedOption.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {isLoadingLlmProviderConfig
                      ? "Loading..."
                      : "Select provider and model"}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search providers and models..." />
                <CommandList>
                  <CommandEmpty>No provider or model found.</CommandEmpty>
                  <CommandGroup>
                    {providerModelOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={handleCombinedSelectChange}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              combinedSelectValue === option.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">{option.label}</span>
                        </div>
                        {option.model?.status && (
                          <span
                            className={cn(
                              "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                              option.model.status === "untested"
                                ? "bg-gray-200 text-gray-700"
                                : "bg-green-100 text-green-700",
                            )}
                          >
                            {option.model.status.charAt(0).toUpperCase() +
                              option.model.status.slice(1)}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {/* Always visible link at bottom */}
                  <div className="border-t p-2">
                    <a
                      href="https://github.com/tambo-ai/tambo-cloud/issues/new?template=feature_request.md&title=Add%20support%20for%20[Model%20Name]"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-xs text-foreground hover:text-primary transition-colors"
                    >
                      Request support for another model
                      <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {showValidationErrors && !combinedSelectValue && (
            <p className="text-sm text-destructive mt-1">
              Please select a provider and model
            </p>
          )}
          <a
            href="https://github.com/tambo-ai/tambo/issues/new?template=feature_request.md&title=Add%20support%20for%20[Model%20Name]"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-foreground hover:text-primary transition-colors"
          >
            Don&apos;t see your model? Request support for another model
            <ExternalLinkIcon className="ml-1 h-3 w-3" />
          </a>
        </div>

        <AnimatePresence mode="wait">
          {currentSelectedOption ? (
            <motion.div
              key={combinedSelectValue}
              variants={sectionAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 rounded-md max-w-xl"
            >
              {/* Model Information */}
              {currentSelectedOption.model && (
                <div className="space-y-2 text-xs text-foreground">
                  {currentSelectedOption.model.notes && (
                    <p className="mb-2 flex items-start">
                      <InfoIcon className="mr-1.5 mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {currentSelectedOption.model.notes}
                    </p>
                  )}
                  {currentSelectedOption.model.docLink && (
                    <a
                      href={currentSelectedOption.model.docLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-link text-xs hover:underline"
                    >
                      Learn more
                      <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Custom Provider Fields */}
              {currentSelectedOption.provider.isCustomProvider && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-model-name-compatible">
                      Model Name
                    </Label>
                    <Input
                      id="custom-model-name-compatible"
                      type="text"
                      placeholder="e.g., llama3-8b-instruct, user/my-model-v1"
                      value={customModelName}
                      onChange={(e) => {
                        setCustomModelName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                    />
                    {showValidationErrors && !customModelName.trim() && (
                      <p className="text-sm text-destructive mt-1">
                        Model name is required
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter the exact model name your OpenAI-compatible endpoint
                      expects.
                    </p>
                  </div>
                  {currentSelectedOption.provider.requiresBaseUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL</Label>
                      <Input
                        id="base-url"
                        type="url"
                        placeholder="e.g., https://example-provider.com/v1"
                        value={baseUrl}
                        onChange={(e) => {
                          setBaseUrl(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        The API endpoint URL for your compatible provider.
                      </p>
                    </div>
                  )}
                  {currentSelectedOption.provider.apiName ===
                    "openai-compatible" && (
                    <div className="space-y-2">
                      <Label htmlFor="max-input-tokens">
                        Maximum Input Tokens
                      </Label>
                      <Input
                        id="max-input-tokens"
                        type="number"
                        min="1"
                        placeholder="e.g., 4096"
                        value={maxInputTokens}
                        onChange={(e) => {
                          setMaxInputTokens(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                      />
                      {showValidationErrors &&
                        (Number.isNaN(Number(maxInputTokens)) ||
                          Number(maxInputTokens) <= 0) && (
                          <p className="text-sm text-destructive mt-1">
                            Please enter a valid maximum input tokens value
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        The maximum number of input tokens your model can
                        handle.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Input Token Limit for Regular Models */}
              {!currentSelectedOption.provider.isCustomProvider && (
                <div className="space-y-2">
                  <Label htmlFor="max-input-tokens">Input Token Limit</Label>
                  <Input
                    id="max-input-tokens"
                    type="number"
                    min="1"
                    max={
                      currentSelectedOption.model?.properties?.inputTokenLimit
                    }
                    placeholder={`e.g., ${currentSelectedOption.model?.properties?.inputTokenLimit ?? 4096}`}
                    value={maxInputTokens}
                    onChange={(e) => {
                      setMaxInputTokens(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                  />
                  {showValidationErrors &&
                    (Number.isNaN(Number(maxInputTokens)) ||
                      Number(maxInputTokens) <= 0) && (
                      <p className="text-sm text-destructive mt-1">
                        Please enter a valid maximum input tokens value
                      </p>
                    )}
                  <p className="text-xs text-foreground">
                    Tambo will limit the number of tokens sent to the model to
                    this value.
                    {currentSelectedOption.model?.properties
                      ?.inputTokenLimit && (
                      <span>
                        {" "}
                        Maximum for this model:{" "}
                        {currentSelectedOption.model.properties.inputTokenLimit.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* API Key Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    API Key
                    {currentSelectedOption?.provider.displayName !==
                      "OpenAI Compatible" &&
                      ` for ${currentSelectedOption?.provider.displayName}`}
                  </Label>
                </div>

                {/* API Key Input/Display - keeping existing logic */}
                {isEditingApiKey ? (
                  <motion.div
                    key="edit-api-key-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={shortTransition}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={
                            currentSelectedOption.provider.apiName === "openai"
                              ? "Enter API Key or leave empty to use free messages"
                              : `Enter API Key${
                                  currentSelectedOption.provider.displayName !==
                                  "OpenAI Compatible"
                                    ? ` for ${currentSelectedOption.provider.displayName}`
                                    : ""
                                }`
                          }
                          autoFocus
                          className={`w-full font-sans pr-8 ${
                            !apiKeyValidation?.isValid && apiKeyInput
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {isValidatingApiKey && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="font-sans bg-transparent border hover:bg-accent"
                        onClick={handleSaveApiKey}
                        disabled={
                          isUpdatingApiKey ||
                          isValidatingApiKey ||
                          (!apiKeyInput.trim() &&
                            currentSelectedOption.provider.apiName !==
                              "openai" &&
                            currentSelectedOption.provider.apiName !==
                              "openai-compatible") ||
                          (!apiKeyValidation?.isValid && !!apiKeyInput.trim())
                        }
                      >
                        {isUpdatingApiKey ? (
                          <span className="text-primary">Saving...</span>
                        ) : (
                          <span className="text-primary">Save Key</span>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="font-sans bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => {
                          setIsEditingApiKey(false);
                          setApiKeyInput("");
                        }}
                        disabled={isUpdatingApiKey}
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Validation feedback */}
                    {apiKeyInput && apiKeyValidation && (
                      <div className="space-y-1">
                        {!apiKeyValidation.isValid && (
                          <div className="space-y-1">
                            <p className="text-sm text-destructive">
                              {apiKeyValidation.error}
                            </p>
                            {currentSelectedOption.provider.apiName ===
                              "mistral" && (
                              <p className="text-sm text-muted-foreground">
                                Note: Mistral API keys may be invalid for a few
                                minutes after creation.
                              </p>
                            )}
                          </div>
                        )}
                        {apiKeyValidation.isValid &&
                          apiKeyValidation.details?.note && (
                            <p className="text-sm text-green-600">
                              ✓ {apiKeyValidation.details.note}
                            </p>
                          )}
                        {apiKeyValidation.isValid &&
                          apiKeyValidation.details?.modelCount && (
                            <p className="text-sm text-green-600">
                              ✓ API key is valid
                            </p>
                          )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-api-key"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={shortTransition}
                    className="flex items-center gap-2"
                  >
                    {isLoadingStoredKeysInitial ? (
                      <div className="h-8 flex-1 animate-pulse rounded bg-muted" />
                    ) : (
                      <code className="block truncate rounded-md border bg-background px-2 py-1.5 font-mono text-sm flex-1">
                        {maskedApiKeyDisplay}
                      </code>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans bg-transparent border hover:bg-accent"
                      onClick={() => {
                        setIsEditingApiKey(true);
                        setApiKeyInput("");
                      }}
                      disabled={isLoadingStoredKeysInitial}
                    >
                      {currentApiKeyRecord ? "Update Key" : "Add Key"}
                    </Button>
                  </motion.div>
                )}
                {currentSelectedOption.provider.apiKeyLink && (
                  <p className="pt-1 text-xs text-foreground">
                    Need an API key?{" "}
                    <a
                      href={currentSelectedOption.provider.apiKeyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-link hover:underline"
                    >
                      Get one from {currentSelectedOption.provider.displayName}
                      <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </p>
                )}
              </div>
            </motion.div>
          ) : !isLoadingLlmProviderConfig ? (
            <motion.div
              key="select_provider_placeholder"
              variants={sectionAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden text-center"
            >
              <p className="py-6 text-sm text-muted-foreground">
                Select a provider and model to configure settings and API key.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
