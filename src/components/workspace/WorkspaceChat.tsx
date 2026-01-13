import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Loader2, ArrowLeft, Users, User, Check, CheckCheck } from "lucide-react";
import { useChat, Message } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceMember } from "@/types/database";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WorkspaceChatProps {
  workspaceId: string;
  workspaceName: string;
  members?: WorkspaceMember[];
}

type ChatView = 'list' | 'group' | 'dm';

export function WorkspaceChat({ workspaceId, workspaceName, members = [] }: WorkspaceChatProps) {
  const { user } = useAuth();
  const [chatView, setChatView] = useState<ChatView>('list');
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const recipientId = chatView === 'dm' && selectedMember ? selectedMember.user_id : null;
  const { messages, isLoading, sendMessage } = useChat(workspaceId, recipientId);
  
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
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
    await sendMessage(newMessage, recipientId);
    setNewMessage("");
    setIsSending(false);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
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
  const otherMembers = members.filter(m => m.user_id !== user?.id);

  const openGroupChat = () => {
    setSelectedMember(null);
    setChatView('group');
  };

  const openDM = (member: WorkspaceMember) => {
    setSelectedMember(member);
    setChatView('dm');
  };

  const goBack = () => {
    setChatView('list');
    setSelectedMember(null);
  };

  const renderChatList = () => (
    <div className="flex flex-col h-full">
      {/* Group Chat Option */}
      <div 
        className="flex items-center gap-3 p-4 hover:bg-[#202c33] cursor-pointer border-b border-[#222d34]"
        onClick={openGroupChat}
      >
        <div className="h-12 w-12 rounded-full bg-[#00a884] flex items-center justify-center">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-[#e9edef]">{workspaceName} Group</h4>
          <p className="text-sm text-[#8696a0]">{members.length} members</p>
        </div>
      </div>

      {/* Direct Message Options */}
      <div className="px-4 py-2 bg-[#202c33]">
        <p className="text-xs text-[#8696a0] uppercase tracking-wide">Direct Messages</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {otherMembers.length === 0 ? (
          <div className="p-4 text-center text-[#8696a0]">
            <p>No other members yet</p>
          </div>
        ) : (
          otherMembers.map((member) => (
            <div 
              key={member.id}
              className="flex items-center gap-3 p-4 hover:bg-[#202c33] cursor-pointer border-b border-[#222d34]"
              onClick={() => openDM(member)}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-[#6b7175] text-white text-lg">
                  {(member.profile?.name || member.profile?.email || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-[#e9edef]">
                  {member.profile?.name || member.profile?.email || "Unknown"}
                </h4>
                <p className="text-sm text-[#8696a0] capitalize">{member.role}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 bg-[#202c33] border-b border-[#222d34]">
        <Button variant="ghost" size="icon" onClick={goBack} className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374045]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {chatView === 'group' ? (
          <>
            <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-[#e9edef]">{workspaceName}</h4>
              <p className="text-xs text-[#8696a0]">{members.length} members</p>
            </div>
          </>
        ) : (
          <>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#6b7175] text-white">
                {(selectedMember?.profile?.name || selectedMember?.profile?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-[#e9edef]">
                {selectedMember?.profile?.name || selectedMember?.profile?.email || "Unknown"}
              </h4>
              <p className="text-xs text-[#8696a0] capitalize">{selectedMember?.role}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages Area with WhatsApp wallpaper pattern */}
      <div 
        className="flex-1 overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a'
        }}
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 h-full">
            <div className="bg-[#182229] rounded-lg px-4 py-2">
              <p className="text-[#8696a0] text-sm">
                {chatView === 'group' 
                  ? "No messages yet. Start the conversation!" 
                  : `Start a conversation with ${selectedMember?.profile?.name || 'this member'}`
                }
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messageGroups.map((group) => (
                <div key={group.date}>
                  {/* Date Separator */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg shadow">
                      {getDateLabel(group.date)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {group.messages.map((message, idx) => {
                      const isOwn = message.sender_id === user?.id;
                      const showName = chatView === 'group' && !isOwn && 
                        (idx === 0 || group.messages[idx - 1].sender_id !== message.sender_id);
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-lg px-3 py-2 shadow relative",
                              isOwn
                                ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                                : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                            )}
                          >
                            {/* Sender Name for group chat */}
                            {showName && (
                              <p className="text-xs font-medium text-[#00a884] mb-1">
                                {message.sender?.name || message.sender?.email || "Unknown"}
                              </p>
                            )}
                            
                            {/* Message Content */}
                            <div className="flex items-end gap-2">
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <span className="text-[10px] text-[#8696a0] flex-shrink-0 flex items-center gap-0.5">
                                {formatMessageTime(message.created_at)}
                                {isOwn && (
                                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] ml-0.5" />
                                )}
                              </span>
                            </div>
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
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 bg-[#202c33] border-t border-[#222d34]">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-[#2a3942] border-none text-[#e9edef] placeholder:text-[#8696a0] rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSending || !newMessage.trim()}
            className="bg-[#00a884] hover:bg-[#00a884]/90 rounded-full h-10 w-10"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );

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
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="w-full sm:max-w-md flex flex-col p-0 border-l border-[#222d34]"
        style={{ backgroundColor: '#111b21' }}
      >
        <SheetHeader className="p-4 bg-[#202c33] border-b border-[#222d34]">
          <SheetTitle className="flex items-center gap-2 text-[#e9edef]">
            <MessageCircle className="h-5 w-5 text-[#00a884]" />
            {chatView === 'list' ? 'Chats' : chatView === 'group' ? 'Group Chat' : 'Direct Message'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {chatView === 'list' ? renderChatList() : renderChat()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
