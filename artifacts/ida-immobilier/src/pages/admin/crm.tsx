import { useState } from "react";
import { useListUsers, useUpdateUser, useDeactivateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, UserCheck, UserX, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminCRM() {
  const queryClient = useQueryClient();
  const { data: allUsers = [], isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  const clients = allUsers.filter(u => u.role === "client");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const filtered = clients.filter(u => {
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "inactive" && u.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggle = () => {
    if (!confirmUser) return;
    if (confirmUser.isActive) {
      deactivateUser.mutate({ id: confirmUser.id }, { onSuccess: invalidate });
    } else {
      updateUser.mutate({ id: confirmUser.id, data: { isActive: true } as any }, { onSuccess: invalidate });
    }
    setConfirmUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">CRM — Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""} ·{" "}
            {clients.filter(u => u.isActive).length} actif{clients.filter(u => u.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Tous", count: clients.length },
            { key: "active", label: "Actifs", count: clients.filter(u => u.isActive).length },
            { key: "inactive", label: "Inactifs", count: clients.filter(u => !u.isActive).length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {f.label} <span className="opacity-70 ml-1">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Rechercher…" className="pl-9 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Client</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Envoyer un message"
                        onClick={() => window.open(`mailto:${u.email}`)}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${u.isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}`}
                        title={u.isActive ? "Désactiver" : "Activer"}
                        onClick={() => setConfirmUser(u)}
                      >
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  {search ? `Aucun résultat pour "${search}"` : "Aucun client enregistré"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} client{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        {clients.length !== filtered.length ? ` sur ${clients.length}` : ""}
      </p>

      <AlertDialog open={!!confirmUser} onOpenChange={open => !open && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmUser?.isActive ? "Désactiver ce compte ?" : "Activer ce compte ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser?.isActive
                ? `Le compte de ${confirmUser?.firstName} ${confirmUser?.lastName} sera désactivé.`
                : `Le compte de ${confirmUser?.firstName} ${confirmUser?.lastName} sera réactivé.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={confirmUser?.isActive ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            >
              {confirmUser?.isActive ? "Désactiver" : "Activer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
