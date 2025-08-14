"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, type RouterOutputs } from "@/trpc/react";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Database,
  Loader2,
  Shield,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  SiAuth0,
  SiClerk,
  SiGithub,
  SiGoogle,
  SiOkta,
  SiSupabase,
} from "react-icons/si";
import { z } from "zod";

export const OAuthSettingsPropsSchema = z.object({
  project: z
    .object({
      id: z.string().describe("The unique identifier for the project."),
      name: z.string().describe("The name of the project."),
    })
    .optional()
    .describe("The project to configure OAuth validation settings for."),
});

interface OAuthSettingsProps {
  project?: RouterOutputs["project"]["getUserProjects"][number];
}

// OAuth provider presets
const OAUTH_PRESETS = [
  { name: "Google", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiGoogle },
  { name: "GitHub", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiGithub },
  {
    name: "Microsoft",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Building2,
  },
  {
    name: "Login.gov",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Shield,
  },
  { name: "Auth0", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiAuth0 },
  { name: "Clerk", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiClerk },
  { name: "Supabase Auth", mode: OAuthValidationMode.NONE, icon: SiSupabase },
  {
    name: "Supabase Auth (beta API Keys)",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: SiSupabase,
  },
  { name: "Neon", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: Database },
  { name: "Okta", mode: OAuthValidationMode.ASYMMETRIC_AUTO, icon: SiOkta },
  {
    name: "BetterAuth",
    mode: OAuthValidationMode.ASYMMETRIC_AUTO,
    icon: Shield,
  },
] as const;

export function OAuthSettings({ project }: OAuthSettingsProps) {
  const { toast } = useToast();

  // State management
  const [selectedMode, setSelectedMode] = useState<OAuthValidationMode>(
    OAuthValidationMode.NONE,
  );
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isTokenRequired, setIsTokenRequired] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // API queries and mutations
  const {
    data: oauthSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = api.project.getOAuthValidationSettings.useQuery(
    { projectId: project?.id ?? "" },
    { enabled: !!project?.id },
  );

  const { mutateAsync: updateSettings, isPending: isUpdating } =
    api.project.updateOAuthValidationSettings.useMutation();

  // Initialize form with current settings
  useEffect(() => {
    if (oauthSettings) {
      setSelectedMode(oauthSettings.mode);
      setPublicKey(oauthSettings.publicKey || "");
      setSecretKey("");
      setHasUnsavedChanges(false);
    }
  }, [oauthSettings]);

  // Initialize token required state from project data
  useEffect(() => {
    if (project) {
      setIsTokenRequired(project.isTokenRequired ?? false);
    }
  }, [project]);

  // Track changes
  useEffect(() => {
    if (!oauthSettings || !project) return;

    const hasOAuthChanges =
      selectedMode !== oauthSettings.mode ||
      (selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL &&
        publicKey !== (oauthSettings.publicKey || "")) ||
      (selectedMode === OAuthValidationMode.SYMMETRIC && secretKey !== "");

    const hasTokenRequiredChanges =
      isTokenRequired !== (project.isTokenRequired ?? false);

    setHasUnsavedChanges(hasOAuthChanges || hasTokenRequiredChanges);
  }, [
    selectedMode,
    publicKey,
    secretKey,
    isTokenRequired,
    oauthSettings,
    project,
  ]);

  const handleSave = useCallback(async () => {
    if (!project?.id) return;

    try {
      await updateSettings({
        projectId: project.id,
        mode: selectedMode,
        secretKey:
          selectedMode === OAuthValidationMode.SYMMETRIC
            ? secretKey
            : undefined,
        publicKey:
          selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL
            ? publicKey
            : undefined,
        isTokenRequired,
      });

      toast({
        title: "Success",
        description: "OAuth validation settings updated successfully",
      });

      setSecretKey("");
      setHasUnsavedChanges(false);
      await refetchSettings();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update OAuth validation settings",
        variant: "destructive",
      });
    }
  }, [
    project?.id,
    selectedMode,
    secretKey,
    publicKey,
    isTokenRequired,
    updateSettings,
    toast,
    refetchSettings,
  ]);

  const handleModeChange = (mode: OAuthValidationMode) => {
    setSelectedMode(mode);
    // Clear keys when switching modes
    if (mode !== OAuthValidationMode.SYMMETRIC) {
      setSecretKey("");
    }
    if (mode !== OAuthValidationMode.ASYMMETRIC_MANUAL) {
      setPublicKey("");
    }
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OAuth Token Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          OAuth Token Validation
        </CardTitle>
        <p className="text-sm font-sans text-foreground max-w-md">
          Configure how OAuth bearer tokens are validated for your
          project&apos;s API endpoints.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Required */}
        <div className="flex flex-col gap-2">
          <Label className="text-base font-medium">Token Required</Label>
          <Switch
            checked={isTokenRequired}
            onCheckedChange={setIsTokenRequired}
          />
          <p className="text-sm text-muted-foreground">
            When enabled, all API requests must include a valid OAuth bearer
            token. When disabled, requests can proceed without authentication.
          </p>
        </div>
        {/* Validation Mode Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Validation Mode</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Apply a preset
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {OAUTH_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.name}
                    onClick={() => handleModeChange(preset.mode)}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <preset.icon className="h-4 w-4" />
                      {preset.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <RadioGroup
            value={selectedMode}
            onValueChange={(value) =>
              handleModeChange(value as OAuthValidationMode)
            }
            className="space-y-3"
          >
            {/* NONE */}
            <label
              htmlFor="mode-none"
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.NONE}
                id="mode-none"
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">None</div>
                <div className="text-xs text-foreground">
                  Accept tokens as-is without validation. Useful when validation
                  is handled externally.
                </div>
              </div>
            </label>

            {/* SYMMETRIC */}
            <label
              htmlFor="mode-symmetric"
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.SYMMETRIC}
                id="mode-symmetric"
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">Symmetric Key (HS256)</div>
                <div className="text-xs text-foreground">
                  Validate tokens using a shared secret key. Requires storing
                  the secret key securely.
                </div>
                {selectedMode === OAuthValidationMode.SYMMETRIC && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <Label htmlFor="secret-key" className="text-sm">
                      Secret Key
                    </Label>
                    <Input
                      id="secret-key"
                      type="password"
                      placeholder="Enter your shared secret key"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-xs text-muted-foreground">
                      {oauthSettings?.hasSecretKey
                        ? "A secret key is currently stored. Enter a new key to replace it."
                        : "This key will be encrypted and stored securely."}
                    </p>
                  </motion.div>
                )}
              </div>
            </label>

            {/* ASYMMETRIC_AUTO */}
            <label
              htmlFor="mode-asymmetric-auto"
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.ASYMMETRIC_AUTO}
                id="mode-asymmetric-auto"
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">
                  Asymmetric Auto (OpenID Connect)
                </div>
                <div className="text-xs text-foreground">
                  Automatically fetch public keys from the OAuth provider&apos;s
                  OpenID Connect discovery endpoint.
                </div>
              </div>
            </label>

            {/* ASYMMETRIC_MANUAL */}
            <label
              htmlFor="mode-asymmetric-manual"
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem
                value={OAuthValidationMode.ASYMMETRIC_MANUAL}
                id="mode-asymmetric-manual"
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-md">Asymmetric Manual</div>
                <div className="text-xs text-foreground">
                  Validate tokens using a manually provided public key (RS256,
                  ES256, etc.).
                </div>
                {selectedMode === OAuthValidationMode.ASYMMETRIC_MANUAL && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <Label htmlFor="public-key" className="text-sm">
                      Public Key
                    </Label>
                    <Textarea
                      id="public-key"
                      placeholder={`-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the public key in PEM format. This will be used to
                      verify JWT signatures.
                    </p>
                  </motion.div>
                )}
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
