import { useEffect, useRef, useState } from "react";
import { useListMessages, useSendMessage, useMarkConversationRead } from "@workspace/api-client-react";
import type { Conversation } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getListMessagesQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Send, Home, Users, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

interface ConversationViewProps {
  conversation: Conversation;
}

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Hier ${format(d, "HH:mm")}`;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export default function ConversationView({ conversation }: ConversationViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useListMessages(conversation.id, {
    query: { refetchInterval: 3000 } as any,
  });

  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage();

  // Mark as read whenever this conversation is opened / messages refresh
  useEffect(() => {
    if (conversation.id) {
      markRead.mutate({ id: conversation.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    sendMessage.mutate(
      { id: conversation.id, data: { body: text } },
      {
        onSuccess: () => {
          setBody("");
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversation.id) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onSettled: () => setSending(false),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-start gap-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug text-foreground truncate">
            {conversation.subject}
          </h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {(conversation as any).propertyTitle && (
              <span className="flex items-center gap-1 text-[11px] text-accent font-medium">
                <Home className="w-3 h-3" />
                {(conversation as any).propertyTitle}
              </span>
            )}
            {(conversation as any).participantCount && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="w-3 h-3" />
                {(conversation as any).participantCount} participant{(conversation as any).participantCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Aucun message pour l'instant.
          </div>
        ) : (
          messages.map((msg: any) => {
            const isOwn = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[72%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!isOwn && (
                    <span className="text-[10px] font-medium text-muted-foreground px-1">
                      {msg.senderName || "Inconnu"}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {msg.createdAt ? formatMsgTime(msg.createdAt) : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      <div className="flex-shrink-0 border-t border-border bg-background p-3 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message… (Entrée pour envoyer)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-input bg-muted/40 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all min-h-[60px] max-h-[120px]"
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
