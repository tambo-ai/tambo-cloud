import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { useCallback, useState } from "react";

interface KeyStepProps {
  apiKey: string;
  countdown: number;
  isLoading: boolean;
  error: unknown;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => Promise<void>;
  providerKey: string | null;
  onProviderKeyChange: (key: string) => Promise<void>;
  projectName: string;
}

/**
 * KeyStep Component
 *
 * Handles API key generation and OpenAI key management:
 * - Provides interface to generate new keys
 * - Displays newly generated keys with copy functionality
 * - Shows countdown for auto-close after key generation
 * - Manages OpenAI API key configuration
 */
export function KeyStep({
  apiKey,
  countdown,
  isLoading,
  error,
  isGenerating,
  onBack,
  onGenerate,
  providerKey,
  onProviderKeyChange,
  projectName,
}: KeyStepProps) {
  const { toast } = useToast();
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [newProviderKey, setNewProviderKey] = useState("");

  const handleProviderKeySave = async () => {
    try {
      await onProviderKeyChange(newProviderKey);
      setIsEditingProviderKey(false);
      setNewProviderKey("");
      toast({
        title: "Success",
        description: "OpenAI API key updated successfully",
      });
    } catch (error) {
      console.error("Failed to update OpenAI API key:", error);
      toast({
        title: "Error",
        description: "Failed to update OpenAI API key",
        variant: "destructive",
      });
    }
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy API key to clipboard",
        variant: "destructive",
      });
    }
  }, [apiKey, toast]);

  if (apiKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-medium">{projectName}</h2>
          <p className="text-sm text-muted-foreground">
            Your new API key has been generated
          </p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your New API Key</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy
            </Button>
          </div>
          <p className="font-mono text-sm bg-white p-3 rounded border break-all">
            {apiKey}
          </p>
        </Card>
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Make sure to copy your API key now. You won&apos;t be able to see it
            again. This window will close automatically in {countdown} seconds.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center gap-4">
        <Icons.spinner className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-red-500">An error occurred</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Button>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-medium">{projectName}</h2>
        <p className="text-sm text-muted-foreground">Configure your API keys</p>
      </div>

      <Card className="p-4 bg-muted space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">OpenAI API Key</p>
          {isEditingProviderKey ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProviderKeySave}
                className="h-8"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingProviderKey(false);
                  setNewProviderKey("");
                }}
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingProviderKey(true)}
              className="h-8"
            >
              Edit
            </Button>
          )}
        </div>
        {isEditingProviderKey ? (
          <input
            type="password"
            value={newProviderKey}
            onChange={(e) => setNewProviderKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="w-full px-3 py-2 text-sm border rounded-md"
            autoFocus
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {providerKey ? "••••••••" : "No API key set"}
          </p>
        )}
      </Card>

      <Card className="p-4">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full h-12"
        >
          {isGenerating ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
              </svg>
              Generate New API Key
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
