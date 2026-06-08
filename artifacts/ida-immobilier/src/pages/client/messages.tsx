import { useState } from "react";
import { useListConversations } from "@workspace/api-client-react";
import type { Conversation } from "@workspace/api-client-react";
import ConversationView from "@/components/conversation-view";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Messages() {
  const { data: conversations = [], isLoading } = useListConversations({
    query: { refetchInterval: 5000 } as any,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary">Messagerie</h1>
        {conversations.some(c => c.unreadCount && c.unreadCount > 0) && (
          <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 font-medium">
            {conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0)} non lu{conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0) > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex overflow-hidden min-h-[500px]">
        {/* Conversations list */}
        <div className="w-72 border-r border-border flex-shrink-0 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-border">
              {conversations.map(conv => (
                <ClientConvRow
                  key={conv.id}
                  conv={conv}
                  isSelected={conv.id === selectedId}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-1">Contactez un agent depuis une annonce pour démarrer un échange.</p>
            </div>
          )}
        </div>

        {/* Chat pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <ConversationView key={selected.id} conversation={selected} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center text-muted-foreground px-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Sélectionnez une conversation</p>
                <p className="text-xs mt-1">Vos échanges avec les agents I.D.A Immobilier apparaissent ici.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientConvRow({ conv, isSelected, onClick }: { conv: Conversation; isSelected: boolean; onClick: () => void }) {
  const hasUnread = conv.unreadCount && conv.unreadCount > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-muted/60 transition-colors relative ${isSelected ? "bg-muted/80 border-l-2 border-l-primary" : ""}`}
    >
      {hasUnread && (
        <span className="absolute top-3.5 right-3.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {conv.unreadCount}
        </span>
      )}
      <p className={`text-sm mb-0.5 truncate pr-7 ${hasUnread ? "font-semibold" : "font-medium"}`}>
        {conv.subject}
      </p>
      {(conv as any).propertyTitle && (
        <p className="text-[11px] text-accent truncate mb-0.5">{(conv as any).propertyTitle}</p>
      )}
      <p className="text-xs text-muted-foreground truncate mb-1.5">{(conv as any).lastMessage || "Aucun message"}</p>
      <p className="text-[10px] text-muted-foreground text-right">
        {(conv as any).lastMessageAt ? format(new Date((conv as any).lastMessageAt), "dd/MM HH:mm", { locale: fr }) : ""}
      </p>
    </button>
  );
}
