import { useListConversations } from "@workspace/api-client-react";
import { MessageSquare, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function AdminMessages() {
  const { data: conversations, isLoading } = useListConversations();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Messages</h1>
      </div>
      
      <div className="flex-1 bg-card border border-border rounded-xl flex overflow-hidden min-h-[600px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 bg-background" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y divide-border">
                {conversations.map(conv => (
                  <div key={conv.id} className="p-4 hover:bg-muted cursor-pointer transition-colors relative">
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-destructive"></div>
                    )}
                    <h4 className="font-semibold text-sm mb-1 truncate pr-6">{conv.subject}</h4>
                    {conv.propertyTitle && (
                      <p className="text-xs text-accent truncate mb-1">{conv.propertyTitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mb-2">{conv.lastMessage || "Aucun message"}</p>
                    <p className="text-[10px] text-muted-foreground">
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
        </div>
        
        {/* Message View Placeholder */}
        <div className="flex-1 flex flex-col bg-muted/10">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}