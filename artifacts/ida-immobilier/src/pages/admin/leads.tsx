import { useState } from "react";
import { useListLeads, useUpdateLead, getListLeadsQueryKey } from "@workspace/api-client-react";
import type { Lead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Phone, Clock, Search, FileText, Home, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "Nouveau",   color: "text-blue-700",   bg: "bg-blue-100" },
  contacted: { label: "Contacté",  color: "text-yellow-700", bg: "bg-yellow-100" },
  qualified: { label: "Qualifié",  color: "text-purple-700", bg: "bg-purple-100" },
  won:       { label: "Gagné",     color: "text-green-700",  bg: "bg-green-100" },
  lost:      { label: "Perdu",     color: "text-red-700",    bg: "bg-red-100" },
};

const SOURCE_CONFIG: Record<string, string> = {
  property_inquiry:    "Demande bien",
  estimation_request:  "Estimation",
  contact_form:        "Formulaire",
  manual:              "Manuel",
};

const STATUSES = ["new", "contacted", "qualified", "won", "lost"];

export default function Leads() {
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading } = useListLeads();
  const updateLead = useUpdateLead();

  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });

  const filtered = leads.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
    }
    return true;
  });

  const countBy = (status: string) => leads.filter(l => l.status === status).length;
  const total = leads.length;
  const won = countBy("won");
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    updateLead.mutate({ id: lead.id, data: { status: newStatus as any } }, { onSuccess: invalidate });
  };

  const openNotes = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes((lead as any).notes ?? "");
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    await new Promise<void>((res, rej) =>
      updateLead.mutate({ id: selectedLead.id, data: { notes } as any }, { onSuccess: () => res(), onError: rej })
    );
    invalidate();
    setSavingNotes(false);
    setSelectedLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Header + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion des Leads</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-1.5">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span>Taux de conversion :</span>
          <span className="font-bold text-foreground">{conversionRate}%</span>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          const n = countBy(s);
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === s
                  ? `${cfg.bg} border-current ${cfg.color} shadow-sm`
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <div className={`text-2xl font-bold ${statusFilter === s ? cfg.color : ""}`}>{n}</div>
              <div className={`text-xs font-medium mt-0.5 ${statusFilter === s ? cfg.color : "text-muted-foreground"}`}>
                {cfg.label}{n !== 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sources</SelectItem>
            {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Bien concerné</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Reçu le</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map(lead => {
                const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/30 align-top">
                    <TableCell>
                      <div className="font-medium text-sm">{lead.firstName} {lead.lastName}</div>
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent mt-0.5">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent mt-0.5">
                          <Phone className="w-3 h-3" />{lead.phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {SOURCE_CONFIG[lead.source] ?? lead.source}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {(lead as any).propertyTitle ? (
                        <div className="flex items-start gap-1 text-xs text-accent">
                          <Home className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{(lead as any).propertyTitle}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {lead.message ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">{lead.message}</p>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(lead.createdAt), "dd/MM/yy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={v => handleStatusChange(lead, v)}
                      >
                        <SelectTrigger className={`h-7 text-xs w-32 font-medium border-0 ${cfg.bg} ${cfg.color}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{STATUS_CONFIG[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${(lead as any).notes ? "text-accent" : "text-muted-foreground"}`}
                        title={(lead as any).notes ? "Voir / modifier les notes" : "Ajouter une note"}
                        onClick={() => openNotes(lead)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  {search || statusFilter !== "all" || sourceFilter !== "all"
                    ? "Aucun lead correspond aux filtres sélectionnés"
                    : "Aucun lead enregistré"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} lead{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        {leads.length !== filtered.length ? ` sur ${leads.length}` : ""}
      </p>

      {/* Notes dialog */}
      <Dialog open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Notes — {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Notes internes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={6}
              placeholder="Ajoutez vos observations sur ce lead…"
              className="w-full resize-none rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">Ces notes sont visibles uniquement par l'équipe interne.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)} disabled={savingNotes}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
