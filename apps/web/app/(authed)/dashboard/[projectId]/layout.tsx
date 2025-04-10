"use client";

import { Header } from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

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
    <motion.div
      className="container flex flex-col min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Header showDashboardButton showLogoutButton />

      {/* Back link */}
      <motion.div className="mt-6" variants={itemVariants}>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </motion.div>

      {/* Project Metadata and Navigation */}
      <motion.div
        className="my-6 p-6 border rounded-lg"
        variants={itemVariants}
      >
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
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={itemVariants} style={{ flex: 1 }}>
        <Suspense fallback={<div className="animate-pulse h-32"></div>}>
          {children}
        </Suspense>
      </motion.div>
    </motion.div>
  );
}
