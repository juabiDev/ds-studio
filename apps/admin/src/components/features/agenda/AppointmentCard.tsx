import { Mail, MessageCircle, Phone } from "lucide-react";

import type { MessageStatus } from "@ds-studio/database";
import { cn } from "@ds-studio/ui/utils";

import { AppointmentActions } from "@/components/features/agenda/AppointmentActions";
import { UndoStatusButton } from "@/components/features/agenda/UndoStatusButton";

import {
  AGENDA_MESSAGE_KINDS,
  latestMessageStatus,
  type AgendaAppointment,
  type AgendaMessageKind,
} from "@/lib/data/agenda";
import { STATUS_LABEL, whatsappLink } from "@/lib/format";

type Note = { label: string; className: string };

const MUTED_TEXT = "text-muted-foreground";
const ALERT_TEXT = "text-red-300";

const WHATSAPP_LABEL: Partial<Record<MessageStatus, Note>> = {
  SENT: { label: "WhatsApp enviado", className: MUTED_TEXT },
  DELIVERED: { label: "WhatsApp entregado", className: MUTED_TEXT },
  READ: { label: "WhatsApp leído", className: "text-sky-300" },
  FAILED: { label: "WhatsApp no llegó — llamar", className: ALERT_TEXT },
};

// Resend only reports whether it accepted the email, so there is no "delivered"/"read" like WhatsApp
const EMAIL_LABEL: Record<"confirmation" | "reminder" | "cancellation", Partial<Record<MessageStatus, Note>>> = {
  confirmation: {
    SENT: { label: "Email enviado", className: MUTED_TEXT },
    FAILED: { label: "Email no llegó", className: ALERT_TEXT },
  },
  reminder: {
    SENT: { label: "Recordatorio enviado", className: MUTED_TEXT },
    FAILED: { label: "Recordatorio no llegó", className: ALERT_TEXT },
  },
  cancellation: {
    SENT: { label: "Aviso de cancelación enviado por email", className: MUTED_TEXT },
    FAILED: { label: "No se pudo avisar por email — llamar", className: ALERT_TEXT },
  },
};

const emailNote = (a: AgendaAppointment, label: keyof typeof EMAIL_LABEL, kind: AgendaMessageKind) => {
  const status = latestMessageStatus(a, kind);
  return status ? EMAIL_LABEL[label][status] : undefined;
};

const isNote = (n: Note | undefined): n is Note => !!n;

const contactButtonClass =
  "flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-secondary";

const deliveryNotes = (a: AgendaAppointment): Note[] => {
  if (a.status === "CANCELLED") {
    return a.cancelledBy === "STAFF"
      ? [emailNote(a, "cancellation", AGENDA_MESSAGE_KINDS.staffCancellation)].filter(isNote)
      : [];
  }
  if (a.status !== "CONFIRMED") return [];

  const whatsappStatus = latestMessageStatus(a, AGENDA_MESSAGE_KINDS.whatsappConfirmation);
  const whatsapp: Note | undefined = a.customerConfirmedAt
    ? { label: "✓ El cliente confirmó asistencia", className: "text-emerald-300" }
    : whatsappStatus && WHATSAPP_LABEL[whatsappStatus];

  return [
    whatsapp,
    emailNote(a, "confirmation", AGENDA_MESSAGE_KINDS.bookingConfirmation),
    emailNote(a, "reminder", AGENDA_MESSAGE_KINDS.reminder),
  ].filter(isNote);
};

/** WhatsApp and email delivery, so staff know whom to call instead. */
const DeliveryNotes = ({ appointment }: { appointment: AgendaAppointment }) => {
  const notes = deliveryNotes(appointment);
  if (notes.length === 0) return null;

  return (
    <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
      {notes.map((n, i) => (
        <span key={n.label} className={n.className}>
          {i > 0 && <span className={cn("mr-2", MUTED_TEXT)}>·</span>}
          {n.label}
        </span>
      ))}
    </p>
  );
};

const StatusBadge = ({ appointment: a }: { appointment: AgendaAppointment }) => {
  const status = STATUS_LABEL[a.status];
  return (
    <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs", status.className)}>
      {a.status === "CANCELLED" && a.cancelledBy === "CUSTOMER" ? "Canceló el cliente" : status.label}
    </span>
  );
};

const ContactButtons = ({ phone }: { phone: string }) => (
  <div className="mt-4 grid grid-cols-2 gap-2">
    <a href={`tel:${phone}`} className={contactButtonClass}>
      <Phone size={15} /> Llamar
    </a>
    <a href={whatsappLink(phone)} target="_blank" rel="noopener noreferrer" className={contactButtonClass}>
      <MessageCircle size={15} /> WhatsApp
    </a>
  </div>
);

interface AppointmentCardProps {
  appointment: AgendaAppointment;
  /** Hidden inside a per-barber column, where the header already names the barber */
  showBarber?: boolean;
}

// Server component: only the status buttons below are client islands
export const AppointmentCard = ({ appointment: a, showBarber = true }: AppointmentCardProps) => (
  <li className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums">{a.time}</p>
        <p className="mt-1 font-medium">
          {a.customerName}
          {a.source === "ADMIN" && <span className="ml-2 text-xs text-muted-foreground">(cargado en el local)</span>}
        </p>
        <p className="text-sm text-muted-foreground">
          {a.service.name}
          {showBarber && ` · ${a.employee.name}`} · {a.durationMinutes} min
        </p>
        {a.customerEmail && (
          <a
            href={`mailto:${a.customerEmail}`}
            className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Mail size={13} className="shrink-0" />
            <span className="min-w-0 truncate">{a.customerEmail}</span>
          </a>
        )}
        <DeliveryNotes appointment={a} />
      </div>
      <StatusBadge appointment={a} />
    </div>

    {a.customerPhone && <ContactButtons phone={a.customerPhone} />}

    {a.status === "CONFIRMED" && (
      <div className="mt-2">
        <AppointmentActions appointmentId={a.id} />
      </div>
    )}
    {(a.status === "COMPLETED" || a.status === "NO_SHOW") && (
      <div className="mt-2">
        <UndoStatusButton appointmentId={a.id} />
      </div>
    )}
  </li>
);
