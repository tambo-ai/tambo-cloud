"use client";

import { DashboardCard } from "@/components/dashboard-components/DashboardCard";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreateProjectDialog } from "../../../components/dashboard-components/create-project-dialog";
import { ProjectTable } from "../../../components/dashboard-components/project-table";

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
            <div className="relative flex items-center flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full w-full"
              />
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="text-sm px-4 gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectTable
            projects={filteredProjects || []}
            onProjectsDeleted={refetchProjects}
          />
        </motion.div>
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
      </>
    </motion.div>
  );
}
