"use client";

import { DashboardCard } from "@/components/dashboard-components/DashboardCard";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CreateProjectDialog } from "../../../components/dashboard-components/create-project-dialog";
import { DeleteConfirmationDialog } from "../../../components/dashboard-components/delete-confirmation-dialog";
import { ProjectTable } from "../../../components/dashboard-components/project-table";
import { SearchInput } from "@/components/ui/search-input";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [messagesPeriod, setMessagesPeriod] = useState("all time");
  const [usersPeriod, setUsersPeriod] = useState("all time");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const { data: session, isLoading: isAuthLoading } = useSession();

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectLoadingError,
    refetch: refetchProjects,
  } = api.project.getUserProjects.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: totalUsage } = api.project.getTotalMessageUsage.useQuery(
    { period: messagesPeriod },
    { enabled: !!session },
  );

  const { data: totalUsers } = api.project.getTotalUsers.useQuery(
    { period: usersPeriod },
    { enabled: !!session },
  );

  useEffect(() => {
    if (projectLoadingError) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  }, [projectLoadingError, toast]);

  // Open create dialog by default if no projects exist
  useEffect(() => {
    if (!isProjectsLoading && projects && projects.length === 0) {
      setIsCreateDialogOpen(true);
    }
  }, [isProjectsLoading, projects]);

  const { mutateAsync: createProject } =
    api.project.createProject2.useMutation();
  const { mutateAsync: addProviderKey } =
    api.project.addProviderKey.useMutation();

  const handleCreateProject = async (
    projectName: string,
    providerKey?: string,
  ) => {
    try {
      const project = await createProject({ name: projectName });
      await addProviderKey({
        projectId: project.id,
        provider: "openai",
        providerKey: providerKey ?? "",
      });
      await refetchProjects();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      return project;
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const periodOptions = [
    { value: "all time", label: "all time" },
    { value: "per month", label: "per month" },
    { value: "per week", label: "per week" },
  ];

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchTerm) return projects;

    const term = searchTerm.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.id.toLowerCase().includes(term),
    );
  }, [projects, searchTerm]);

  // Get selected project details for the dialog
  const selectedProjectDetails = useMemo(() => {
    if (!projects) return { ids: [], names: [] };
    const selectedProjectsData = projects.filter(
      (p) => p.id && selectedProjects.has(p.id),
    );
    return {
      ids: selectedProjectsData.map((p) => p.id).filter(Boolean),
      names: selectedProjectsData.map((p) => p.name),
    };
  }, [projects, selectedProjects]);

  const allProjectIds = useMemo(() => {
    return new Set(projects?.map((p) => p.id) || []);
  }, [projects]);

  const allSelected = useMemo(() => {
    return projects?.length === selectedProjects.size;
  }, [projects?.length, selectedProjects.size]);

  // Handler for select/deselect all
  const handleToggleSelectAll = () => {
    setSelectedProjects(allSelected ? new Set() : allProjectIds);
  };

  const handleProjectsDeleted = () => {
    setSelectedProjects(new Set());
    refetchProjects();
  };

  const LoadingSpinner = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </motion.div>
  );

  // Show loading spinner while checking auth or loading projects
  if (isAuthLoading || isProjectsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <>
        <div className="flex items-center gap-2 space-x-6 py-14">
          <DashboardCard
            title="Number of Projects"
            value={projects?.length || 0}
          />
          <DashboardCard
            title="Messages"
            value={totalUsage?.totalMessages || 0}
            defaultPeriod="all time"
            periodOptions={periodOptions}
            onPeriodChange={setMessagesPeriod}
          />
          <DashboardCard
            title="Users"
            value={totalUsers?.totalUsers || 0}
            defaultPeriod="all time"
            periodOptions={periodOptions}
            onPeriodChange={setUsersPeriod}
          />
        </div>
        <motion.div
          className="flex items-center justify-between py-8"
          variants={itemVariants}
        >
          <h1 className="text-4xl font-bold">Projects</h1>
        </motion.div>
        <motion.div variants={itemVariants} className="mb-6">
          <div className="relative flex items-center justify-between gap-2">
            <SearchInput
              variant="rounded"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
              {selectedProjects.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent border-none text-red-500 hover:text-red-500 hover:bg-transparent hover:border-none"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete ({selectedProjects.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent border-none hover:bg-transparent hover:border-none hover:text-muted-foreground"
                onClick={handleToggleSelectAll}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="text-sm px-4 gap-2 rounded-xl"
                variant="default"
              >
                Create Project
              </Button>
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectTable
            projects={filteredProjects || []}
            selectedProjects={selectedProjects}
            onSelectedProjectsChange={setSelectedProjects}
          />
        </motion.div>
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
        <DeleteConfirmationDialog
          mode="multiple"
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          selectedProjectIds={selectedProjectDetails.ids}
          selectedProjectNames={selectedProjectDetails.names}
          onProjectsDeleted={handleProjectsDeleted}
        />
      </>
    </motion.div>
  );
}
