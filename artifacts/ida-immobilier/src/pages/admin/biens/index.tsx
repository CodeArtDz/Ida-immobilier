import { useListProperties } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";

const PROPERTY_STATUS_LABEL: Record<string, string> = {
  published: "Publié",
  draft: "Brouillon",
  sold: "Vendu",
  rented: "Loué",
  archived: "Archivé",
  reserved: "Réservé",
  pending: "En attente",
};

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  land: "Terrain",
  commercial: "Local commercial",
  other: "Autre",
};

export default function BiensList() {
  const { data: propertiesResponse, isLoading } = useListProperties();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion des biens</h1>
        <Link href="/tableau-de-bord/biens/nouveau">
          <Button className="bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau bien
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Référence</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : propertiesResponse?.data && propertiesResponse.data.length > 0 ? (
              propertiesResponse.data.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-mono text-xs">IDA-{property.id}</TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">{property.title}</TableCell>
                  <TableCell>{PROPERTY_TYPE_LABEL[property.type] ?? property.type}</TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell>
                    {property.salePrice 
                      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.salePrice)
                      : property.rentalPrice 
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.rentalPrice) + '/m'
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider
                      ${property.status === 'published' ? 'bg-green-100 text-green-700' : 
                        property.status === 'draft' ? 'bg-gray-100 text-gray-700' : 
                        property.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {PROPERTY_STATUS_LABEL[property.status] ?? property.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/annonce/${property.id}`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tableau-de-bord/biens/${property.id}`}><Edit2 className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun bien trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}