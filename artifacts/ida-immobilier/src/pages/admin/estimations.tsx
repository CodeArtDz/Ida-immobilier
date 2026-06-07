import { useListEstimations } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminEstimations() {
  const { data: estimations, isLoading } = useListEstimations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Demandes d'estimation</h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Bien</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : estimations && estimations.length > 0 ? (
              estimations.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="text-sm">
                    {format(new Date(est.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{est.firstName} {est.lastName}</div>
                    <div className="text-xs text-muted-foreground">{est.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="capitalize font-medium">{est.propertyType}</div>
                    <div className="text-xs text-muted-foreground">{est.livingArea}m² • {est.rooms} pièces</div>
                  </TableCell>
                  <TableCell>
                    {est.postalCode} {est.city}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                      ${est.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        est.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {est.status === 'completed' ? 'Terminée' : 
                       est.status === 'in_progress' ? 'En cours' : 'En attente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {est.status !== 'completed' && (
                        <Button variant="ghost" size="icon" title="Marquer comme terminée" className="text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune demande d'estimation</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}