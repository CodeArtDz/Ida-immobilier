import { useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, MapPin, Clock, User, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminRendezVous() {
  const { data: appointments, isLoading } = useListAppointments();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Rendez-vous</h1>
        <Button className="bg-primary">Nouveau rendez-vous</Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map(apt => (
            <Card key={apt.id} className="overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 uppercase tracking-wider rounded-sm
                          ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {apt.status === 'confirmed' ? 'Confirmé' : 
                           apt.status === 'pending' ? 'En attente' : 
                           apt.status === 'cancelled' ? 'Annulé' : 'Terminé'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 bg-muted uppercase tracking-wider rounded-sm">
                          {apt.type === 'visit' ? 'Visite' : apt.type === 'meeting' ? 'Réunion' : 'Autre'}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold mt-2">
                        {apt.propertyId ? (
                          <Link href={`/annonce/${apt.propertyId}`} className="hover:text-accent flex items-center">
                            {apt.propertyTitle} <LinkIcon className="w-4 h-4 ml-2" />
                          </Link>
                        ) : "Rendez-vous agence"}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {apt.propertyAddress && (
                        <p className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-accent" />
                          {apt.propertyAddress}
                        </p>
                      )}
                      {apt.clientName && (
                        <p className="flex items-center text-muted-foreground text-sm">
                          <User className="w-4 h-4 mr-2 text-accent" />
                          {apt.clientName} {apt.clientPhone && `(${apt.clientPhone})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg flex flex-col justify-center min-w-[200px] border border-border">
                    <div className="flex items-center mb-3">
                      <CalendarIcon className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium capitalize">{format(new Date(apt.scheduledAt), "EEEE d MMMM", { locale: fr })}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium">{format(new Date(apt.scheduledAt), "HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border p-12 text-center rounded-xl">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">Aucun rendez-vous</h3>
          <p className="text-muted-foreground mb-4">L'agenda est vide pour cette période.</p>
        </div>
      )}
    </div>
  );
}