import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { useChat, Message } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WorkspaceChatProps {
  workspaceId: string;
  workspaceName: string;
}

export function WorkspaceChat({ workspaceId, workspaceName }: WorkspaceChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChat(workspaceId);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    await sendMessage(newMessage);
    setNewMessage("");
    setIsSending(false);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday " + format(date, "h:mm a");
    }
    return format(date, "MMM d, h:mm a");
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Team Chat
          {messages.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {messages.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            {workspaceName} Chat
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70">Start the conversation!</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-6">
                {messageGroups.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground px-2">
                        {getDateLabel(group.date)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    
                    <div className="space-y-3">
                      {group.messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2",
                              isOwn && "flex-row-reverse"
                            )}
                          >
                            {!isOwn && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {(message.sender?.name || message.sender?.email || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                              {!isOwn && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {message.sender?.name || message.sender?.email || "Unknown"}
                                </p>
                              )}
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-2 inline-block text-sm",
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                )}
                              >
                                {message.content}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <form onSubmit={handleSend} className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
