"use client";

import { CreateProjectDialog } from "@/components/cli-auth/CreateProjectDialog";
import { KeyStep } from "@/components/cli-auth/KeyStep";
import { ProgressIndicator } from "@/components/cli-auth/ProgressIndicator";
import { ProjectStep } from "@/components/cli-auth/ProjectStep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { api } from "@/trpc/react";
import { useCallback, useState } from "react";

export default function CLIAuthPage() {
  const [step, setStep] = useState<"select" | "key">("select");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createDialogState, setCreateDialogState] = useState({
    isOpen: false,
    name: "",
    providerKey: "",
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const { data: session, isLoading: isAuthLoading } = useSession();

  // tRPC queries and mutations
  const projectsQuery = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });
  const createProjectMutation = api.project.createProject.useMutation();
  const addProviderKeyMutation = api.project.addProviderKey.useMutation();
  const generateApiKeyMutation = api.project.generateApiKey.useMutation();
  const providerKeysQuery = api.project.getProviderKeys.useQuery(
    selectedProjectId ?? "",
    {
      enabled: !!selectedProjectId && !!session,
      staleTime: 30000,
    },
  );

  const steps = ["select a project", "generate key"];

  const handleGenerate = useCallback(async () => {
    if (!selectedProjectId || isGenerating) return;

    try {
      setIsGenerating(true);
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const result = await generateApiKeyMutation.mutateAsync({
        projectId: selectedProjectId,
        name: `CLI Key (${timestamp})`,
      });

      setApiKey(result.apiKey);

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep("select");
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Key generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, generateApiKeyMutation, isGenerating]);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const selectedProject = projectsQuery.data?.find(
        (project) => project.id === projectId,
      );

      if (selectedProject) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(selectedProject.name);
        setStep("key");
        // Generate API key immediately when switching to the key step
        handleGenerate();
      }
    },
    [projectsQuery.data, handleGenerate],
  );

  const handleBack = useCallback(() => {
    setStep("select");
    setApiKey("");
    setCountdown(60);
  }, []);

  const handleCreateProject = useCallback(async () => {
    try {
      setIsCreatingProject(true);
      const newProject = await createProjectMutation.mutateAsync(
        createDialogState.name,
      );

      // Add OpenAI provider key
      if (createDialogState.providerKey) {
        await addProviderKeyMutation.mutateAsync({
          projectId: newProject.id,
          provider: "openai",
          providerKey: createDialogState.providerKey,
        });
      }

      // Refetch projects
      await projectsQuery.refetch();

      // Close dialog and reset state
      setCreateDialogState({
        isOpen: false,
        name: "",
        providerKey: "",
      });

      // Select the new project
      setSelectedProjectId(newProject.id);
      setSelectedProjectName(newProject.name);
      setStep("key");
      handleGenerate();
    } catch (error) {
      console.error("Project creation failed:", error);
    } finally {
      setIsCreatingProject(false);
    }
  }, [
    createDialogState,
    createProjectMutation,
    addProviderKeyMutation,
    projectsQuery,
    handleGenerate,
  ]);

  if (isAuthLoading) {
    return <div className="hidden"></div>;
  }

  return (
    <div>
      <Card className="container max-w-lg text-center shadow-md">
        <CardHeader>
          <CardTitle>Setup tambo ai</CardTitle>
          <ProgressIndicator
            steps={steps}
            currentStep={
              step === "select" ? "select a project" : "generate key"
            }
            onStepClick={
              step === "key"
                ? (clickedStep) =>
                    clickedStep === "select a project" && handleBack()
                : undefined
            }
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4"></div>
          {isAuthLoading || (step === "select" && projectsQuery.isLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse h-8 w-8 rounded-full bg-muted" />
            </div>
          ) : step === "select" ? (
            <ProjectStep
              projects={projectsQuery.data}
              isLoading={false}
              error={projectsQuery.error}
              onProjectSelect={handleProjectSelect}
              onCreateClick={() =>
                setCreateDialogState({ ...createDialogState, isOpen: true })
              }
            />
          ) : (
            <KeyStep
              apiKey={apiKey}
              countdown={countdown}
              error={providerKeysQuery.error}
              isGenerating={isGenerating}
              onBack={handleBack}
              onGenerate={handleGenerate}
              projectName={selectedProjectName}
            />
          )}

          <CreateProjectDialog
            state={createDialogState}
            isCreating={isCreatingProject}
            onStateChange={setCreateDialogState}
            onConfirm={handleCreateProject}
          />
        </CardContent>
      </Card>
    </div>
  );
}
