import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { z } from "zod";
import { McpServerRow } from "./mcp-server-row";

export const McpServerSchema = z.object({
  id: z.string().describe("The unique identifier for the MCP server."),
  url: z.string().nullable().describe("The URL of the MCP server."),
  customHeaders: z
    .record(z.string())
    .describe("Custom headers for the MCP server."),
  mcpTransport: z
    .nativeEnum(MCPTransport)
    .optional()
    .describe("The transport mechanism for MCP communication."),
  mcpRequiresAuth: z
    .boolean()
    .optional()
    .describe("Whether the MCP server requires authentication."),
  mcpIsAuthed: z
    .boolean()
    .optional()
    .describe("Whether the MCP server is authenticated."),
});

export const AvailableMcpServersProps = z.object({
  project: z
    .object({
      id: z.string().describe("The unique identifier for the project."),
      name: z.string().describe("The name of the project."),
    })
    .describe("The project to fetch MCP servers for."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when MCP servers are successfully updated.",
    ),
});

type AvailableMcpServersProps = z.infer<typeof AvailableMcpServersProps>;

export function AvailableMcpServers({
  project,
  onEdited,
}: AvailableMcpServersProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const router = useRouter();

  const { data: mcpServers, refetch } = api.tools.listMcpServers.useQuery(
    { projectId: project?.id || "" },
    { enabled: !!project?.id },
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    onEdited?.();
  }, [refetch, onEdited]);

  const redirectToAuth = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  // Handle case when project is not provided
  if (!project) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">MCP Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Please select a project to view MCP Servers
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while fetching data
  if (!mcpServers) {
    return (
      <Card className="border rounded-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">MCP Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md animate-pulse">
              <div className="flex flex-col gap-1">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-9 flex-1 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                  <div className="h-9 w-9 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-9 flex-[2] bg-muted rounded" />
                  <div className="h-9 flex-[5] bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">MCP Servers</CardTitle>
          {!isAddingNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
            >
              Add MCP Server
            </Button>
          )}
        </div>
      </CardHeader>
      {(mcpServers.length > 0 || isAddingNew) && (
        <CardContent>
          {mcpServers.map((server) => (
            <McpServerRow
              key={server.id}
              server={server}
              projectId={project.id}
              onRefresh={handleRefresh}
              redirectToAuth={redirectToAuth}
            />
          ))}

          {isAddingNew && (
            <McpServerRow
              server={{
                id: "new",
                url: "",
                customHeaders: {},
              }}
              projectId={project.id}
              onRefresh={handleRefresh}
              isNew
              onCancel={() => setIsAddingNew(false)}
              redirectToAuth={redirectToAuth}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
