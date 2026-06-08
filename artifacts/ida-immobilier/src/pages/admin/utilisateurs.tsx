import { useListUsers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function AdminUtilisateurs() {
  const { data: usersResponse, isLoading } = useListUsers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion des Utilisateurs</h1>
        <Button className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Utilisateur</TableHead>
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
                <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : usersResponse?.data && usersResponse.data.length > 0 ? (
              usersResponse.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <span>{({"superadmin":"Super Admin","admin":"Administrateur","agency_manager":"Directeur d'agence","agent":"Agent","client":"Client"} as Record<string,string>)[user.role] ?? user.role}</span>
                  </TableCell>
                  <TableCell>{user.agencyName || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                      ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={user.isActive ? "text-destructive" : "text-green-600"} title={user.isActive ? "Désactiver" : "Activer"}>
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}