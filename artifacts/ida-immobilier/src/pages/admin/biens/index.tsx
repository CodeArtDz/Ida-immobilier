import { useState } from "react";
import { useListProperties, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import type { Property } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Eye, UserCog } from "lucide-react";
import { Link } from "wouter";
import { AssignAgentDialog } from "./assign-agent-dialog";

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

const STAFF_ROLES = ["superadmin", "admin", "agency_manager", "agent"];

export default function BiensList() {
  const { user } = useAuth();
  // Agents only see (and manage) their own properties — no cross-agent filtering.
  const isAgent = user?.role === "agent";
  // Only admins/superadmins can reassign a property's responsible agent.
  const canAssignAgent = user?.role === "superadmin" || user?.role === "admin";

  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [assignTarget, setAssignTarget] = useState<Property | null>(null);

  const { data: propertiesResponse, isLoading } = useListProperties(
    !isAgent && agentFilter !== "all" ? { agentId: Number(agentFilter) } : undefined,
  );
  const { data: allUsers = [] } = useListUsers(undefined, { query: { queryKey: getListUsersQueryKey(), enabled: !isAgent } });
  const agents = allUsers.filter((u) => STAFF_ROLES.includes(u.role));

  const properties = propertiesResponse?.data ?? [];

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

      {/* Filter by responsible agent — hidden for agents (they only see their own biens) */}
      {!isAgent && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <span className="text-sm text-muted-foreground">Agent responsable :</span>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Tous les agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.firstName} {a.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Référence</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Agent responsable</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Chargement...</TableCell>
              </TableRow>
            ) : properties.length > 0 ? (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-mono text-xs">IDA-{property.id}</TableCell>
                  <TableCell className="font-medium max-w-[260px] truncate">{property.title}</TableCell>
                  <TableCell>{PROPERTY_TYPE_LABEL[property.type] ?? property.type}</TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell>
                    {property.salePrice
                      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.salePrice)
                      : property.rentalPrice
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.rentalPrice) + '/m'
                        : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {property.agentName ?? <span className="text-muted-foreground">—</span>}
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
                      {canAssignAgent && (
                        <Button variant="ghost" size="icon" title="Changer l'agent responsable" onClick={() => setAssignTarget(property)}>
                          <UserCog className="w-4 h-4" />
                        </Button>
                      )}
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun bien trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AssignAgentDialog
        property={assignTarget}
        agents={agents}
        open={!!assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      />
    </div>
  );
}
