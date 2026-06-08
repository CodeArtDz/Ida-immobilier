import { useState } from "react";
import { useListConversations } from "@workspace/api-client-react";
import type { Conversation } from "@workspace/api-client-react";
import ConversationView from "@/components/conversation-view";
import { MessageSquare, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";

export default function AdminMessages() {
  const { data: conversations = [], isLoading } = useListConversations({
    query: { refetchInterval: 5000 } as any,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(c =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    (c as any).propertyTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Messages</h1>
        {conversations.some(c => c.unreadCount && c.unreadCount > 0) && (
          <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 font-medium">
            {conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0)} non lu{conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0) > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex overflow-hidden min-h-[600px]">
        {/* Conversations list */}
        <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                className="pl-8 bg-background h-8 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-border">
                {filtered.map(conv => (
                  <ConvRow
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
                <p className="text-sm">{search ? "Aucun résultat" : "Aucune conversation"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <ConversationView key={selected.id} conversation={selected} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/10">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvRow({ conv, isSelected, onClick }: { conv: Conversation; isSelected: boolean; onClick: () => void }) {
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
      <p className="text-[10px] text-muted-foreground">
        {(conv as any).lastMessageAt ? format(new Date((conv as any).lastMessageAt), "dd/MM HH:mm", { locale: fr }) : ""}
      </p>
    </button>
  );
}
