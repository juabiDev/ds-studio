// Rows created by seed.ts, shared with unseed.ts so it deletes exactly what the seed created.

export const SERVICES = [
  { id: "svc_clasico", name: "Corte Clásico", duration: 45, price: 350 },
  { id: "svc_fade", name: "Fade / Degradé", duration: 50, price: 420 },
  { id: "svc_barba", name: "Barba Completa", duration: 30, price: 280 },
  { id: "svc_combo", name: "Corte + Barba", duration: 70, price: 650 },
  { id: "svc_cejas", name: "Diseño de Cejas", duration: 20, price: 180 },
  { id: "svc_tratamiento", name: "Tratamiento Capilar", duration: 40, price: 380 },
];

// TODO: replace the Unsplash stock photos with real photos of the team
export const EMPLOYEES = [
  { id: "emp_diego", name: "Diego", role: "Cofundador · Director", specialty: "Fade & Diseño", experience: "8 años", photo: "photo-1619950455147-9c450d8f988a" },
  { id: "emp_maiko", name: "Maiko Centena", role: "Barbero Senior", specialty: "Clásico & Barba", experience: "6 años", photo: "photo-1619950466709-02c2bf682442" }
];

// Served from apps/web/public until they're moved to Cloudflare R2; then update image_url in the database
export const GALLERY = [
  { id: "corte1", category: "Cortes", alt: "Corte texturizado con taper en DS STUDIO" },
  { id: "corte2", category: "Cortes", alt: "Mid fade con flequillo hacia adelante" },
  { id: "corte3", category: "Cortes", alt: "Low fade con flequillo recto" },
  { id: "hero", category: "El local", alt: "Sala de espera con el cartel de neón de DS Studio" },
  { id: "local", category: "El local", alt: "Interior de la barbería con lámpara hexagonal" },
  { id: "ubicacion", category: "El local", alt: "Fachada de DS STUDIO desde la calle" },
];
