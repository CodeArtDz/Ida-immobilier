import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import heroBg from "@/assets/images/hero-bg.png";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message envoyé",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais."
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-16">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Contact I.D.A Immobilier" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/60"></div>
        </div>
        <div className="relative z-10 text-center text-primary-foreground">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Nos équipes sont à votre disposition pour vous accompagner dans vos projets immobiliers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">I.D.A Immobilier</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-accent mr-4 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Siège social</h3>
                    <p className="text-muted-foreground">16 av de la 1ère armée française<br/>13700 Marignane<br/>France</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-accent mr-4 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Téléphone</h3>
                    <p className="text-muted-foreground">+33 6 66 37 17 37</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-accent mr-4 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">contact@ida-immobilier.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-accent mr-4 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Horaires d'ouverture</h3>
                    <p className="text-muted-foreground">Du Lundi au Vendredi<br/>9h00 - 12h30 | 14h00 - 18h30<br/>Samedi sur rendez-vous</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom *</label>
                    <Input required value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom *</label>
                    <Input required value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input type="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <Input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sujet *</label>
                  <Input required value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <Textarea 
                    required 
                    rows={6}
                    value={formData.message} 
                    onChange={(e) => handleChange('message', e.target.value)} 
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-serif px-8 py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}