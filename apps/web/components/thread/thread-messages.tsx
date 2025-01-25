import { Card } from "@/components/ui/card";
import { RouterOutputs } from "@/trpc/react";

type ThreadType = RouterOutputs["thread"]["getThread"];

interface ThreadMessagesProps {
  thread: ThreadType;
}

interface Message {
  id: string;
  role: string;
  content: string;
}

export function ThreadMessages({ thread }: Readonly<ThreadMessagesProps>) {
  const messages = (thread?.messages as Message[]) || [];

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className="p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground capitalize">
              {message.role}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
