import { useListConversations } from "@workspace/api-client-react";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Messages() {
  const { data: conversations, isLoading } = useListConversations();

  return (
    <div className="space-y-8 h-full flex flex-col">
      <h1 className="font-serif text-3xl font-bold text-primary">Messagerie</h1>
      
      <div className="flex-1 bg-card border border-border rounded-xl flex overflow-hidden min-h-[500px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-border overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="divide-y divide-border">
              {conversations.map(conv => (
                <div key={conv.id} className="p-4 hover:bg-muted cursor-pointer transition-colors relative">
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-destructive"></div>
                  )}
                  <h4 className="font-semibold text-sm mb-1 truncate pr-6">{conv.subject}</h4>
                  <p className="text-xs text-muted-foreground truncate mb-2">{conv.lastMessage || "Aucun message"}</p>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "dd/MM/yyyy HH:mm") : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          )}
        </div>
        
        {/* Message View Placeholder */}
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Sélectionnez une conversation pour voir les messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}