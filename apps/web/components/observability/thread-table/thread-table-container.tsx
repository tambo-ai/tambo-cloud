"use client";

import { useToast } from "@/hooks/use-toast";
import { api, RouterOutputs } from "@/trpc/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ThreadMessagesModal } from "../messages/thread-messages-modal";
import { calculateThreadStats } from "../utils";
import { ThreadTable } from "./index";

/**
 * Self-contained wrapper for ThreadTable that handles TRPC data fetching and state management.
 *
 * Created to make ThreadTable compatible with Tambo's component system, which requires simple props.
 * The original ThreadTable needed complex props (threads, handlers, loading state) that come from
 * TRPC calls and local state, making it difficult for AI to use directly.
 *
 * This wrapper encapsulates all that complexity and only exposes `projectId` and `compact` props.
 */

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ThreadTableContainerProps {
  projectId: string;
  compact?: boolean;
}

export const ThreadTableContainerSchema = z.object({
  projectId: z
    .string()
    .describe(
      "The ID of the project to fetch threads for. This must be a valid project ID (UUID format), NOT a project name.",
    ),
  compact: z
    .boolean()
    .optional()
    .describe(
      "Whether to show the table in compact mode. Always use compact=true. When true, hides Updated, Context Key, and Thread Name columns for a cleaner view. Defaults to false.",
    ),
});

export function ThreadTableContainer({
  projectId,
  compact = false,
}: ThreadTableContainerProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [isLoadingAllThreads, setIsLoadingAllThreads] = useState(false);
  const utils = api.useUtils();

  // First, fetch initial batch to get totalCount
  const {
    data: initialData,
    isLoading: isLoadingInitial,
    error: threadsError,
  } = api.thread.getThreads.useQuery(
    {
      projectId,
      offset: 0,
      limit: 100,
    },
    {
      enabled: !!projectId,
    },
  );

  // Fetch all threads if totalCount > 100 and reasonable (< 1000)
  useEffect(() => {
    async function fetchAllThreads() {
      if (!initialData || !projectId) return;

      const { totalCount, threads: firstBatch } = initialData;

      // If we have 100 or fewer threads, we already have them all
      if (totalCount <= 100) {
        setAllThreads(firstBatch);
        return;
      }

      // If more than 1000 threads, show a warning and work with first 100
      if (totalCount > 1000) {
        toast({
          title: "Large dataset",
          description: `You have ${totalCount} threads. Search and sort will only work on the most recent 100 threads for performance reasons.`,
        });
        setAllThreads(firstBatch);
        return;
      }

      // Fetch all threads (100 < totalCount <= 1000)
      setIsLoadingAllThreads(true);
      try {
        const allThreadsData = [...firstBatch];
        const numBatches = Math.ceil((totalCount - 100) / 100);

        // Fetch remaining batches in parallel (up to 3 at a time)
        const batchPromises = [];
        for (let i = 0; i < numBatches; i++) {
          const offset = 100 + i * 100;
          batchPromises.push(
            utils.thread.getThreads.fetch({
              projectId,
              offset,
              limit: 100,
            }),
          );

          // Execute in batches of 3
          if (batchPromises.length === 3 || i === numBatches - 1) {
            const results = await Promise.all(batchPromises);
            results.forEach((result) => {
              allThreadsData.push(...result.threads);
            });
            batchPromises.length = 0;
          }
        }

        setAllThreads(allThreadsData);
      } catch (error) {
        console.error("Failed to fetch all threads:", error);
        toast({
          title: "Error",
          description: "Failed to load all threads. Working with partial data.",
          variant: "destructive",
        });
        setAllThreads(firstBatch);
      } finally {
        setIsLoadingAllThreads(false);
      }
    }

    fetchAllThreads();
  }, [initialData, projectId, toast, utils]);

  // Fetch selected thread details
  const {
    data: selectedThread,
    error: threadError,
    isLoading: isLoadingThread,
  } = api.thread.getThread.useQuery(
    {
      threadId: selectedThreadId!,
      projectId,
      includeInternal: true,
    },
    {
      enabled: !!selectedThreadId,
      placeholderData: (prev, prevQuery) => {
        if (!prevQuery) return undefined;
        const { input } = prevQuery.queryKey[1];
        if (
          input.threadId === selectedThreadId &&
          input.projectId === projectId
        ) {
          return prev;
        }
        return undefined;
      },
    },
  );

  useEffect(() => {
    if (threadsError) {
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive",
      });
    }
  }, [threadsError, toast]);

  useEffect(() => {
    if (threadError) {
      toast({
        title: "Error",
        description: "Failed to load thread details",
        variant: "destructive",
      });
    }
  }, [threadError, toast]);

  const handleViewMessages = (threadId: string) => {
    setSelectedThreadId(threadId);
    setIsMessagesModalOpen(true);
  };

  const handleThreadsDeleted = async () => {
    await utils.thread.getThreads.invalidate({ projectId });
    // Reset allThreads to trigger re-fetch
    setAllThreads([]);
  };

  const formattedThreads = allThreads.map((thread) => {
    const stats = calculateThreadStats(
      (thread.messages as MessageType[]) || [],
    );
    return {
      id: thread.id,
      name: thread.name || null,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      contextKey: thread.contextKey || "user_context_key",
      messages: thread.messages?.length || 0,
      tools: stats.tools,
      components: stats.components,
      errors: stats.errors,
    };
  });

  return (
    <>
      <ThreadTable
        threads={formattedThreads}
        onViewMessages={handleViewMessages}
        isLoading={isLoadingInitial || isLoadingAllThreads}
        projectId={projectId}
        onThreadsDeleted={handleThreadsDeleted}
        compact={compact}
      />

      <ThreadMessagesModal
        thread={selectedThread || ({} as ThreadType)}
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
        isLoading={isLoadingThread && !selectedThread}
      />
    </>
  );
}
