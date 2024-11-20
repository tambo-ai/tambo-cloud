import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectResponseDto } from "../types/types";
interface ProjectCardProps {
  project: ProjectResponseDto;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name.projectName}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Project ID: {project.id}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  );
} 