import { useListLeads } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Leads() {
  const { data: leadsResponse, isLoading } = useListLeads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'qualified': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'won': return 'bg-green-100 text-green-700 border-green-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'qualified': return 'Qualifié';
      case 'won': return 'Gagné';
      case 'lost': return 'Perdu';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-primary">Gestion des Leads</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div>Chargement...</div>
        ) : leadsResponse?.data?.map(lead => (
          <Card key={lead.id} className="relative">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold">{lead.firstName} {lead.lastName}</CardTitle>
                <span className={`px-2 py-1 border rounded text-xs font-semibold uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                  {getStatusLabel(lead.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
              </div>
              {lead.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                </div>
              )}
              {lead.propertyTitle && (
                <div className="text-sm mt-4 p-3 bg-muted rounded-md border border-border">
                  <span className="font-semibold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Bien concerné</span>
                  {lead.propertyTitle}
                </div>
              )}
              <div className="flex items-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                <Clock className="w-3 h-3 mr-1" />
                Reçu le {format(new Date(lead.createdAt), "dd/MM/yyyy à HH:mm")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}