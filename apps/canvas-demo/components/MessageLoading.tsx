import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

const defaultLoadingMessages = [
  "Analyzing your request...",
  "Searching FRED database...",
  "Processing economic data...",
  "Preparing visualization...",
  "Generating insights...",
];

interface HydraStatus {
  status: string;
  progress?: number;
}

export function MessageLoading() {
  const [message, setMessage] = useState(defaultLoadingMessages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateStatus = (event: CustomEvent<{ status: HydraStatus }>) => {
      const status = event.detail.status;
      setMessage(status.status || defaultLoadingMessages[0]);
      setProgress(status.progress || 0);
    };

    window.addEventListener(
      "hydra-status-update",
      updateStatus as EventListener
    );

    const messageInterval = setInterval(() => {
      setMessage((prev) => {
        const currentIndex = defaultLoadingMessages.indexOf(prev);
        return defaultLoadingMessages[
          (currentIndex + 1) % defaultLoadingMessages.length
        ];
      });
    }, 4000);

    return () => {
      window.removeEventListener(
        "hydra-status-update",
        updateStatus as EventListener
      );
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex w-full gap-4 p-4 bg-background">
      <div className="flex-1 space-y-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {progress > 0 && <Progress value={progress} className="h-1" />}
      </div>
    </div>
  );
}
