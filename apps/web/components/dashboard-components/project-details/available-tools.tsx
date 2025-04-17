import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Check, ChevronsUpDown, Key, Trash2 } from "lucide-react";
import * as React from "react";

interface AvailableToolsProps {
  project: { id: string; name: string };
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const {
    data: apps,
    isLoading,
    refetch: refetchApps,
  } = api.tools.listApps.useQuery({
    projectId: project.id,
  });

  const { mutate: enableApp } = api.tools.enableApp.useMutation({
    onSuccess: async () => {
      await refetchApps();
      setValue(""); // Reset combobox after enabling
      setOpen(false);
    },
  });

  const { mutate: disableApp } = api.tools.disableApp.useMutation({
    onSuccess: async () => {
      await refetchApps();
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-muted rounded" />;
  }

  if (!apps?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No tools available for this project
      </div>
    );
  }

  const enabledApps = apps.filter((app) => app.enabled);
  const disabledApps = apps.filter((app) => !app.enabled);

  return (
    <Card className="border rounded-md overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-heading font-semibold">
          Available Apps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Combobox for disabled apps */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {value
                  ? disabledApps.find((app) => app.appId === value)?.name
                  : "Add an app..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search apps..." />
                <CommandList>
                  <CommandEmpty>No apps found.</CommandEmpty>
                  <CommandGroup>
                    {disabledApps.map((app) => (
                      <CommandItem
                        key={app.appId}
                        value={app.appId}
                        onSelect={(currentValue) => {
                          enableApp({
                            projectId: project.id,
                            appId: currentValue,
                          });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={app.logo}
                            alt={app.name}
                            className="w-4 h-4 rounded-full"
                          />
                          {app.name}
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === app.appId ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* List of enabled apps */}
          <div className="space-y-2">
            {enabledApps.map((app) => (
              <div
                key={app.appId}
                className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={app.logo}
                    alt={app.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{app.name}</span>
                  {app.tags &&
                    (app.tags as string[]).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                  {!app.no_auth && (
                    <Button variant="outline" size="sm">
                      <Key className="h-4 w-4" />
                      <span className="sr-only">Authenticate</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      disableApp({
                        projectId: project.id,
                        appId: app.appId,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
