"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { hydraService } from "../services/hydra.service";
import { CreateProjectDialog } from "./components/CreateProjectDialog";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectResponseDto } from "./types/types";


export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await hydraService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectName: string) => {
    try {
      await hydraService.createProject(projectName);
      await loadProjects();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: ProjectResponseDto) => (
            <ProjectCard 
              key={project.id} 
              project={project}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
