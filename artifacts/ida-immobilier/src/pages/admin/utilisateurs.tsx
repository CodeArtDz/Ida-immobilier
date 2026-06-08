import { useState, useEffect } from "react";
import {
  useListUsers, useCreateUser, useUpdateUser, useDeactivateUser, useListAgencies,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import type { User, UserInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, UserCheck, UserX, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrateur",
  agency_manager: "Directeur d'agence",
  agent: "Agent",
  client: "Client",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  agency_manager: "bg-amber-100 text-amber-700",
  agent: "bg-accent/20 text-accent",
  client: "bg-muted text-muted-foreground",
};

const ROLES_FOR_FILTER = [
  { key: "all", label: "Tous" },
  { key: "superadmin", label: "Super Admins" },
  { key: "admin", label: "Admins" },
  { key: "agency_manager", label: "Directeurs" },
  { key: "agent", label: "Agents" },
];

const STAFF_ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Administrateur" },
  { value: "agency_manager", label: "Directeur d'agence" },
  { value: "agent", label: "Agent" },
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "agent" as UserInput["role"],
  agencyId: "" as string | number,
  password: "",
};

export default function AdminUtilisateurs() {
  const queryClient = useQueryClient();
  const { data: allUsers = [], isLoading } = useListUsers();
  const users = allUsers.filter(u => u.role !== "client");
  const { data: agencies = [] } = useListAgencies();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form when editing
  useEffect(() => {
    if (editTarget) {
      setForm({
        firstName: editTarget.firstName,
        lastName: editTarget.lastName,
        email: editTarget.email,
        phone: editTarget.phone ?? "",
        role: editTarget.role as UserInput["role"],
        agencyId: editTarget.agencyId ?? "",
        password: "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [editTarget, dialogOpen]);

  const filtered = users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countFor = (role: string) => role === "all" ? users.length : users.filter(u => u.role === role).length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const openCreate = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (u: User) => { setEditTarget(u); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.role) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!editTarget && !form.password) {
      setError("Un mot de passe est requis pour créer un compte.");
      return;
    }
    setSaving(true);
    setError("");

    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      agencyId: form.agencyId ? Number(form.agencyId) : null,
    };
    if (form.password) payload.password = form.password;

    try {
      if (editTarget) {
        await new Promise<void>((resolve, reject) =>
          updateUser.mutate({ id: editTarget.id, data: payload }, { onSuccess: () => resolve(), onError: reject })
        );
      } else {
        await new Promise<void>((resolve, reject) =>
          createUser.mutate({ data: payload as UserInput }, { onSuccess: () => resolve(), onError: reject })
        );
      }
      invalidate();
      setDialogOpen(false);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion du Personnel</h1>
        <Button className="bg-primary hover:bg-primary/90" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau membre
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Role filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {ROLES_FOR_FILTER.map(r => (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                roleFilter === r.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {r.label}
              <span className={`ml-1.5 ${roleFilter === r.key ? "opacity-80" : "opacity-60"}`}>
                {countFor(r.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            className="pl-9 h-8 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Agence</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        {u.phone && <div className="text-xs text-muted-foreground">{u.phone}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? "bg-muted text-foreground"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.agencyName || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Modifier"
                        onClick={() => openEdit(u)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${u.isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}`}
                        title={u.isActive ? "Désactiver le compte" : "Activer le compte"}
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
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  {search ? `Aucun résultat pour "${search}"` : "Aucun membre trouvé"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total count */}
      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} membre{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        {users.length !== filtered.length ? ` sur ${users.length}` : ""}
      </p>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editTarget ? "Modifier le membre" : "Nouveau membre du personnel"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="Sophie"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Bernard"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="sophie.bernard@ida-immobilier.fr"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 10 00 00 00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Rôle <span className="text-destructive">*</span></Label>
              <Select
                value={form.role}
                onValueChange={v => setForm(f => ({ ...f, role: v as UserInput["role"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Agence</Label>
              <Select
                value={form.agencyId ? String(form.agencyId) : "none"}
                onValueChange={v => setForm(f => ({ ...f, agencyId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune agence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune agence</SelectItem>
                  {agencies.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="password">
                Mot de passe {!editTarget && <span className="text-destructive">*</span>}
                {editTarget && <span className="text-xs text-muted-foreground ml-1">(laisser vide pour ne pas modifier)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={editTarget ? "••••••••" : "Mot de passe initial"}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editTarget ? "Enregistrer" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate / Deactivate Confirmation */}
      <AlertDialog open={!!confirmUser} onOpenChange={open => !open && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmUser?.isActive ? "Désactiver ce compte ?" : "Activer ce compte ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser?.isActive
                ? `Le compte de ${confirmUser?.firstName} ${confirmUser?.lastName} sera désactivé. Cette personne ne pourra plus se connecter.`
                : `Le compte de ${confirmUser?.firstName} ${confirmUser?.lastName} sera réactivé. Cette personne pourra se reconnecter.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
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
