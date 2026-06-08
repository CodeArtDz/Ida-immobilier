import { useState } from "react";
import {
  useListAgencies,
  useCreateAgency,
  useUpdateAgency,
  getListAgenciesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Pencil,
  Globe,
  Mail,
  Phone,
  MapPin,
  X,
  Search,
  Power,
} from "lucide-react";

type AgencyFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  website: string;
  logoUrl: string;
  status: "active" | "inactive";
};

const EMPTY_FORM: AgencyFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  website: "",
  logoUrl: "",
  status: "active",
};

type ModalMode = "create" | "edit";

export default function AdminAgences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<AgencyFormData>(EMPTY_FORM);

  const { data: agencies, isLoading } = useListAgencies({
    query: { queryKey: getListAgenciesQueryKey() },
  } as any);

  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListAgenciesQueryKey() });

  const filtered = (agencies as any[] | undefined)?.filter((a: any) =>
    [a.name, a.city, a.email].some((v: string) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  ) ?? [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalMode("create");
    setSelectedId(null);
    setModalOpen(true);
  };

  const openEdit = (agency: any) => {
    setForm({
      name: agency.name || "",
      email: agency.email || "",
      phone: agency.phone || "",
      address: agency.address || "",
      city: agency.city || "",
      postalCode: agency.postalCode || "",
      website: agency.website || "",
      logoUrl: agency.logoUrl || "",
      status: agency.status || "active",
    });
    setSelectedId(agency.id);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleToggleStatus = (agency: any) => {
    const nextStatus = agency.status === "active" ? "inactive" : "active";
    updateAgency.mutate(
      { id: agency.id, data: { status: nextStatus } as any },
      {
        onSuccess: () => {
          invalidate();
          toast({
            title: nextStatus === "active" ? "Agence activée" : "Agence désactivée",
            description: `${agency.name} est maintenant ${nextStatus === "active" ? "active" : "inactive"}.`,
          });
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.postalCode) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      website: form.website || undefined,
      logoUrl: form.logoUrl || undefined,
      status: form.status,
    };

    if (modalMode === "create") {
      createAgency.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            invalidate();
            setModalOpen(false);
            toast({ title: "Agence créée avec succès" });
          },
          onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
        }
      );
    } else if (selectedId !== null) {
      updateAgency.mutate(
        { id: selectedId, data: payload as any },
        {
          onSuccess: () => {
            invalidate();
            setModalOpen(false);
            toast({ title: "Agence mise à jour" });
          },
          onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
        }
      );
    }
  };

  const setField = (key: keyof AgencyFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">
            Gestion des Agences
          </h1>
          <p className="text-muted-foreground mt-1">
            {(agencies as any[])?.length ?? 0} agence{(agencies as any[])?.length !== 1 ? "s" : ""} enregistrée{(agencies as any[])?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle agence
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher par nom, ville, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-serif text-xl font-semibold">Aucune agence trouvée</p>
          <p className="text-muted-foreground mt-1">
            {search ? "Modifiez votre recherche." : "Créez votre première agence."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((agency: any) => (
            <div
              key={agency.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-primary/5 border-b border-border p-5 flex items-center gap-4">
                {agency.logoUrl ? (
                  <img
                    src={agency.logoUrl}
                    alt={agency.name}
                    className="w-14 h-14 rounded-lg object-contain bg-white border border-border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-foreground truncate">{agency.name}</h3>
                  <span
                    className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium mt-1
                    ${agency.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                  >
                    {agency.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {agency.address}, {agency.postalCode} {agency.city}
                  </span>
                </div>
                {agency.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <a href={`mailto:${agency.email}`} className="truncate hover:text-primary transition-colors">
                      {agency.email}
                    </a>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${agency.phone}`} className="hover:text-primary transition-colors">
                      {agency.phone}
                    </a>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-primary transition-colors"
                    >
                      {agency.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => openEdit(agency)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={agency.status === "active"
                    ? "border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    : "border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"}
                  onClick={() => handleToggleStatus(agency)}
                  disabled={updateAgency.isPending}
                >
                  <Power className="w-3.5 h-3.5 mr-1.5" />
                  {agency.status === "active" ? "Désactiver" : "Activer"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-primary">
                {modalMode === "create" ? "Nouvelle agence" : "Modifier l'agence"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom de l'agence *</label>
                <Input
                  required
                  placeholder="I.D.A Immobilier"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="contact@agence.fr"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Téléphone *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="+33 6 00 00 00 00"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Adresse *</label>
                <Input
                  required
                  placeholder="12 avenue du Commandant Rolland"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Code postal *</label>
                  <Input
                    required
                    placeholder="13700"
                    value={form.postalCode}
                    onChange={(e) => setField("postalCode", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ville *</label>
                  <Input
                    required
                    placeholder="Marignane"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Site web</label>
                <Input
                  type="url"
                  placeholder="https://ida-immobilier.fr"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">URL du logo</label>
                <Input
                  type="url"
                  placeholder="https://exemple.fr/logo.png"
                  value={form.logoUrl}
                  onChange={(e) => setField("logoUrl", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Statut</label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
                  disabled={createAgency.isPending || updateAgency.isPending}
                >
                  {modalMode === "create" ? "Créer l'agence" : "Enregistrer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
