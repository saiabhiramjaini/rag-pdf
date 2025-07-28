import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-muted-foreground mr-12"
        )}
      >
        <p className="whitespace-pre-wrap">{message}</p>
        <p className="text-xs opacity-70 mt-1">
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
