import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThreadInput } from "@hydra-ai/react";
import { Loader2 } from "lucide-react";

interface ThreadInputProps {
  onError?: (error: Error) => void;
}

export function ThreadInput({ onError }: ThreadInputProps) {
  const { value, setValue, submit, isSubmitting } = useThreadInput();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        disabled={isSubmitting}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
      </Button>
    </form>
  );
}
