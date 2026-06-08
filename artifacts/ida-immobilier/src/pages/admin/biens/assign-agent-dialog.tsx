import { useState, useEffect } from "react";
import { useAssignProperty, getListPropertiesQueryKey } from "@workspace/api-client-react";
import type { Property, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface AssignAgentDialogProps {
  property: Property | null;
  agents: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrateur",
  agency_manager: "Directeur",
  agent: "Agent",
};

const today = () => new Date().toISOString().slice(0, 10);

export function AssignAgentDialog({ property, agents, open, onOpenChange }: AssignAgentDialogProps) {
  const queryClient = useQueryClient();
  const assignProperty = useAssignProperty();

  const [agentId, setAgentId] = useState<string>("");
  const [mode, setMode] = useState<"permanent" | "temporary">("permanent");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAgentId("");
      setMode("permanent");
      setStartDate(today());
      setEndDate("");
      setReason("");
      setError("");
    }
  }, [open, property]);

  const handleSubmit = async () => {
    if (!property) return;
    if (!agentId) {
      setError("Veuillez sélectionner un agent.");
      return;
    }
    if (mode === "temporary") {
      if (!startDate || !endDate) {
        setError("Veuillez renseigner les dates de début et de fin.");
        return;
      }
      if (endDate < startDate) {
        setError("La date de fin doit être postérieure à la date de début.");
        return;
      }
    }

    setSaving(true);
    setError("");
    const data: any = {
      temporaryAgentId: Number(agentId),
      permanent: mode === "permanent",
    };
    if (mode === "temporary") {
      data.startDate = startDate;
      data.endDate = endDate;
      if (reason) data.reason = reason;
    }

    try {
      await new Promise<void>((resolve, reject) =>
        assignProperty.mutate(
          { id: property.id, data },
          { onSuccess: () => resolve(), onError: reject },
        ),
      );
      queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
      onOpenChange(false);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Changer l'agent responsable</DialogTitle>
          <DialogDescription>
            {property
              ? <>Bien <span className="font-mono">IDA-{property.id}</span> — {property.title}</>
              : "Sélectionnez le nouvel agent responsable de ce bien."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nouvel agent responsable <span className="text-destructive">*</span></Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.firstName} {a.lastName} · {ROLE_LABELS[a.role] ?? a.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Durée de l'assignation</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "permanent" | "temporary")} className="gap-2">
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50">
                <RadioGroupItem value="permanent" id="mode-permanent" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Définitivement</div>
                  <div className="text-xs text-muted-foreground">L'agent devient le responsable permanent du bien.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50">
                <RadioGroupItem value="temporary" id="mode-temporary" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Temporairement</div>
                  <div className="text-xs text-muted-foreground">Le bien revient automatiquement à son propriétaire à la fin de la période.</div>
                </div>
              </label>
            </RadioGroup>
          </div>

          {mode === "temporary" && (
            <div className="space-y-4 rounded-lg bg-muted/40 p-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Date de début <span className="text-destructive">*</span></Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Date de fin <span className="text-destructive">*</span></Label>
                  <Input id="endDate" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. congés, remplacement…" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmer l'assignation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
