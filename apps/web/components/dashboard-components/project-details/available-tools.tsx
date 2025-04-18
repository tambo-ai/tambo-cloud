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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  ComposioAuthMode,
  ComposioConnectorConfig,
} from "@tambo-ai-cloud/core";
import { Check, ChevronsUpDown, Key, Trash2 } from "lucide-react";
import * as React from "react";
interface AvailableToolsProps {
  project: { id: string; name: string };
}

interface EnabledAppRowProps {
  app: {
    appId: string;
    name: string;
    logo: string;
    tags?: string[];
    auth_schemes?: ComposioConnectorConfig[];
    no_auth?: boolean;
  };
  onDisable: (appId: string) => void;
  onUpdateAuth?: (
    appId: string,
    schemeId: string,
    values: Record<string, string>,
  ) => void;
}

interface ToolAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: {
    name: string;
    auth_schemes?: ComposioConnectorConfig[];
  };
  onUpdateAuth: (schemeId: string, values: Record<string, string>) => void;
}

function ToolAuthDialog({
  open,
  onOpenChange,
  app,
  onUpdateAuth,
}: ToolAuthDialogProps) {
  const [selectedScheme, setSelectedScheme] = React.useState<
    ComposioAuthMode | ""
  >("");
  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>(
    {},
  );

  // Set the selected scheme to the only option if there's just one
  React.useEffect(() => {
    if (app.auth_schemes?.length === 1) {
      setSelectedScheme(app.auth_schemes[0].mode);
    }
  }, [app.auth_schemes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAuth(selectedScheme, fieldValues);
    onOpenChange(false);
  };

  const currentScheme = app.auth_schemes?.find(
    (scheme) => scheme.mode === selectedScheme,
  );
  if (!currentScheme) {
    console.log("No scheme found for", selectedScheme, app.auth_schemes);
  } else if (!currentScheme?.fields) {
    console.log("No fields for scheme", currentScheme);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Authentication for {app.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {app.auth_schemes && app.auth_schemes.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Authentication Method
                </label>
                <Select
                  value={selectedScheme}
                  onValueChange={(value: string) =>
                    setSelectedScheme(value as ComposioAuthMode)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select auth method" />
                  </SelectTrigger>
                  <SelectContent>
                    {app.auth_schemes.map((scheme) => (
                      <SelectItem key={scheme.mode} value={scheme.mode}>
                        {getAuthModeName(scheme.mode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentScheme?.fields && (
              <div className="space-y-4">
                {currentScheme.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.display_name}
                    </label>
                    <Input
                      type={field.is_secret ? "password" : "text"}
                      placeholder={field.display_name}
                      value={fieldValues[field.name] || ""}
                      onChange={(e) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      required={field.required}
                    />
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {field.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {currentScheme &&
              (!currentScheme.fields || currentScheme.fields.length === 0) && (
                <div className="space-y-2 py-2">
                  <p className="text-sm text-muted-foreground">
                    This authentication method doesn&apos;t require any
                    additional configuration. You can proceed by clicking Save.
                  </p>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnabledAppRow({ app, onDisable, onUpdateAuth }: EnabledAppRowProps) {
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={app.logo} alt={app.name} className="w-4 h-4 rounded-full" />
          <span>{app.name}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {app.tags &&
            app.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10"
              >
                {tag.trim()}
              </span>
            ))}
          {app.auth_schemes?.map((scheme, i) => (
            <span
              key={`auth-${i}`}
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary/50 text-secondary-foreground"
            >
              {getAuthModeName(scheme.mode)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!app.no_auth && app.auth_schemes && app.auth_schemes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAuthDialogOpen(true)}
          >
            <Key className="h-4 w-4" />
            <span className="sr-only">Authenticate</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDisable(app.appId)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>

      <ToolAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        app={app}
        onUpdateAuth={(schemeId, values) => {
          if (onUpdateAuth) {
            onUpdateAuth(app.appId, schemeId, values);
          }
        }}
      />
    </div>
  );
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedAppId, setSelectedAppId] = React.useState("");

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
      setSelectedAppId(""); // Reset combobox after enabling
      setOpen(false);
    },
  });

  const { mutate: disableApp } = api.tools.disableApp.useMutation({
    onSuccess: async () => {
      await refetchApps();
    },
  });

  const handleUpdateAuth = (
    appId: string,
    schemeId: string,
    values: Record<string, string>,
  ) => {
    // This is a no-op for now, will be implemented later
    console.log(
      "Update auth for app",
      appId,
      "scheme",
      schemeId,
      "values",
      values,
    );
  };

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
                {selectedAppId
                  ? disabledApps.find((app) => app.appId === selectedAppId)
                      ?.name
                  : "Add an app..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 max-w-prose">
              <Command>
                <CommandInput placeholder="Search apps..." />
                <CommandList>
                  <CommandEmpty>No apps found.</CommandEmpty>
                  <CommandGroup>
                    {disabledApps.map((app) => (
                      <CommandItem
                        key={app.appId}
                        value={app.name}
                        keywords={app.tags}
                        onSelect={(currentValue) => {
                          // kind of a hack since we want appId, but the combobox is using name
                          const appId = apps.find(
                            (a) => a.name === currentValue,
                          )?.appId;
                          if (appId) {
                            enableApp({
                              projectId: project.id,
                              appId,
                            });
                          }
                        }}
                        className="flex flex-col items-start py-3"
                      >
                        <div className="flex items-center w-full">
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
                              selectedAppId === app.appId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {app.description}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {app.auth_schemes?.map((scheme, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary/50 text-secondary-foreground"
                              >
                                {getAuthModeName(
                                  scheme.mode as ComposioAuthMode,
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
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
              <EnabledAppRow
                key={app.appId}
                app={app}
                onDisable={(appId) =>
                  disableApp({
                    projectId: project.id,
                    appId,
                  })
                }
                onUpdateAuth={handleUpdateAuth}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getAuthModeName(mode: ComposioAuthMode): string {
  switch (mode) {
    case ComposioAuthMode.API_KEY:
      return "API Key";
    case ComposioAuthMode.OAUTH2:
      return "OAuth 2.0";
    case ComposioAuthMode.BEARER_TOKEN:
      return "Bearer Token";
    case ComposioAuthMode.BASIC:
      return "Basic Auth";
    case ComposioAuthMode.BASIC_WITH_JWT:
      return "Basic Auth + JWT";
    default:
      return mode;
  }
}
