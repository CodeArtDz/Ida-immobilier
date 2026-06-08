import { useState } from "react";
import { useRegisterClient } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import logo from "@assets/full_logo_navbar_1780868246991.png";

export default function Inscription() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  
  const registerMutation = useRegisterClient();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: formData }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({
          title: "Compte créé",
          description: "Bienvenue sur votre espace I.D.A Immobilier.",
        });
        setLocation("/espace-client");
      },
      onError: () => {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la création de votre compte.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="flex justify-center mb-8 cursor-pointer p-4">
            <img src={logo} alt="I.D.A Immobilier" className="h-12" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-primary-foreground">
          Créer un compte
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Prénom</label>
                <div className="mt-1">
                  <Input required value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Nom</label>
                <div className="mt-1">
                  <Input required value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Adresse email</label>
              <div className="mt-1">
                <Input type="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Téléphone</label>
              <div className="mt-1">
                <Input type="tel" required value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Mot de passe</label>
              <div className="mt-1">
                <Input type="password" required value={formData.password} onChange={(e) => handleChange('password', e.target.value)} />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Création en cours..." : "S'inscrire"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Déjà inscrit ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/connexion">
                <Button variant="outline" className="w-full border-primary text-primary">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}