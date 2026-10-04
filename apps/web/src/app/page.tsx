import { BookingSection } from "@/components/features/home/BookingSection";
import { Footer } from "@/components/features/home/Footer";
import { GallerySection } from "@/components/features/home/GallerySection";
import { HeroSection } from "@/components/features/home/HeroSection";
import { LocalBusinessJsonLd } from "@/components/features/home/LocalBusinessJsonLd";
import { LocationSection } from "@/components/features/home/LocationSection";
import { MobileActionBar } from "@/components/features/home/MobileActionBar";
import { NavBar } from "@/components/features/home/NavBar";
import { ServicesSection } from "@/components/features/home/ServicesSection";
import { TeamSection } from "@/components/features/home/TeamSection";
import { VideoSection } from "@/components/features/home/VideoSection";
import { WhatsAppButton } from "@/components/features/home/WhatsAppButton";

import { getBarberOptions, getServiceOptions } from "@/lib/data/booking";
import { getBusinessInfo } from "@/lib/data/business";
import { getGalleryPhotos } from "@/lib/data/gallery";

// Services, barbers, gallery and business details change rarely: serve a cached page and refresh
// it every 5 minutes (so edits from the admin show up within that time). Live availability is
// fetched separately by the booking wizard.
export const revalidate = 300;

export default async function Home() {
  const [services, barbers, business, photos] = await Promise.all([
    getServiceOptions(),
    getBarberOptions(),
    getBusinessInfo(),
    getGalleryPhotos(),
  ]);

  return (
    // Bottom padding on mobile so the fixed action bar never covers the footer
    <div className="bg-background text-foreground overflow-x-hidden pb-24 md:pb-0">
      <LocalBusinessJsonLd business={business} />
      <NavBar />
      <HeroSection hours={business.hoursByDay} />
      <ServicesSection services={services} />
      <BookingSection services={services} barbers={barbers} whatsappUrl={business.whatsappUrl} />
      <GallerySection photos={photos} />
      <VideoSection instagram={business.instagram} />
      <TeamSection barbers={barbers} />
      <LocationSection business={business} />
      <Footer instagramUrl={business.instagram?.url ?? null} facebookUrl={business.facebookUrl} />
      <WhatsAppButton url={business.whatsappUrl} />
      <MobileActionBar phoneHref={business.phone.href} whatsappUrl={business.whatsappUrl} />
    </div>
  );
}
