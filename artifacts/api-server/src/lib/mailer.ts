// Email delivery via the Resend connector (Replit Integrations).
// The connectors SDK handles the Resend API key / auth automatically.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

// Sender address. Resend requires this to be a verified domain (or the
// onboarding@resend.dev sandbox sender, which can only deliver to the
// Resend account owner's own email). Set EMAIL_FROM to a verified address
// (e.g. "I.D.A Immobilier <rdv@votre-domaine.fr>") for real client delivery.
const EMAIL_FROM = process.env.EMAIL_FROM || "I.D.A Immobilier <onboarding@resend.dev>";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ida-immobilier.fr";

const connectors = new ReplitConnectors();

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

// Sends one email through Resend. Returns true on success, false on any failure
// (never throws) so callers can treat email as a best-effort side effect.
async function sendEmail({ to, subject, html, replyTo }: SendEmailArgs): Promise<boolean> {
  try {
    const res = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error({ to, subject, status: res.status, detail }, "Resend email rejected");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send email via Resend");
    return false;
  }
}

export interface PropertyContactEmailData {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  propertyTitle: string;
  propertyId: number;
  propertyCity: string;
  agentName: string;
  agentEmail: string;
  adminEmail: string;
}

function htmlTemplate(data: PropertyContactEmailData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau message — I.D.A Immobilier</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f2044;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:2px;font-family:Georgia,serif;">I.D.A IMMOBILIER</p>
              <p style="margin:6px 0 0;font-size:12px;color:#a8b8d8;letter-spacing:1px;text-transform:uppercase;">Marignane · Provence</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f2044;font-family:Georgia,serif;">Nouveau message reçu</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Un visiteur souhaite vous contacter concernant le bien suivant.</p>

              <!-- Property badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #e0e7ff;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Bien concerné</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#0f2044;font-family:Georgia,serif;">${data.propertyTitle}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Réf. IDA-${data.propertyId} · ${data.propertyCity}</p>
                  </td>
                </tr>
              </table>

              <!-- Sender info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">De</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e;">${data.senderName}</p>
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0;font-size:15px;color:#1a1a2e;"><a href="mailto:${data.senderEmail}" style="color:#c9a84c;text-decoration:none;">${data.senderEmail}</a></p>
                  </td>
                </tr>
                ${data.senderPhone ? `<tr><td colspan="2" style="padding-top:12px;"><p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Téléphone</p><p style="margin:0;font-size:15px;color:#1a1a2e;">${data.senderPhone}</p></td></tr>` : ""}
              </table>

              <!-- Message -->
              <div style="background:#f9fafb;border-left:4px solid #c9a84c;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Message</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${data.message}</p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f2044;border-radius:8px;padding:0;">
                    <a href="mailto:${data.senderEmail}?subject=Re: Bien IDA-${data.propertyId} — ${data.propertyTitle}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Répondre à ${data.senderName.split(" ")[0]}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Ce message a été généré automatiquement par la plateforme I.D.A Immobilier.<br/>© ${new Date().getFullYear()} I.D.A Immobilier — Marignane, Provence</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Appointment update emails ──────────────────────────────────────────────

export type AppointmentEmailKind = "confirmed" | "cancelled" | "rescheduled";

export interface AppointmentEmailData {
  to: string;
  clientName?: string | null;
  kind: AppointmentEmailKind;
  appointmentType: string;
  scheduledAt: Date;
  durationMinutes: number;
  propertyTitle?: string | null;
  propertyAddress?: string | null;
  agentName?: string | null;
  notes?: string | null;
}

const APPT_TYPE_LABEL: Record<string, string> = {
  visit: "Visite",
  meeting: "Rendez-vous",
  phone_call: "Appel téléphonique",
  other: "Rendez-vous",
};

const APPT_KIND: Record<AppointmentEmailKind, { subject: string; heading: string; intro: string; color: string; bg: string }> = {
  confirmed: {
    subject: "Votre rendez-vous est confirmé",
    heading: "Rendez-vous confirmé",
    intro: "Bonne nouvelle ! Votre conseiller a confirmé votre rendez-vous. Voici les détails :",
    color: "#15803d",
    bg: "#dcfce7",
  },
  rescheduled: {
    subject: "Votre rendez-vous a été reprogrammé",
    heading: "Rendez-vous reprogrammé",
    intro: "Votre rendez-vous a été reprogrammé par votre conseiller. Voici les nouveaux détails :",
    color: "#b45309",
    bg: "#fef3c7",
  },
  cancelled: {
    subject: "Votre rendez-vous a été annulé",
    heading: "Rendez-vous annulé",
    intro: "Nous sommes au regret de vous informer que votre rendez-vous a été annulé. N'hésitez pas à nous contacter pour planifier un nouveau créneau.",
    color: "#b91c1c",
    bg: "#fee2e2",
  },
};

function formatApptDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(d);
}

function formatApptTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}

function appointmentTemplate(data: AppointmentEmailData): string {
  const k = APPT_KIND[data.kind];
  const firstName = (data.clientName || "").trim().split(/\s+/)[0] || "Madame, Monsieur";
  const detailRow = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0f5;"><span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">${label}</span></td><td style="padding:8px 0;border-bottom:1px solid #eef0f5;text-align:right;font-size:15px;color:#1a1a2e;font-weight:600;">${value}</td></tr>`;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${k.subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2044;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:2px;font-family:Georgia,serif;">I.D.A IMMOBILIER</p>
          <p style="margin:6px 0 0;font-size:12px;color:#a8b8d8;letter-spacing:1px;text-transform:uppercase;">Marignane · Provence</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:${k.bg};border-radius:8px;padding:12px 18px;text-align:center;">
            <p style="margin:0;font-size:16px;font-weight:700;color:${k.color};font-family:Georgia,serif;">${k.heading}</p>
          </td></tr></table>
          <p style="margin:0 0 8px;font-size:16px;color:#1a1a2e;">Bonjour ${firstName},</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#374151;">${k.intro}</p>
          ${
            data.kind === "cancelled"
              ? ""
              : `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #e0e7ff;border-radius:8px;padding:8px 20px;margin-bottom:24px;">
            ${detailRow("Type", APPT_TYPE_LABEL[data.appointmentType] || "Rendez-vous")}
            ${detailRow("Date", formatApptDate(data.scheduledAt))}
            ${detailRow("Heure", `${formatApptTime(data.scheduledAt)} (${data.durationMinutes} min)`)}
            ${data.propertyTitle ? detailRow("Bien", data.propertyTitle) : ""}
            ${data.propertyAddress ? detailRow("Adresse", data.propertyAddress) : ""}
            ${data.agentName ? detailRow("Conseiller", data.agentName) : ""}
          </table>`
          }
          ${
            data.notes
              ? `<div style="background:#f9fafb;border-left:4px solid #c9a84c;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;"><p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Note de votre conseiller</p><p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${data.notes}</p></div>`
              : ""
          }
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Pour toute question, répondez simplement à cet email ou contactez votre conseiller.</p>
        </td></tr>
        <tr><td style="background:#f8f9ff;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Ce message a été généré automatiquement par la plateforme I.D.A Immobilier.<br/>© ${new Date().getFullYear()} I.D.A Immobilier — Marignane, Provence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAppointmentUpdateEmail(data: AppointmentEmailData): Promise<boolean> {
  const ok = await sendEmail({
    to: data.to,
    subject: `${APPT_KIND[data.kind].subject} — I.D.A Immobilier`,
    html: appointmentTemplate(data),
  });
  if (ok) logger.info({ to: data.to, kind: data.kind }, "Appointment update email sent");
  return ok;
}

// ─── Property alert emails (saved-search matches + favorite updates) ─────────

export type PropertyAlertKind = "new_match" | "price_drop" | "status_change" | "back_on_market";

export interface PropertyAlertEmailData {
  to: string;
  clientName?: string | null;
  kind: PropertyAlertKind;
  propertyTitle: string;
  propertyId: number;
  propertyCity: string;
  price?: number | null;
  oldPrice?: number | null;
  statusLabel?: string | null;
  savedSearchName?: string | null;
}

const ALERT_KIND: Record<PropertyAlertKind, { subject: string; heading: string; intro: string; color: string; bg: string; cta: string }> = {
  new_match: {
    subject: "Un nouveau bien correspond à votre recherche",
    heading: "Nouveau bien disponible",
    intro: "Un bien vient d'être publié et correspond à l'une de vos recherches enregistrées.",
    color: "#15803d",
    bg: "#dcfce7",
    cta: "Découvrir le bien",
  },
  price_drop: {
    subject: "Baisse de prix sur un bien suivi",
    heading: "Baisse de prix",
    intro: "Le prix d'un bien que vous avez ajouté à vos favoris vient de baisser.",
    color: "#b45309",
    bg: "#fef3c7",
    cta: "Voir le nouveau prix",
  },
  back_on_market: {
    subject: "Un bien suivi est de nouveau disponible",
    heading: "De nouveau disponible",
    intro: "Un bien que vous suiviez est de nouveau disponible à la vente ou à la location.",
    color: "#15803d",
    bg: "#dcfce7",
    cta: "Voir le bien",
  },
  status_change: {
    subject: "Mise à jour d'un bien suivi",
    heading: "Statut mis à jour",
    intro: "Le statut d'un bien que vous avez ajouté à vos favoris a changé.",
    color: "#1d4ed8",
    bg: "#dbeafe",
    cta: "Voir le bien",
  },
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function siteDomain(): string {
  return (process.env.SITE_DOMAIN || "https://ida-immobilier.com").replace(/\/$/, "");
}

function propertyAlertTemplate(data: PropertyAlertEmailData): string {
  const k = ALERT_KIND[data.kind];
  const firstName = (data.clientName || "").trim().split(/\s+/)[0] || "Madame, Monsieur";
  const propertyUrl = `${siteDomain()}/annonce/${data.propertyId}`;
  const detailRow = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0f5;"><span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">${label}</span></td><td style="padding:8px 0;border-bottom:1px solid #eef0f5;text-align:right;font-size:15px;color:#1a1a2e;font-weight:600;">${value}</td></tr>`;

  let priceLine = "";
  if (data.kind === "price_drop" && data.oldPrice != null && data.price != null) {
    priceLine = `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0f5;"><span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Prix</span></td><td style="padding:8px 0;border-bottom:1px solid #eef0f5;text-align:right;font-size:15px;color:#1a1a2e;font-weight:600;"><span style="text-decoration:line-through;color:#9ca3af;font-weight:400;">${formatEuro(data.oldPrice)}</span> &nbsp;<span style="color:#b45309;">${formatEuro(data.price)}</span></td></tr>`;
  } else if (data.price != null) {
    priceLine = detailRow("Prix", formatEuro(data.price));
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${k.subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2044;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:2px;font-family:Georgia,serif;">I.D.A IMMOBILIER</p>
          <p style="margin:6px 0 0;font-size:12px;color:#a8b8d8;letter-spacing:1px;text-transform:uppercase;">Marignane · Provence</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:${k.bg};border-radius:8px;padding:12px 18px;text-align:center;">
            <p style="margin:0;font-size:16px;font-weight:700;color:${k.color};font-family:Georgia,serif;">${k.heading}</p>
          </td></tr></table>
          <p style="margin:0 0 8px;font-size:16px;color:#1a1a2e;">Bonjour ${firstName},</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#374151;">${k.intro}${data.savedSearchName ? ` (recherche « ${data.savedSearchName} »)` : ""}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #e0e7ff;border-radius:8px;padding:8px 20px;margin-bottom:24px;">
            ${detailRow("Bien", data.propertyTitle)}
            ${detailRow("Ville", data.propertyCity)}
            ${priceLine}
            ${data.statusLabel ? detailRow("Statut", data.statusLabel) : ""}
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#0f2044;border-radius:8px;padding:0;">
            <a href="${propertyUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${k.cta}</a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">Vous recevez cet email car vous avez enregistré une recherche ou ajouté ce bien à vos favoris sur votre espace client.</p>
        </td></tr>
        <tr><td style="background:#f8f9ff;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Ce message a été généré automatiquement par la plateforme I.D.A Immobilier.<br/>© ${new Date().getFullYear()} I.D.A Immobilier — Marignane, Provence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPropertyAlertEmail(data: PropertyAlertEmailData): Promise<boolean> {
  const ok = await sendEmail({
    to: data.to,
    subject: `${ALERT_KIND[data.kind].subject} — I.D.A Immobilier`,
    html: propertyAlertTemplate(data),
  });
  if (ok) logger.info({ to: data.to, kind: data.kind, propertyId: data.propertyId }, "Property alert email sent");
  return ok;
}

export async function sendPropertyContactEmails(data: PropertyContactEmailData): Promise<boolean> {
  const html = htmlTemplate(data);
  const subjectAgent = `Nouveau message — Réf. IDA-${data.propertyId} — ${data.propertyTitle}`;
  const subjectAdmin = `[Copie admin] ${subjectAgent}`;

  const [agentOk, adminOk] = await Promise.all([
    sendEmail({ to: data.agentEmail, replyTo: data.senderEmail, subject: subjectAgent, html }),
    sendEmail({ to: data.adminEmail, replyTo: data.senderEmail, subject: subjectAdmin, html }),
  ]);

  if (agentOk && adminOk) {
    logger.info({ propertyId: data.propertyId, agentEmail: data.agentEmail }, "Property contact emails sent");
  } else if (agentOk || adminOk) {
    logger.warn({ propertyId: data.propertyId, agentOk, adminOk }, "Property contact emails partially sent");
  }
  return agentOk && adminOk;
}
