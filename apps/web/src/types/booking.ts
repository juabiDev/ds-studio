// Serializable shapes passed from Server Components to the client booking wizard.

export interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  /** Pre-formatted, e.g. "$350"; null when the price isn't published */
  price: string | null;
}

export interface BarberOption {
  id: string;
  name: string;
  role: string;
  specialty: string | null;
  experience: string | null;
  photoUrl: string | null;
  avatarUrl: string | null;
}

export interface BookingInput {
  serviceId: string;
  /** null = "cualquiera", the server assigns the first free barber */
  employeeId: string | null;
  date: string;
  time: string;
  name: string;
  phone: string;
  /** Receives the booking confirmation and the same-day reminder */
  email: string;
  /** Honeypot field; always empty for real visitors */
  website?: string;
  /** Cloudflare Turnstile token, when the bot check is enabled */
  turnstileToken?: string;
}

export type BookingResult =
  | { ok: true; booking: { serviceName: string; barberName: string; date: string; time: string } }
  | { ok: false; error: string };

export type ConfirmedBooking = Extract<BookingResult, { ok: true }>["booking"];
