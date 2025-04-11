"use client";

import { CreateProjectDialog } from "@/components/cli-auth/CreateProjectDialog";
import { KeyStep } from "@/components/cli-auth/KeyStep";
import { ProgressIndicator } from "@/components/cli-auth/ProgressIndicator";
import { ProjectStep } from "@/components/cli-auth/ProjectStep";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function CLIAuthPage() {
  const router = useRouter();
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

  // tRPC queries and mutations
  const projectsQuery = api.project.getUserProjects.useQuery();
  const createProjectMutation = api.project.createProject.useMutation();
  const addProviderKeyMutation = api.project.addProviderKey.useMutation();
  const generateApiKeyMutation = api.project.generateApiKey.useMutation();
  const providerKeysQuery = api.project.getProviderKeys.useQuery(
    selectedProjectId ?? "",
    {
      enabled: !!selectedProjectId,
      staleTime: 30000,
    },
  );

  const steps = ["select a project", "generate key"];

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const selectedProject = projectsQuery.data?.find(
        (project) => project.id === projectId,
      );

      if (selectedProject) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(selectedProject.name);
        setStep("key");
      }
    },
    [projectsQuery.data],
  );

  const handleBack = useCallback(() => {
    setStep("select");
    setApiKey("");
    setCountdown(60);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      setIsGenerating(true);
      const result = await generateApiKeyMutation.mutateAsync({
        projectId: selectedProjectId,
        name: "CLI Key",
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
  }, [selectedProjectId, generateApiKeyMutation]);

  const handleProviderKeyChange = useCallback(
    async (key: string) => {
      if (!selectedProjectId) return;

      try {
        await addProviderKeyMutation.mutateAsync({
          projectId: selectedProjectId,
          provider: "openai",
          providerKey: key,
        });
      } catch (error) {
        console.error("Failed to update provider key:", error);
        throw error;
      }
    },
    [selectedProjectId, addProviderKeyMutation],
  );

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
  ]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="container max-w-lg mx-auto px-4 py-8 flex flex-col">
        <div className="flex flex-col gap-4">
          <ProgressIndicator
            steps={steps}
            currentStep={
              step === "select" ? "select a project" : "generate key"
            }
          />
        </div>
        {step === "select" ? (
          <ProjectStep
            projects={projectsQuery.data}
            isLoading={projectsQuery.isLoading}
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
            isLoading={providerKeysQuery.isLoading}
            error={providerKeysQuery.error}
            isGenerating={isGenerating}
            onBack={handleBack}
            onGenerate={handleGenerate}
            providerKey={
              providerKeysQuery.data?.find(
                (key) => key.providerName === "openai",
              )?.partiallyHiddenKey ?? null
            }
            onProviderKeyChange={handleProviderKeyChange}
            projectName={selectedProjectName}
          />
        )}

        <CreateProjectDialog
          state={createDialogState}
          isCreating={isCreatingProject}
          onStateChange={setCreateDialogState}
          onConfirm={handleCreateProject}
        />
      </Card>
    </div>
  );
}
