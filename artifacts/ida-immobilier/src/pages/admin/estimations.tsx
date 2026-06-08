import { useState, useEffect } from "react";
import {
  useListEstimations,
  useUpdateEstimation,
  getListEstimationsQueryKey,
  type Estimation,
  type EstimationUpdate,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, CheckCircle2, Loader2, Mail, Phone, MapPin, Home, Ruler, BedDouble, Euro } from "lucide-react";
import { format } from "date-fns";

const PROPERTY_TYPES: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  land: "Terrain",
  commercial: "Local commercial",
  other: "Autre",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-red-100 text-red-700" },
  in_progress: { label: "En cours", cls: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Terminée", cls: "bg-green-100 text-green-700" },
};

const STATUSES = ["pending", "in_progress", "completed"];

const formatEuro = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function AdminEstimations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: estimations, isLoading } = useListEstimations();
  const updateEstimation = useUpdateEstimation();

  const [selected, setSelected] = useState<Estimation | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEstimationsQueryKey() });

  useEffect(() => {
    if (selected) {
      setStatus(selected.status);
      setMinPrice(selected.estimatedMinPrice != null ? String(selected.estimatedMinPrice) : "");
      setMaxPrice(selected.estimatedMaxPrice != null ? String(selected.estimatedMaxPrice) : "");
      setNotes(selected.agentNotes ?? "");
    }
  }, [selected]);

  const markCompleted = (est: Estimation) => {
    updateEstimation.mutate(
      { id: est.id, data: { status: "completed" } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Demande marquée comme terminée" });
        },
        onError: () =>
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la demande." }),
      },
    );
  };

  const handleSave = async () => {
    if (!selected) return;
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;
    if ((min != null && Number.isNaN(min)) || (max != null && Number.isNaN(max))) {
      toast({ variant: "destructive", title: "Prix invalide", description: "Veuillez saisir des montants valides." });
      return;
    }
    const data: EstimationUpdate = {
      status: status as EstimationUpdate["status"],
      agentNotes: notes,
      ...(min != null ? { estimatedMinPrice: min } : {}),
      ...(max != null ? { estimatedMaxPrice: max } : {}),
    };
    setSaving(true);
    try {
      await new Promise<void>((resolve, reject) =>
        updateEstimation.mutate(
          { id: selected.id, data },
          { onSuccess: () => resolve(), onError: reject },
        ),
      );
      invalidate();
      toast({ title: "Estimation enregistrée" });
      setSelected(null);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "L'enregistrement a échoué. Réessayez." });
    } finally {
      setSaving(false);
    }
  };

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
              <TableHead>Estimation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : estimations && estimations.length > 0 ? (
              estimations.map((est) => {
                const cfg = STATUS_CONFIG[est.status] ?? STATUS_CONFIG.pending;
                return (
                  <TableRow key={est.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(est.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{est.firstName} {est.lastName}</div>
                      <div className="text-xs text-muted-foreground">{est.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{PROPERTY_TYPES[est.propertyType as string] ?? est.propertyType}</div>
                      <div className="text-xs text-muted-foreground">
                        {est.livingArea ? `${est.livingArea}m²` : "—"}{est.rooms ? ` • ${est.rooms} pièces` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{est.postalCode} {est.city}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {est.estimatedMinPrice != null || est.estimatedMaxPrice != null ? (
                        <span className="font-medium text-accent">
                          {formatEuro(est.estimatedMinPrice)} – {formatEuro(est.estimatedMaxPrice)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Non estimé</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-sm text-xs font-semibold uppercase tracking-wider ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Voir les détails" onClick={() => setSelected(est)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {est.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Marquer comme terminée"
                            className="text-green-600"
                            disabled={updateEstimation.isPending}
                            onClick={() => markCompleted(est)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Aucune demande d'estimation
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-primary">
                  Estimation — {selected.firstName} {selected.lastName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Contact + property details */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm hover:text-accent">
                      <Mail className="w-4 h-4 text-accent" />{selected.email}
                    </a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm hover:text-accent">
                        <Phone className="w-4 h-4 text-accent" />{selected.phone}
                      </a>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-accent mt-0.5" />
                      <span>{selected.address}, {selected.postalCode} {selected.city}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bien</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-accent" />
                      {PROPERTY_TYPES[selected.propertyType as string] ?? selected.propertyType}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="w-4 h-4 text-accent" />
                      {selected.livingArea ? `${selected.livingArea} m²` : "Surface non précisée"}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BedDouble className="w-4 h-4 text-accent" />
                      {selected.rooms ?? "?"} pièces{selected.bedrooms != null ? ` • ${selected.bedrooms} chambres` : ""}
                    </div>
                    {selected.condition && (
                      <p className="text-sm text-muted-foreground">État : {selected.condition}</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                {(selected.hasParking || selected.hasGarden || selected.hasPool) && (
                  <div className="flex flex-wrap gap-2">
                    {selected.hasParking && <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">Parking</span>}
                    {selected.hasGarden && <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">Jardin</span>}
                    {selected.hasPool && <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">Piscine</span>}
                  </div>
                )}

                {selected.additionalInfo && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Informations complémentaires
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/30 border border-border p-3">
                      {selected.additionalInfo}
                    </p>
                  </div>
                )}

                {/* Agent estimation form */}
                <div className="space-y-4 border-t border-border pt-5">
                  <h4 className="font-serif font-bold text-primary flex items-center gap-2">
                    <Euro className="w-4 h-4 text-accent" /> Traitement de la demande
                  </h4>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Statut</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prix min. (€)</Label>
                      <Input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Ex : 250000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prix max. (€)</Label>
                      <Input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Ex : 290000" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Notes internes</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Observations, hypothèses de valorisation…"
                      className="w-full resize-none rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>Fermer</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
