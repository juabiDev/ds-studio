import { WhatsAppIcon } from "@/components/features/home/WhatsAppIcon";

// Desktop only: on mobile, WhatsApp lives in MobileActionBar so nothing floats over the booking buttons.
export const WhatsAppButton = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Contactar por WhatsApp"
    className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full items-center justify-center bg-[#25D366] text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200"
  >
    <WhatsAppIcon size={26} />
  </a>
);
