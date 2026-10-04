import type { ReactNode } from "react";

import { Clock, Facebook, Instagram, Mail, MapPin, Navigation, Phone, type LucideIcon } from "lucide-react";

import type { BusinessInfo } from "@/types/site";

const actionLink =
  "inline-flex items-center gap-2 min-h-11 font-condensed text-white/75 hover:text-white tracking-[0.2em] uppercase text-xs transition-colors";

const ContactItem = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="flex gap-4">
    <Icon size={16} className="text-white/60 mt-0.5 flex-shrink-0" />
    <div>
      <p className="font-condensed text-white/60 text-xs tracking-[0.3em] uppercase mb-1.5">{label}</p>
      {children}
    </div>
  </div>
);

const MapEmbed = ({ src }: { src: string }) => (
  <div className="relative h-72 lg:h-auto min-h-[340px] bg-zinc-900 overflow-hidden">
    <iframe
      src={src}
      loading="lazy"
      className="w-full h-full absolute inset-0 opacity-85 [filter:invert(92%)_hue-rotate(185deg)_brightness(0.65)_contrast(1.15)]"
      title="Ubicación DS STUDIO — Montevideo"
    />
  </div>
);

const SocialLinks = ({ business }: { business: BusinessInfo }) => {
  if (!business.instagram && !business.facebookUrl) return null;

  return (
    <div className="flex gap-6 mt-10 pt-8 border-t border-white/10">
      {business.instagram && (
        <a href={business.instagram.url} target="_blank" rel="noopener noreferrer" className={actionLink}>
          <Instagram size={15} /> Instagram
        </a>
      )}
      {business.facebookUrl && (
        <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer" className={actionLink}>
          <Facebook size={15} /> Facebook
        </a>
      )}
    </div>
  );
};

export const LocationSection = ({ business }: { business: BusinessInfo }) => (
  <section id="contacto" className="bg-background">
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <MapEmbed src={business.mapEmbedUrl} />

      <div className="bg-zinc-950 p-6 py-14 sm:p-10 lg:p-16 flex flex-col justify-center">
        <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">Encontranos</p>
        <h2 className="font-display font-bold text-foreground text-3xl md:text-4xl mb-10">Ubicación & Contacto</h2>

        <div className="flex flex-col gap-8">
          <ContactItem icon={MapPin} label="Dirección">
            <p className="font-body text-foreground">{business.address.street}</p>
            <p className="font-body text-white/65 text-sm">
              {business.address.city}, {business.address.countryName}
            </p>
            <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className={actionLink}>
              <Navigation size={13} /> Cómo llegar
            </a>
          </ContactItem>

          <ContactItem icon={Clock} label="Horarios">
            {business.hours.map((h) => (
              <p key={h.label} className="font-body text-foreground">
                {h.label}
              </p>
            ))}
          </ContactItem>

          <ContactItem icon={Phone} label="Contacto">
            <a href={business.phone.href} className="block min-h-11 py-2.5 font-body text-foreground hover:underline">
              {business.phone.display}
            </a>
            <a href={`mailto:${business.email}`} className="inline-flex items-center gap-2 min-h-11 font-body text-white/70 text-sm hover:text-white">
              <Mail size={13} /> {business.email}
            </a>
          </ContactItem>
        </div>

        <SocialLinks business={business} />
      </div>
    </div>
  </section>
);
