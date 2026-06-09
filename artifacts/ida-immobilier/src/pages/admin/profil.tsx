import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2, User, Lock, Camera, Trash2, Shield } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { resolveStorageUrl } from "@/lib/storage-url";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Administrateur",
  admin: "Administrateur",
  agency_manager: "Directeur d'agence",
  agent: "Agent",
  client: "Client",
};

function getAvatarSrc(avatarUrl: string | null | undefined): string | null {
  return resolveStorageUrl(avatarUrl);
}

export default function AdminProfil() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [infoForm, setInfoForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [infoSaving, setInfoSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [pwError, setPwError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const { uploadFile, isUploading } = useUpload({
    onError: () => setAvatarError("Erreur lors de l'envoi de la photo. Réessayez."),
  });

  useEffect(() => {
    if (user) {
      setInfoForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: (user as any).phone ?? "",
      });
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Seules les images sont acceptées (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError("L'image ne doit pas dépasser 4 Mo.");
      return;
    }
    setAvatarError("");
    const result = await uploadFile(file);
    if (!result) return;

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ avatarUrl: result.objectPath }),
    });
    if (res.ok) {
      const updated = await res.json();
      refreshUser(updated);
    } else {
      setAvatarError("Photo envoyée mais non sauvegardée. Réessayez.");
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError("");
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ avatarUrl: null }),
    });
    if (res.ok) {
      const updated = await res.json();
      refreshUser(updated);
    }
  };

  const handleInfoSave = async () => {
    if (!infoForm.firstName || !infoForm.lastName || !infoForm.email) {
      setInfoError("Prénom, nom et email sont requis.");
      return;
    }
    setInfoSaving(true);
    setInfoError("");
    setInfoSuccess(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          firstName: infoForm.firstName,
          lastName: infoForm.lastName,
          email: infoForm.email,
          phone: infoForm.phone || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      refreshUser(updated);
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 4000);
    } catch {
      setInfoError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePwSave = async () => {
    if (!pwForm.password || pwForm.password.length < 8) {
      setPwError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password: pwForm.password }),
      });
      if (!res.ok) throw new Error();
      setPwForm({ password: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 4000);
    } catch {
      setPwError("Erreur lors du changement de mot de passe.");
    } finally {
      setPwSaving(false);
    }
  };

  const avatarSrc = getAvatarSrc((user as any)?.avatarUrl);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et vos préférences de sécurité.</p>
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          Rôle : {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
        </span>
        {(user as any)?.agencyName && (
          <span className="text-sm text-muted-foreground ml-2">— {(user as any).agencyName}</span>
        )}
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg font-semibold">Photo de profil</CardTitle>
          </div>
          <CardDescription>Visible dans le tableau de bord et vos communications clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Photo de profil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center text-primary font-serif font-bold text-2xl">
                  {initials || <User className="w-8 h-8 text-primary/40" />}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Camera className="w-4 h-4 mr-2" />
                {avatarSrc ? "Changer la photo" : "Ajouter une photo"}
              </Button>
              {avatarSrc && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP — 4 Mo max.</p>
              {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg font-semibold">Informations personnelles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
              <Input id="firstName" value={infoForm.firstName} onChange={e => setInfoForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom <span className="text-destructive">*</span></Label>
              <Input id="lastName" value={infoForm.lastName} onChange={e => setInfoForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 00 00 00 00" />
          </div>
          {infoError && <p className="text-sm text-destructive">{infoError}</p>}
          {infoSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Vos informations ont été mises à jour.
            </div>
          )}
          <Button className="bg-primary hover:bg-primary/90" onClick={handleInfoSave} disabled={infoSaving}>
            {infoSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg font-semibold">Sécurité — Changer le mot de passe</CardTitle>
          </div>
          <CardDescription>Choisissez un mot de passe d'au moins 8 caractères.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
          </div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Votre mot de passe a été modifié avec succès.
            </div>
          )}
          <Button className="bg-primary hover:bg-primary/90" onClick={handlePwSave} disabled={pwSaving}>
            {pwSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
