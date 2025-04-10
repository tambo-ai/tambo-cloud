"use client";

import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use } from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = use(params);
  const pathname = usePathname();

  // Fetch project details
  const { data: project } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  return (
    <div className="container flex flex-col min-h-screen">
      <Header showDashboardButton showLogoutButton />

      {/* Back link */}
      <div className="mt-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Project Metadata and Navigation */}
      <div className="my-6 p-6 border rounded-lg">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-heading font-bold">
                {project?.name || "Project"}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {projectId}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b">
            <Link href={`/dashboard/${projectId}`} passHref>
              <Button
                variant={
                  pathname === `/dashboard/${projectId}` ? "default" : "ghost"
                }
                className="rounded-none border-b-2 border-transparent transition-none px-4"
                style={{
                  borderBottomColor:
                    pathname === `/dashboard/${projectId}`
                      ? "currentColor"
                      : "transparent",
                }}
              >
                Details
              </Button>
            </Link>
            <Link href={`/dashboard/${projectId}/observability`} passHref>
              <Button
                variant={
                  pathname.includes("/observability") ? "default" : "ghost"
                }
                className="rounded-none border-b-2 border-transparent transition-none px-4"
                style={{
                  borderBottomColor: pathname.includes("/observability")
                    ? "currentColor"
                    : "transparent",
                }}
              >
                Observability
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Suspense fallback={<div className="animate-pulse h-32"></div>}>
        {children}
      </Suspense>
    </div>
  );
}
