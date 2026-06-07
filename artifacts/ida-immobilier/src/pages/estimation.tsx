import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEstimation } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Estimation() {
  const { toast } = useToast();
  const createEstimation = useCreateEstimation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: "apartment" as any,
    address: "",
    city: "",
    postalCode: "",
    livingArea: "",
    rooms: "",
    condition: "good",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.propertyType || !formData.address || !formData.city || !formData.postalCode)) {
      toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
      return;
    }
    if (step === 2 && (!formData.livingArea || !formData.rooms)) {
      toast({ title: "Erreur", description: "Veuillez préciser la surface et le nombre de pièces.", variant: "destructive" });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({ title: "Erreur", description: "Veuillez remplir vos coordonnées.", variant: "destructive" });
      return;
    }

    createEstimation.mutate({
      data: {
        ...formData,
        livingArea: parseInt(formData.livingArea) || undefined,
        rooms: parseInt(formData.rooms) || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Demande envoyée", description: "Un agent vous contactera très prochainement." });
        setStep(4); // Success step
      }
    });
  };

  return (
    <div className="bg-muted/30 min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-primary mb-4">Estimez votre bien en Provence</h1>
          <p className="text-muted-foreground text-lg">Confiez l'évaluation de votre propriété à nos experts pour une estimation précise, au prix juste du marché.</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-lg p-8 md:p-12 relative overflow-hidden">
          
          {step < 4 && (
            <div className="flex justify-between mb-12 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full"></div>
              <div className={`absolute top-1/2 left-0 h-1 bg-accent -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                  ${step >= i ? 'bg-accent text-accent-foreground shadow-md' : 'bg-card border-2 border-muted text-muted-foreground'}
                `}>
                  {i}
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">L'emplacement</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type de bien *</label>
                <Select value={formData.propertyType} onValueChange={(val) => handleChange('propertyType', val)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="house">Maison</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="land">Terrain</SelectItem>
                    <SelectItem value="commercial">Local commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Adresse *</label>
                <Input className="h-12" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="N°, voie..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Code Postal *</label>
                  <Input className="h-12" value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} placeholder="13700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ville *</label>
                  <Input className="h-12" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Marignane" />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 font-serif h-12 px-8">Continuer</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Les caractéristiques</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Surface habitable (m²) *</label>
                  <Input type="number" className="h-12" value={formData.livingArea} onChange={(e) => handleChange('livingArea', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de pièces *</label>
                  <Input type="number" className="h-12" value={formData.rooms} onChange={(e) => handleChange('rooms', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">État général</label>
                <Select value={formData.condition} onValueChange={(val) => handleChange('condition', val)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent état / Neuf</SelectItem>
                    <SelectItem value="good">Bon état</SelectItem>
                    <SelectItem value="needs_refresh">À rafraîchir</SelectItem>
                    <SelectItem value="needs_renovation">À rénover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-8 border-primary text-primary">Retour</Button>
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 font-serif h-12 px-8">Continuer</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Vos coordonnées</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <Input className="h-12" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <Input className="h-12" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input type="email" className="h-12" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <Input type="tel" className="h-12" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="h-12 px-8 border-primary text-primary">Retour</Button>
                <Button onClick={handleSubmit} disabled={createEstimation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground font-serif h-12 px-8">
                  {createEstimation.isPending ? "Envoi..." : "Demander l'estimation"}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-4">Demande envoyée avec succès</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Merci de votre confiance. L'un de nos conseillers experts vous contactera dans les plus brefs délais pour convenir d'un rendez-vous.
              </p>
              <Button onClick={() => window.location.href = "/"} className="bg-primary hover:bg-primary/90 font-serif h-12 px-8">
                Retour à l'accueil
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}