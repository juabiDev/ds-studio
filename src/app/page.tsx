"use client";

import { useState, useEffect } from "react";
import {
  Menu, X, ChevronRight, Check, MapPin, Phone, Clock,
  Instagram, Facebook, Play, Scissors,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: "clasico", name: "Corte Clásico", duration: "45 min", price: "$350" },
  { id: "fade", name: "Fade / Degradé", duration: "50 min", price: "$420" },
  { id: "barba", name: "Barba Completa", duration: "30 min", price: "$280" },
  { id: "combo", name: "Corte + Barba", duration: "70 min", price: "$650" },
  { id: "cejas", name: "Diseño de Cejas", duration: "20 min", price: "$180" },
  { id: "tratamiento", name: "Tratamiento Capilar", duration: "40 min", price: "$380" },
];

const GALLERY_ITEMS = [
  { id: 1, photo: "photo-1503951914875-452162b0f3f1", cat: "clasico", alt: "Corte clásico en silla de barbería" },
  { id: 2, photo: "photo-1647140655214-e4a2d914971f", cat: "clasico", alt: "Barbero cortando con tijeras" },
  { id: 3, photo: "photo-1635273051937-a0ddef9573b6", cat: "fade", alt: "Fade terminado" },
  { id: 4, photo: "photo-1593702275687-f8b402bf1fb5", cat: "fade", alt: "Barbero cortando cabello" },
  { id: 5, photo: "photo-1635273051839-003bf06a8751", cat: "barba", alt: "Detalle de corte" },
  { id: 6, photo: "photo-1657105052497-f996284ffff8", cat: "barba", alt: "Barba con máquina" },
  { id: 7, photo: "photo-1599351431202-1e0f0137899a", cat: "degrade", alt: "Estilo degradé" },
  { id: 8, photo: "photo-1605497788044-5a32c7078486", cat: "degrade", alt: "Corte moderno" },
];

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "clasico", label: "Clásico" },
  { id: "fade", label: "Fade" },
  { id: "barba", label: "Barba" },
  { id: "degrade", label: "Degradé" },
];

const TEAM = [
  { name: "Diego S.", role: "Fundador · Director", specialty: "Fade & Diseño", exp: "8 años", photo: "photo-1619950455147-9c450d8f988a" },
  { name: "Sebastián M.", role: "Barbero Senior", specialty: "Clásico & Barba", exp: "6 años", photo: "photo-1619950466709-02c2bf682442" },
  { name: "Rodrigo T.", role: "Barbero", specialty: "Degradé & Textura", exp: "4 años", photo: "photo-1619950463968-f2bfb9341d00" },
  { name: "Nicolás F.", role: "Barbero", specialty: "Corte Moderno", exp: "3 años", photo: "photo-1578176603894-57973e38890f" },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
  "18:30", "19:00", "19:30",
];

const UNAVAILABLE_SLOTS = ["09:30", "11:00", "14:00", "16:30", "18:00"];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ── NavBar ────────────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Inicio", href: "#inicio" },
    { label: "Servicios", href: "#servicios" },
    { label: "Galería", href: "#galeria" },
    { label: "Equipo", href: "#equipo" },
    { label: "Contacto", href: "#contacto" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/92 backdrop-blur-md border-b border-white/8"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-3 group">
          <div className="w-8 h-8 border border-white/50 flex items-center justify-center group-hover:border-white transition-colors">
            <span className="font-condensed font-bold tracking-widest text-white text-xs">DS</span>
          </div>
          <span className="font-display text-white text-lg tracking-[0.22em] uppercase font-bold">
            DS STUDIO
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-condensed text-white/60 hover:text-white text-xs tracking-[0.3em] uppercase transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="#agendar"
            className="hidden md:inline-flex items-center gap-2 border border-white/70 text-white font-condensed tracking-[0.25em] uppercase text-xs px-6 py-2.5 hover:bg-white hover:text-black transition-all duration-200"
          >
            Agendar
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white p-1"
            aria-label="Menú"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-black/97 backdrop-blur-xl border-t border-white/8 px-6 py-6 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-condensed text-white/70 hover:text-white tracking-[0.3em] uppercase text-sm py-3 border-b border-white/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#agendar"
            onClick={() => setOpen(false)}
            className="mt-4 border border-white/70 text-white font-condensed tracking-[0.25em] uppercase text-xs px-6 py-4 text-center hover:bg-white hover:text-black transition-all"
          >
            Agendar turno
          </a>
        </div>
      )}
    </nav>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-end pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-zinc-900">
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&h=1080&fit=crop&auto=format"
          alt="Barbero trabajando en DS STUDIO Montevideo"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Decorative vertical rule */}
      <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-white/10 hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        {/* Eyebrow */}
        <div className="flex items-center gap-4 mb-7">
          <div className="w-8 h-px bg-white/40" />
          <p className="font-condensed text-white/50 tracking-[0.45em] uppercase text-xs">
            Montevideo · Uruguay · Est. 2018
          </p>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-white leading-[0.92] mb-8" style={{ fontSize: "clamp(3.2rem, 10vw, 9rem)" }}>
          El Arte del
          <br />
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.75)" }}
          >
            Corte Perfecto
          </span>
        </h1>

        {/* Sub */}
        <p className="font-body text-white/55 text-base md:text-lg mb-10 max-w-sm leading-relaxed">
          Barbería urbana de precisión. Donde el estilo clásico se encuentra con la cultura contemporánea.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#agendar"
            className="inline-flex items-center justify-center gap-3 bg-white text-black font-condensed tracking-[0.25em] uppercase text-sm px-9 py-4 hover:bg-white/90 transition-all group"
          >
            Agendar tu turno
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center justify-center gap-3 border border-white/35 text-white/75 font-condensed tracking-[0.25em] uppercase text-sm px-9 py-4 hover:border-white/70 hover:text-white transition-all"
          >
            Ver servicios
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-10 mt-16 pt-7 border-t border-white/10">
          {[
            ["500+", "Clientes activos"],
            ["6", "Años de trayectoria"],
            ["4", "Barberos expertos"],
          ].map(([num, label]) => (
            <div key={label} className="flex flex-col">
              <span className="font-display text-white font-bold text-2xl">{num}</span>
              <span className="font-condensed text-white/35 text-xs tracking-[0.3em] uppercase mt-0.5">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GallerySection ─────────────────────────────────────────────────────────────

function GallerySection() {
  const [filter, setFilter] = useState("all");

  const visible =
    filter === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((i) => i.cat === filter);

  return (
    <section id="galeria" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">
            Nuestro trabajo
          </p>
          <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Galería
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`font-condensed tracking-[0.3em] uppercase text-xs px-5 py-2.5 border transition-all duration-200 ${
                filter === f.id
                  ? "bg-white text-black border-white"
                  : "border-white/18 text-white/55 hover:border-white/45 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {visible.map((item, i) => {
            const isWide = i === 0 || i === 5;
            return (
              <div
                key={item.id}
                className={`relative overflow-hidden bg-zinc-900 group cursor-pointer ${
                  isWide ? "md:col-span-2" : ""
                }`}
                style={{ aspectRatio: isWide ? "16/9" : "3/4" }}
              >
                <img
                  src={`https://images.unsplash.com/${item.photo}?w=800&h=1000&fit=crop&auto=format`}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="font-condensed text-white text-xs tracking-[0.3em] uppercase border border-white/60 px-3 py-1.5">
                    {FILTERS.find((f) => f.id === item.cat)?.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── VideoSection ──────────────────────────────────────────────────────────────

function VideoSection() {
  const [played, setPlayed] = useState(false);

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="relative overflow-hidden bg-zinc-900" style={{ maxHeight: "82vh" }}>
        <img
          src="https://images.unsplash.com/photo-1781455793310-8427c96454c7?w=1920&h=1080&fit=crop&auto=format"
          alt="Interior de DS STUDIO"
          className="w-full h-full object-cover"
          style={{ aspectRatio: "16/9", width: "100%", display: "block" }}
        />
        <div className="absolute inset-0 bg-black/65" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-center">
          <p className="font-condensed text-white/45 tracking-[0.45em] uppercase text-xs">
            La experiencia DS STUDIO
          </p>
          <h2
            className="font-display font-bold text-white max-w-xl"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1.05 }}
          >
            Más que un corte.
            <br />
            Una experiencia.
          </h2>

          {!played ? (
            <button
              onClick={() => setPlayed(true)}
              className="w-[72px] h-[72px] border-2 border-white/55 rounded-full flex items-center justify-center hover:border-white hover:bg-white/10 transition-all duration-300 group mt-2"
              aria-label="Reproducir video"
            >
              <Play size={26} fill="white" className="text-white ml-1" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="border border-white/30 px-8 py-5 text-center">
                <p className="font-display text-white text-lg font-bold mb-1">
                  Seguinos en Instagram
                </p>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed text-white/50 tracking-widest text-xs uppercase hover:text-white transition-colors"
                >
                  @dsstudio.mvd
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── ServicesSection ───────────────────────────────────────────────────────────

function ServicesSection() {
  return (
    <section id="servicios" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-14">
          <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">
            Lo que hacemos
          </p>
          <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Servicios & Precios
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((s, i) => (
            <div
              key={s.id}
              className="border border-white/8 bg-card p-8 hover:border-white/25 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <Scissors
                  size={18}
                  className="text-white/25 group-hover:text-white/50 transition-colors mt-0.5"
                />
                <span className="font-display font-bold text-white/12 group-hover:text-white/25 text-3xl transition-colors leading-none">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display font-bold text-foreground text-xl mb-2">{s.name}</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-condensed tracking-wider mb-7">
                <Clock size={11} />
                <span>{s.duration}</span>
              </div>
              <div className="flex items-end justify-between border-t border-white/8 pt-5">
                <span className="font-display font-bold text-white text-2xl">{s.price}</span>
                <a
                  href="#agendar"
                  className="font-condensed text-xs tracking-[0.3em] uppercase text-white/35 group-hover:text-white/65 hover:text-white transition-colors"
                >
                  Agendar →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BookingSection ─────────────────────────────────────────────────────────────

function BookingSection() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  function reset() {
    setConfirmed(false);
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setName("");
    setPhone("");
  }

  const stepLabels = ["Servicio", "Horario", "Confirmar"];

  return (
    <section id="agendar" className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-14">
          <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">
            En menos de 1 minuto
          </p>
          <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Reservá tu turno
          </h2>
        </div>

        {!confirmed ? (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-14">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center border font-condensed text-xs tracking-wider transition-all duration-300 ${
                        step > s
                          ? "bg-white border-white text-black"
                          : step === s
                          ? "border-white text-white"
                          : "border-white/18 text-white/28"
                      }`}
                    >
                      {step > s ? <Check size={12} /> : s}
                    </div>
                    <span
                      className={`font-condensed text-xs tracking-[0.28em] uppercase ml-2.5 mr-4 transition-colors ${
                        step >= s ? "text-white" : "text-white/25"
                      }`}
                    >
                      {label}
                    </span>
                    {i < 2 && (
                      <div
                        className={`h-px flex-1 min-w-[32px] mr-4 transition-colors ${
                          step > s + 1 ? "bg-white" : "bg-white/12"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Step 1: Service ── */}
            {step === 1 && (
              <div>
                <p className="font-condensed text-white/40 text-xs tracking-[0.35em] uppercase mb-5">
                  Elegí un servicio
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s.id)}
                      className={`text-left p-5 border transition-all duration-200 ${
                        selectedService === s.id
                          ? "border-white bg-white/5"
                          : "border-white/12 hover:border-white/38"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display font-bold text-white text-base">{s.name}</p>
                          <p className="font-condensed text-white/38 text-xs tracking-wider mt-1">
                            {s.duration}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="font-display text-white font-bold text-base">{s.price}</span>
                          {selectedService === s.id && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="mt-8 inline-flex items-center gap-2 bg-white text-black font-condensed tracking-[0.25em] uppercase text-xs px-10 py-4 disabled:opacity-30 hover:bg-white/90 transition-all"
                >
                  Continuar <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* ── Step 2: Barber + Date + Time ── */}
            {step === 2 && (
              <div>
                {/* Barber */}
                <p className="font-condensed text-white/40 text-xs tracking-[0.35em] uppercase mb-4">
                  Elegí tu barbero
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                  {TEAM.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => setSelectedBarber(b.name)}
                      className={`p-4 border text-center transition-all duration-200 ${
                        selectedBarber === b.name
                          ? "border-white bg-white/5"
                          : "border-white/12 hover:border-white/38"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2.5 bg-zinc-800">
                        <img
                          src={`https://images.unsplash.com/${b.photo}?w=96&h=96&fit=crop&auto=format`}
                          alt={b.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-condensed text-white text-xs tracking-wider">
                        {b.name.split(" ")[0]}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Date */}
                <p className="font-condensed text-white/40 text-xs tracking-[0.35em] uppercase mb-4">
                  Elegí la fecha
                </p>
                <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
                  {dates.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(i); setSelectedSlot(null); }}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-3.5 border transition-all duration-200 min-w-[64px] ${
                        selectedDate === i
                          ? "border-white bg-white/5"
                          : "border-white/12 hover:border-white/38"
                      }`}
                    >
                      <span className="font-condensed text-white/38 text-xs tracking-wider uppercase">
                        {DAY_NAMES[d.getDay()]}
                      </span>
                      <span className="font-display text-white text-xl font-bold my-0.5">
                        {d.getDate()}
                      </span>
                      <span className="font-condensed text-white/38 text-xs tracking-wider uppercase">
                        {MONTH_NAMES[d.getMonth()]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                {selectedDate !== null && (
                  <>
                    <p className="font-condensed text-white/40 text-xs tracking-[0.35em] uppercase mb-4">
                      Elegí el horario
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-10">
                      {TIME_SLOTS.map((t) => {
                        const unavail = UNAVAILABLE_SLOTS.includes(t);
                        return (
                          <button
                            key={t}
                            disabled={unavail}
                            onClick={() => setSelectedSlot(t)}
                            className={`py-2.5 font-condensed text-xs tracking-wider border transition-all duration-200 ${
                              unavail
                                ? "border-white/5 text-white/12 cursor-not-allowed"
                                : selectedSlot === t
                                ? "border-white bg-white/5 text-white"
                                : "border-white/12 text-white/55 hover:border-white/38 hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-white/18 text-white/55 font-condensed tracking-[0.25em] uppercase text-xs px-6 py-4 hover:border-white/45 hover:text-white transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={!selectedBarber || selectedDate === null || !selectedSlot}
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 bg-white text-black font-condensed tracking-[0.25em] uppercase text-xs px-10 py-4 disabled:opacity-30 hover:bg-white/90 transition-all"
                  >
                    Continuar <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 3 && (
              <div>
                {/* Summary */}
                <div className="border border-white/12 p-6 mb-8">
                  <p className="font-condensed text-white/35 text-xs tracking-[0.35em] uppercase mb-5">
                    Resumen de tu reserva
                  </p>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      ["Servicio", SERVICES.find((s) => s.id === selectedService)?.name ?? ""],
                      ["Barbero", selectedBarber ?? ""],
                      [
                        "Fecha",
                        selectedDate !== null
                          ? `${dates[selectedDate].getDate()} ${MONTH_NAMES[dates[selectedDate].getMonth()]}`
                          : "",
                      ],
                      ["Horario", `${selectedSlot} hs`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-condensed text-white/35 text-xs tracking-wider uppercase mb-1">
                          {label}
                        </p>
                        <p className="font-display text-white font-bold text-base">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal info */}
                <p className="font-condensed text-white/40 text-xs tracking-[0.35em] uppercase mb-4">
                  Tus datos
                </p>
                <div className="flex flex-col gap-3 mb-8">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-card border border-white/12 text-white placeholder:text-white/25 px-5 py-4 font-condensed text-sm tracking-wider focus:border-white/45 focus:outline-none transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (+598...)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-card border border-white/12 text-white placeholder:text-white/25 px-5 py-4 font-condensed text-sm tracking-wider focus:border-white/45 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="border border-white/18 text-white/55 font-condensed tracking-[0.25em] uppercase text-xs px-6 py-4 hover:border-white/45 hover:text-white transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={!name || !phone}
                    onClick={() => setConfirmed(true)}
                    className="inline-flex items-center gap-2 bg-white text-black font-condensed tracking-[0.25em] uppercase text-xs px-10 py-4 disabled:opacity-30 hover:bg-white/90 transition-all"
                  >
                    Confirmar reserva <Check size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Confirmation screen ── */
          <div className="text-center py-20 border border-white/12">
            <div className="w-16 h-16 border-2 border-white/50 rounded-full flex items-center justify-center mx-auto mb-7">
              <Check size={26} className="text-white" />
            </div>
            <h3 className="font-display text-3xl font-bold text-white mb-3">
              ¡Turno confirmado!
            </h3>
            <p className="font-condensed text-white/45 tracking-wider text-xs uppercase mb-1">
              {SERVICES.find((s) => s.id === selectedService)?.name} con {selectedBarber}
            </p>
            <p className="font-display text-xl text-white/70 mt-2">
              {selectedDate !== null
                ? `${dates[selectedDate].getDate()} ${MONTH_NAMES[dates[selectedDate].getMonth()]}`
                : ""}{" "}
              a las {selectedSlot} hs
            </p>
            <p className="font-condensed text-white/30 text-xs tracking-widest mt-4">
              Te contactaremos al {phone} para confirmar
            </p>
            <button
              onClick={reset}
              className="mt-8 border border-white/22 text-white/50 font-condensed tracking-[0.28em] uppercase text-xs px-8 py-3 hover:border-white/55 hover:text-white transition-all"
            >
              Nueva reserva
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── TeamSection ───────────────────────────────────────────────────────────────

function TeamSection() {
  return (
    <section id="equipo" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-14">
          <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">
            Conocé al equipo
          </p>
          <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Nuestros barberos
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((member) => (
            <div key={member.name} className="group">
              {/* Photo */}
              <div className="relative overflow-hidden bg-zinc-800 mb-5" style={{ aspectRatio: "3/4" }}>
                <img
                  src={`https://images.unsplash.com/${member.photo}?w=600&h=800&fit=crop&auto=format`}
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute bottom-4 left-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="font-condensed text-white/70 text-xs tracking-[0.25em] uppercase">
                    {member.specialty}
                  </p>
                </div>
              </div>
              {/* Info */}
              <h3 className="font-display font-bold text-foreground text-base">{member.name}</h3>
              <p className="font-condensed text-muted-foreground text-xs tracking-[0.28em] uppercase mt-1">
                {member.role}
              </p>
              <p className="font-condensed text-white/25 text-xs mt-1">
                {member.exp} de experiencia
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LocationSection ───────────────────────────────────────────────────────────

function LocationSection() {
  return (
    <section id="contacto" className="bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Map */}
        <div className="relative h-72 lg:h-auto bg-zinc-900 overflow-hidden" style={{ minHeight: "340px" }}>
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-56.195%2C-34.916%2C-56.162%2C-34.898&layer=mapnik&marker=-34.906%2C-56.178"
            className="w-full h-full absolute inset-0"
            style={{ filter: "invert(92%) hue-rotate(185deg) brightness(0.65) contrast(1.15)", opacity: 0.85 }}
            title="Ubicación DS STUDIO — Montevideo"
          />
        </div>

        {/* Info */}
        <div className="bg-zinc-950 p-10 lg:p-16 flex flex-col justify-center">
          <p className="font-condensed text-accent text-xs tracking-[0.45em] uppercase mb-3">
            Encontranos
          </p>
          <h2 className="font-display font-bold text-foreground text-3xl md:text-4xl mb-10">
            Ubicación & Contacto
          </h2>

          <div className="flex flex-col gap-8">
            <div className="flex gap-4">
              <MapPin size={15} className="text-white/35 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-condensed text-white/35 text-xs tracking-[0.3em] uppercase mb-1.5">
                  Dirección
                </p>
                <p className="font-body text-foreground">Av. 18 de Julio 1234</p>
                <p className="font-body text-muted-foreground text-sm">Montevideo, Uruguay</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock size={15} className="text-white/35 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-condensed text-white/35 text-xs tracking-[0.3em] uppercase mb-1.5">
                  Horarios
                </p>
                <p className="font-body text-foreground">Lunes – Sábado: 9:00 – 20:00</p>
                <p className="font-body text-muted-foreground text-sm">Domingo: 10:00 – 15:00</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone size={15} className="text-white/35 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-condensed text-white/35 text-xs tracking-[0.3em] uppercase mb-1.5">
                  Contacto
                </p>
                <p className="font-body text-foreground">+598 99 123 456</p>
                <p className="font-body text-muted-foreground text-sm">dsstudio@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="flex gap-6 mt-10 pt-8 border-t border-white/8">
            <a
              href="#"
              className="flex items-center gap-2 font-condensed text-white/40 hover:text-white tracking-[0.28em] uppercase text-xs transition-colors"
            >
              <Instagram size={15} /> Instagram
            </a>
            <a
              href="#"
              className="flex items-center gap-2 font-condensed text-white/40 hover:text-white tracking-[0.28em] uppercase text-xs transition-colors"
            >
              <Facebook size={15} /> Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-black border-t border-white/8 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-white/35 flex items-center justify-center">
              <span className="font-condensed font-bold tracking-widest text-white text-xs">DS</span>
            </div>
            <span className="font-display text-white text-base tracking-[0.22em] uppercase font-bold">
              DS STUDIO
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { label: "Inicio", href: "#inicio" },
              { label: "Servicios", href: "#servicios" },
              { label: "Galería", href: "#galeria" },
              { label: "Equipo", href: "#equipo" },
              { label: "Contacto", href: "#contacto" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="font-condensed text-white/35 hover:text-white transition-colors text-xs tracking-[0.3em] uppercase"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/35 hover:text-white transition-colors">
              <Instagram size={15} />
            </a>
            <a href="#" className="text-white/35 hover:text-white transition-colors">
              <Facebook size={15} />
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 text-center">
          <p className="font-condensed text-white/18 text-xs tracking-[0.3em]">
            © {new Date().getFullYear()} DS STUDIO — Barbería Montevideo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── WhatsApp FAB ──────────────────────────────────────────────────────────────

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/59899123456?text=Hola%20DS%20STUDIO%2C%20quiero%20consultar%20un%20turno"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <NavBar />
      <HeroSection />
      <GallerySection />
      <VideoSection />
      <ServicesSection />
      <BookingSection />
      <TeamSection />
      <LocationSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
