import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2, User, Lock } from "lucide-react";

export default function ClientProfil() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();

  const [infoForm, setInfoForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [infoSaving, setInfoSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [pwError, setPwError] = useState("");

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

  const handleInfoSave = async () => {
    if (!infoForm.firstName || !infoForm.lastName || !infoForm.email) {
      setInfoError("Prénom, nom et email sont requis.");
      return;
    }
    setInfoSaving(true);
    setInfoError("");
    setInfoSuccess(false);
    try {
      await new Promise<void>((res, rej) =>
        updateUser.mutate(
          { id: user!.id, data: { firstName: infoForm.firstName, lastName: infoForm.lastName, email: infoForm.email, phone: infoForm.phone || null } as any },
          { onSuccess: () => res(), onError: rej }
        )
      );
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
      await new Promise<void>((res, rej) =>
        updateUser.mutate(
          { id: user!.id, data: { password: pwForm.password } as any },
          { onSuccess: () => res(), onError: rej }
        )
      );
      setPwForm({ password: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 4000);
    } catch {
      setPwError("Erreur lors du changement de mot de passe.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-serif text-3xl font-bold text-primary">Mon Profil</h1>

      {/* Personal info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg font-semibold">Informations personnelles</CardTitle>
          </div>
          <CardDescription>Ces informations sont visibles par les agents I.D.A Immobilier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                value={infoForm.firstName}
                onChange={e => setInfoForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                value={infoForm.lastName}
                onChange={e => setInfoForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              value={infoForm.email}
              onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={infoForm.phone}
              onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="06 00 00 00 00"
            />
          </div>

          {infoError && <p className="text-sm text-destructive">{infoError}</p>}
          {infoSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Vos informations ont été mises à jour.
            </div>
          )}

          <Button className="bg-primary hover:bg-primary/90" onClick={handleInfoSave} disabled={infoSaving}>
            {infoSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Password change */}
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
            <Input
              id="newPassword"
              type="password"
              value={pwForm.password}
              onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Votre mot de passe a été modifié avec succès.
            </div>
          )}

          <Button className="bg-primary hover:bg-primary/90" onClick={handlePwSave} disabled={pwSaving}>
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
