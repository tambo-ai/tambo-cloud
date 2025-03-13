"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthStep } from "./components/AuthStep";
import { CreateProjectDialog } from "./components/CreateProjectDialog";
import { DeleteKeyDialog } from "./components/DeleteKeyDialog";
import { KeyStep } from "./components/KeyStep";
import { ProjectStep } from "./components/ProjectStep";
import {
  AUTO_CLOSE_DELAY,
  CLI_KEY_PREFIX,
  ERROR_MESSAGES,
  QUERY_CONFIG,
} from "./constants";
import {
  AuthProvider,
  CreateProjectDialogState,
  DeleteDialogState,
  Step,
} from "./types";

/**
 * CLI Authentication Page Component
 *
 * Handles the complete flow for CLI authentication:
 * 1. User authentication (GitHub/Google)
 * 2. Project selection or creation
 * 3. API key generation and management
 */
export default function CLIAuthPage() {
  // State management with strict typing
  const [step, setStep] = useState<Step>("auth");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(AUTO_CLOSE_DELAY);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    keyId: "",
    keyName: "",
  });
  const [createDialog, setCreateDialog] = useState<CreateProjectDialogState>({
    isOpen: false,
    name: "",
  });

  const { toast } = useToast();
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Queries with configuration
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    ...QUERY_CONFIG,
    enabled: step === "project",
  });

  const {
    data: existingApiKeys,
    isLoading: apiKeysLoading,
    error: apiKeysError,
    refetch: refetchApiKeys,
  } = api.project.getApiKeys.useQuery(selectedProject, {
    ...QUERY_CONFIG,
    enabled: step === "key" && !!selectedProject,
  });

  // Mutations with optimistic updates and error handling
  const { mutateAsync: deleteApiKey, isPending: isDeletingKey } =
    api.project.removeApiKey.useMutation({
      onSuccess: () => {
        refetchApiKeys();
        toast({
          title: "Success",
          description: "API key deleted successfully",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: ERROR_MESSAGES.API_KEY_DELETE,
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: generateApiKey, isPending: isGeneratingKey } =
    api.project.generateApiKey.useMutation({
      onSuccess: () => {
        refetchApiKeys();
      },
      onError: () => {
        toast({
          title: "Error",
          description: ERROR_MESSAGES.API_KEY_GENERATE,
          variant: "destructive",
        });
      },
    });

  const { mutateAsync: createProject, isPending: isCreatingProject } =
    api.project.createProject.useMutation({
      onError: () => {
        toast({
          title: "Error",
          description: ERROR_MESSAGES.PROJECT_CREATE,
          variant: "destructive",
        });
      },
    });

  // Memoized values and handlers
  const nextKeyName = useMemo(() => {
    const cliKeyCount =
      existingApiKeys?.filter((key) => key.name.startsWith(CLI_KEY_PREFIX))
        .length ?? 0;
    return cliKeyCount === 0
      ? CLI_KEY_PREFIX
      : `${CLI_KEY_PREFIX} ${cliKeyCount + 1}`;
  }, [existingApiKeys]);

  const closeWindow = useCallback(() => {
    try {
      window.opener = null;
      window.open("", "_self");
      window.close();
      window.location.href = "about:blank";
      window.top?.close();
    } catch (error) {
      console.error("Failed to close window:", error);
      toast({
        title: "Warning",
        description: ERROR_MESSAGES.WINDOW_CLOSE,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Effects
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setStep("project");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        toast({
          title: "Error",
          description: ERROR_MESSAGES.AUTH,
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [supabase.auth, toast]);

  useEffect(() => {
    if (!apiKey) return;

    toast({
      title: "API Key Generated",
      description: `This window will close automatically in ${AUTO_CLOSE_DELAY} seconds.`,
    });

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          closeWindow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [apiKey, toast, closeWindow]);

  useEffect(() => {
    if (step === "project") {
      refetchProjects();
    } else if (step === "key" && selectedProject) {
      refetchApiKeys();
    }
  }, [step, selectedProject, refetchProjects, refetchApiKeys]);

  // Event handlers
  const handleAuth = useCallback(
    async (provider: AuthProvider) => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/cli-auth`,
          },
        });
        if (error) throw error;
      } catch (error) {
        console.error("Auth failed:", error);
        toast({
          title: "Error",
          description: ERROR_MESSAGES.AUTH,
          variant: "destructive",
        });
      }
    },
    [supabase.auth, toast],
  );

  const handleCreateProject = useCallback(async () => {
    if (!createDialog.name.trim()) return;

    try {
      const project = await createProject(createDialog.name);
      setSelectedProject(project.id);
      setStep("key");
      setCreateDialog({ isOpen: false, name: "" });
    } catch (error) {
      console.error("Project creation failed:", error);
    }
  }, [createProject, createDialog.name]);

  const handleGenerateApiKey = useCallback(async () => {
    try {
      const result = await generateApiKey({
        projectId: selectedProject,
        name: nextKeyName,
      });
      setApiKey(result.apiKey);
      setCountdown(AUTO_CLOSE_DELAY);
    } catch (error) {
      console.error("API key generation failed:", error);
    }
  }, [generateApiKey, selectedProject, nextKeyName]);

  const handleDeleteApiKey = useCallback(
    async (keyId: string) => {
      try {
        await deleteApiKey({
          projectId: selectedProject,
          apiKeyId: keyId,
        });
        setDeleteDialog({ isOpen: false, keyId: "", keyName: "" });
      } catch (error) {
        console.error("API key deletion failed:", error);
      }
    },
    [deleteApiKey, selectedProject],
  );

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setStep("auth");
      setSelectedProject("");
      setApiKey("");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES.LOGOUT,
        variant: "destructive",
      });
    }
  }, [supabase.auth, toast]);

  // Render methods
  const renderProgressIndicator = () => (
    <div className="flex justify-between mb-8 px-2">
      {["auth", "project", "key"].map((s, i) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < ["auth", "project", "key"].indexOf(step)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }
            `}
          >
            {i + 1}
          </div>
          <div className="text-xs font-medium text-muted-foreground capitalize">
            {s}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <CreateProjectDialog
        state={createDialog}
        isCreating={isCreatingProject}
        onStateChange={setCreateDialog}
        onConfirm={handleCreateProject}
      />

      <DeleteKeyDialog
        state={deleteDialog}
        isDeleting={isDeletingKey}
        onStateChange={setDeleteDialog}
        onConfirm={handleDeleteApiKey}
      />

      <div className="container max-w-lg mx-auto py-8">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold">
                tambo CLI Setup
              </CardTitle>
              <CardDescription className="text-base">
                {step === "auth" && "Sign in to get started with tambo"}
                {step === "project" &&
                  "Choose a project to generate your API key"}
                {step === "key" && "Almost done! Generate your API key"}
              </CardDescription>
            </div>
            {step !== "auth" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {renderProgressIndicator()}

            {step === "auth" && <AuthStep onAuth={handleAuth} />}

            {step === "project" && (
              <ProjectStep
                projects={projects}
                isLoading={projectsLoading}
                error={projectsError}
                onProjectSelect={(id) => {
                  setSelectedProject(id);
                  setStep("key");
                }}
                onCreateClick={() =>
                  setCreateDialog((prev) => ({ ...prev, isOpen: true }))
                }
              />
            )}

            {step === "key" && (
              <KeyStep
                apiKey={apiKey}
                countdown={countdown}
                existingKeys={existingApiKeys}
                isLoading={apiKeysLoading}
                error={apiKeysError}
                isGenerating={isGeneratingKey}
                onBack={() => {
                  setApiKey("");
                  setStep("project");
                }}
                onGenerate={handleGenerateApiKey}
                onDeleteClick={(keyId, keyName) =>
                  setDeleteDialog({ isOpen: true, keyId, keyName })
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
