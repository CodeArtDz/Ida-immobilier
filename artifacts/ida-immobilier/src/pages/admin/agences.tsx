import { useListAgencies } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function AdminAgences() {
  const { data: agencies, isLoading } = useListAgencies();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion des Agences</h1>
        <Button className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle agence
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Agents</TableHead>
              <TableHead>Biens</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : agencies && agencies.length > 0 ? (
              agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>{agency.city}</TableCell>
                  <TableCell>
                    <div className="text-sm">{agency.email}</div>
                    <div className="text-xs text-muted-foreground">{agency.phone}</div>
                  </TableCell>
                  <TableCell>{agency.agentCount || 0}</TableCell>
                  <TableCell>{agency.propertyCount || 0}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                      ${agency.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {agency.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune agence trouvée</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}