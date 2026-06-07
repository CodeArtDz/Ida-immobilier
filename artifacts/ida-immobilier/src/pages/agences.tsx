import { useListAgencies } from "@workspace/api-client-react";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Agences() {
  const { data: agencies, isLoading } = useListAgencies();

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="font-serif text-4xl font-bold text-primary mb-4 text-center">Nos Agences</h1>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Retrouvez nos experts en immobilier de prestige dans nos agences de Provence.
        </p>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {agencies?.map(agency => (
              <div key={agency.id} className="bg-card border border-border p-8 rounded-xl flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 aspect-[4/3] bg-muted rounded-lg overflow-hidden shrink-0">
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt={agency.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary font-serif text-2xl font-bold">
                      {agency.name}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-primary">{agency.name}</h2>
                  <div className="space-y-2 text-foreground/80">
                    <p className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-accent" /> {agency.address}, {agency.postalCode} {agency.city}</p>
                    <p className="flex items-center"><Phone className="w-5 h-5 mr-3 text-accent" /> {agency.phone}</p>
                    <p className="flex items-center"><Mail className="w-5 h-5 mr-3 text-accent" /> {agency.email}</p>
                  </div>
                  <div className="pt-4 border-t border-border mt-4 flex gap-8 text-sm">
                    <div><span className="font-bold text-primary">{agency.agentCount || 0}</span> agents experts</div>
                    <div><span className="font-bold text-primary">{agency.propertyCount || 0}</span> biens d'exception</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}