"use client";

import { MultiComponentReturnSetting } from "./multi-component-return-setting";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { z } from "zod";

export const MultiComponentReturnSettingWrapperPropsSchema = z.object({
  projectId: z.string().describe("Project to update"),
  requestedEnabled: z
    .boolean()
    .optional()
    .describe("The desired value to pre-toggle in the UI. This is not persisted until Save."),
});

interface WrapperProps {
  projectId: string;
  requestedEnabled?: boolean;
}

export function MultiComponentReturnSettingWrapper({
  projectId,
  requestedEnabled,
}: WrapperProps) {
  const { data: projects, isLoading } = api.project.getUserProjects.useQuery();
  const project = projects?.find((p) => p.id === projectId);

  if (isLoading || !project) {
    return (
      <Card>
        <CardContent>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Loading...
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MultiComponentReturnSetting
      project={project}
      requestedEnabled={requestedEnabled}
    />
  );
}