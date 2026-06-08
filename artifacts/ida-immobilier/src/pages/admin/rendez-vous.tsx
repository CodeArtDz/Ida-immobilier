import { useState, useMemo } from "react";
import { useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  Link as LinkIcon,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Phone,
  Mail,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

type ViewMode = "list" | "calendar";

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmé",
  pending: "En attente",
  cancelled: "Annulé",
  completed: "Terminé",
};
const TYPE_LABEL: Record<string, string> = {
  visit: "Visite",
  meeting: "Réunion",
  phone_call: "Appel",
  other: "Autre",
};
const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-green-500",
  pending: "bg-yellow-400",
  cancelled: "bg-red-400",
  completed: "bg-gray-400",
};

function googleCalendarLink(apt: any) {
  const start = new Date(apt.scheduledAt);
  const end = new Date(start.getTime() + (apt.durationMinutes || 60) * 60000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: apt.propertyTitle
      ? `Visite - ${apt.propertyTitle}`
      : "Rendez-vous I.D.A Immobilier",
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [
      apt.agentName && `Agent: ${apt.agentName}`,
      apt.clientName && `Client: ${apt.clientName}`,
      apt.notes,
    ]
      .filter(Boolean)
      .join("\n"),
    location: apt.propertyAddress || "",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

function buildICS(appointments: any[]) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const now = fmt(new Date());

  const events = appointments
    .map((apt) => {
      const start = new Date(apt.scheduledAt);
      const end = new Date(
        start.getTime() + (apt.durationMinutes || 60) * 60000,
      );
      return [
        "BEGIN:VEVENT",
        `UID:apt-${apt.id}@ida-immobilier.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${apt.propertyTitle ? `Visite - ${apt.propertyTitle}` : "Rendez-vous I.D.A Immobilier"}`,
        `DESCRIPTION:${[apt.agentName && `Agent\\: ${apt.agentName}`, apt.clientName && `Client\\: ${apt.clientName}`, apt.notes].filter(Boolean).join("\\n")}`,
        apt.propertyAddress ? `LOCATION:${apt.propertyAddress}` : "",
        `STATUS:${apt.status === "confirmed" ? "CONFIRMED" : apt.status === "cancelled" ? "CANCELLED" : "TENTATIVE"}`,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//I.D.A Immobilier//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:I.D.A Immobilier - Rendez-vous",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AppointmentCard({ apt, compact = false }: { apt: any; compact?: boolean }) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-accent">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2 py-0.5 uppercase tracking-wider rounded-full border ${STATUS_STYLE[apt.status] || "bg-gray-100 text-gray-600"}`}
              >
                {STATUS_LABEL[apt.status] || apt.status}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {TYPE_LABEL[apt.type] || apt.type}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold truncate">
                {apt.propertyId ? (
                  <Link
                    href={`/annonce/${apt.propertyId}`}
                    className="hover:text-accent flex items-center gap-1"
                  >
                    {apt.propertyTitle || `Bien #${apt.propertyId}`}
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                ) : (
                  "Rendez-vous agence"
                )}
              </h3>
              {apt.propertyAddress && (
                <p className="flex items-center text-muted-foreground text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-accent shrink-0" />
                  {apt.propertyAddress}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {apt.clientName && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" />
                  {apt.clientName}
                  {apt.clientPhone && (
                    <a
                      href={`tel:${apt.clientPhone}`}
                      className="text-primary hover:text-accent ml-1"
                    >
                      <Phone className="w-3 h-3 inline" /> {apt.clientPhone}
                    </a>
                  )}
                </span>
              )}
              {apt.clientEmail && (
                <a
                  href={`mailto:${apt.clientEmail}`}
                  className="flex items-center gap-1.5 hover:text-accent transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-accent" />
                  {apt.clientEmail}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="bg-muted rounded-lg p-4 min-w-[180px]">
              <div className="flex items-center mb-2">
                <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
                <span className="font-medium text-sm capitalize">
                  {format(new Date(apt.scheduledAt), "EEEE d MMMM", {
                    locale: fr,
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span className="font-medium text-sm">
                  {format(new Date(apt.scheduledAt), "HH:mm")} (
                  {apt.durationMinutes || 60} min)
                </span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <a
                href={googleCalendarLink(apt)}
                target="_blank"
                rel="noopener noreferrer"
                title="Ajouter à Google Agenda"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1 border-primary/30 text-primary"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1 border-primary/30 text-primary"
                title="Ajouter à Apple Calendrier"
                onClick={() =>
                  downloadICS(buildICS([apt]), `rdv-ida-${apt.id}.ics`)
                }
              >
                <Download className="w-3 h-3" />
                Apple
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarView({ appointments }: { appointments: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const allDays = eachDayOfInterval({ start: first, end: last });
    // Monday-first: getDay() returns 0=Sun,1=Mon...; shift so Mon=0
    const startPad = (getDay(first) + 6) % 7;
    const cells: (Date | null)[] = [
      ...Array(startPad).fill(null),
      ...allDays,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentDate]);

  const aptsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    appointments.forEach((apt) => {
      const key = format(new Date(apt.scheduledAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), apt]);
    });
    return map;
  }, [appointments]);

  const selectedApts = selectedDay
    ? (aptsByDay.get(format(selectedDay, "yyyy-MM-dd")) || [])
    : [];

  const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCurrentDate((d) => subMonths(d, 1));
              setSelectedDay(null);
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-serif text-xl font-bold text-primary capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCurrentDate((d) => addMonths(d, 1));
              setSelectedDay(null);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_HEADERS.map((h) => (
            <div
              key={h}
              className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[80px] border-r border-b border-border/40 bg-muted/10"
                />
              );
            }
            const key = format(day, "yyyy-MM-dd");
            const dayApts = aptsByDay.get(key) || [];
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={key}
                onClick={() =>
                  setSelectedDay(
                    isSelected ? null : day,
                  )
                }
                className={`min-h-[80px] border-r border-b border-border/40 p-1.5 cursor-pointer transition-colors
                  ${isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "hover:bg-muted/40"}
                  ${!inMonth ? "opacity-40" : ""}`}
              >
                <div className={`text-sm font-semibold mb-1 w-7 h-7 rounded-full flex items-center justify-center
                  ${today ? "bg-accent text-accent-foreground" : isSelected ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1
                        ${apt.status === "confirmed" ? "bg-green-100 text-green-700" : apt.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[apt.status] || "bg-gray-400"}`} />
                      <span className="truncate">
                        {format(new Date(apt.scheduledAt), "HH:mm")}{" "}
                        {apt.propertyTitle || apt.clientName || "RDV"}
                      </span>
                    </div>
                  ))}
                  {dayApts.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayApts.length - 3} autre{dayApts.length - 3 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day appointments */}
      {selectedDay && (
        <div>
          <h3 className="font-serif text-lg font-bold text-primary mb-3 capitalize">
            {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
            {selectedApts.length === 0 && (
              <span className="font-normal text-muted-foreground ml-2 text-base">
                — Aucun rendez-vous
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {selectedApts.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRendezVous() {
  const [view, setView] = useState<ViewMode>("list");
  const { data: appointments, isLoading } = useListAppointments();

  const apts = appointments || [];

  const handleExportAll = () => {
    if (!apts.length) return;
    downloadICS(buildICS(apts), "rendez-vous-ida-immobilier.ics");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-serif text-3xl font-bold text-primary">
          Rendez-vous
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* iCal export */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/40 text-primary"
            onClick={handleExportAll}
            disabled={!apts.length}
          >
            <Download className="w-4 h-4" />
            Exporter iCal
          </Button>

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendrier
            </button>
          </div>

          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <CalendarIcon className="w-4 h-4" />
            Nouveau
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : apts.length === 0 ? (
        <div className="bg-card border border-border p-16 text-center rounded-xl">
          <CalendarDays className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">
            Aucun rendez-vous
          </h3>
          <p className="text-muted-foreground">
            L'agenda est vide pour le moment.
          </p>
        </div>
      ) : view === "list" ? (
        <div className="space-y-4">
          {apts.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} />
          ))}
        </div>
      ) : (
        <CalendarView appointments={apts} />
      )}
    </div>
  );
}
