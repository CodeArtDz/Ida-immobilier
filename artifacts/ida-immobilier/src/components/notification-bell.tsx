import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
  type Notification,
} from "@workspace/api-client-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  new_property_match: "Nouveau bien",
  price_change: "Changement de prix",
  status_change: "Changement de statut",
  new_lead: "Nouveau lead",
  new_message: "Nouveau message",
  appointment_reminder: "Rappel rendez-vous",
};

export function NotificationBell({ triggerClassName }: { triggerClassName?: string }) {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useListNotifications(undefined, {
    query: { refetchInterval: 15000 } as any,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const handleMarkRead = (n: Notification) => {
    if (n.isRead) return;
    markRead.mutate({ id: n.id }, { onSuccess: invalidate });
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    markAllRead.mutate(undefined, { onSuccess: invalidate });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className={`relative ${triggerClassName ?? ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-serif font-bold text-primary text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              Aucune notification
            </div>
          ) : (
            sorted.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${
                  n.isRead ? "" : "bg-accent/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-accent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                      {n.isRead && <Check className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
