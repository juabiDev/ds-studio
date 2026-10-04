import { MessageCircle, Phone } from "lucide-react";

import type { AppointmentStatus, MessageStatus } from "@ds-studio/database";
import { cn } from "@ds-studio/ui/utils";

import { AppointmentActions } from "@/components/features/agenda/AppointmentActions";
import { UndoStatusButton } from "@/components/features/agenda/UndoStatusButton";

import type { AgendaAppointment } from "@/lib/data/agenda";
import { whatsappLink } from "@/lib/format";

const STATUS_LABEL: Record<AppointmentStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmado", className: "bg-emerald-500/15 text-emerald-300" },
  COMPLETED: { label: "Completado", className: "bg-secondary text-muted-foreground" },
  NO_SHOW: { label: "No vino", className: "bg-amber-500/15 text-amber-300" },
  CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-red-300" },
};

// Delivery state of the WhatsApp confirmation, so staff know whom to call instead
const WHATSAPP_LABEL: Partial<Record<MessageStatus, { label: string; className: string }>> = {
  SENT: { label: "WhatsApp enviado", className: "text-muted-foreground" },
  DELIVERED: { label: "WhatsApp entregado", className: "text-muted-foreground" },
  READ: { label: "WhatsApp leído", className: "text-sky-300" },
  FAILED: { label: "WhatsApp no llegó — llamar", className: "text-red-300" },
};

const contactButtonClass =
  "flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-secondary";

const ConfirmationNote = ({ appointment: a }: { appointment: AgendaAppointment }) => {
  const whatsapp = a.messages[0] ? WHATSAPP_LABEL[a.messages[0].status] : undefined;
  if (a.status !== "CONFIRMED" || (!a.customerConfirmedAt && !whatsapp)) return null;

  return (
    <p className="mt-1 text-xs">
      {a.customerConfirmedAt ? (
        <span className="text-emerald-300">✓ El cliente confirmó asistencia</span>
      ) : (
        whatsapp && <span className={whatsapp.className}>{whatsapp.label}</span>
      )}
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
      <div>
        <p className="text-2xl font-semibold tabular-nums">{a.time}</p>
        <p className="mt-1 font-medium">
          {a.customerName}
          {a.source === "ADMIN" && <span className="ml-2 text-xs text-muted-foreground">(cargado en el local)</span>}
        </p>
        <p className="text-sm text-muted-foreground">
          {a.service.name}
          {showBarber && ` · ${a.employee.name}`} · {a.durationMinutes} min
        </p>
        <ConfirmationNote appointment={a} />
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
