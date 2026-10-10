import { BarChart3, CalendarDays, CalendarOff, Clock, HelpCircle, Images, Menu, Scissors, Settings, UserSearch, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One line under the label on the "Más" page */
  description?: string;
}

/** Everyday screens; these fill the bottom tab bar on mobile. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Agenda", icon: CalendarDays },
  { href: "/horarios", label: "Horarios", icon: Clock },
  { href: "/cierres", label: "Cierres", icon: CalendarOff },
  { href: "/clientes", label: "Clientes", icon: UserSearch },
];

/** Occasional screens, listed on the "Más" page. */
export const MORE_NAV: NavItem[] = [
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3, description: "Turnos, faltas e ingresos del último mes" },
  { href: "/servicios", label: "Servicios", icon: Scissors, description: "Nombres, duración y precios" },
  { href: "/barberos", label: "Barberos", icon: Users, description: "Fotos y datos del equipo" },
  { href: "/galeria", label: "Galería", icon: Images, description: "Fotos que se muestran en el sitio" },
  { href: "/preguntas", label: "Preguntas frecuentes", icon: HelpCircle, description: "Preguntas del sitio y si se muestran" },
  { href: "/ajustes", label: "Ajustes", icon: Settings, description: "Contacto, ubicación, redes y horario" },
];

export const MORE_ITEM: NavItem = { href: "/mas", label: "Más", icon: Menu };
