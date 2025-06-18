"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { SlashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use } from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = use(params);
  const pathname = usePathname();

  // Fetch project data to get the project name
  const { data: project } = api.project.getUserProjects.useQuery(undefined, {
    select: (projects) => projects.find((p) => p.id === projectId),
  });

  // Determine active tab value
  const activeTab = pathname.includes("/observability")
    ? "observability"
    : "details";

  return (
    <div className="flex flex-col bg-background">
      {/* Sticky Navigation Section */}
      <div className="sticky top-[var(--header-height)] z-40 bg-background">
        <div className="container mx-auto px-4 md:px-6 pb-0">
          {/* Navigation Row */}
          <motion.div
            className="flex flex-col gap-4 pb-2"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            {/* Navigation Bar with Breadcrumb and Tabs */}
            <div className="flex items-center justify-between">
              {/* Breadcrumb Navigation */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/dashboard" className="text-sm">
                        All Projects
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <SlashIcon
                      className="h-3 w-3 text-muted-foreground -rotate-[30deg] -mx-2"
                      size={16}
                      strokeWidth={1.5}
                    />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm">
                      {project?.name || "Loading..."}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Project Navigation Tabs */}
              <Tabs defaultValue={activeTab} className="ml-auto">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger
                    value="details"
                    className="font-sentient text-base rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"
                    asChild
                  >
                    <Link href={`/dashboard/${projectId}`}>Details</Link>
                  </TabsTrigger>
                  <TabsTrigger
                    value="observability"
                    className="font-sentient text-base rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"
                    asChild
                  >
                    <Link href={`/dashboard/${projectId}/observability`}>
                      Observability
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="container mx-auto px-4 py-6 md:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <Suspense fallback={<div className="h-32 animate-pulse"></div>}>
            {children}
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
