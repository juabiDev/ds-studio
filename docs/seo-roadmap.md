# SEO roadmap

Local SEO plan for the public site, based on a review of the top Google results for
"barbería Centro Montevideo" / "barbería Montevideo" (October 2026). Ranking in the map pack is
driven mostly by the Google Business Profile, reviews (recency matters most) and on-page signals.

## Done before launch

- Indexing switch: `SITE_INDEXING=on` (production web service only) enables `robots.txt` and the
  robots meta. `/api/` stays disallowed; cancel pages stay crawlable so Google sees their noindex.
- Title, meta description and the page's single `h1` use the barrio from Ajustes:
  "DS STUDIO — Barbería en Centro, Montevideo".
- `HairSalon` structured data with address, geo, hours, prices, payment methods and booking action.
- FAQ section, privacy page, sitemap, share image under 300 KB, icons and manifest.

## Launch checklist (no code)

The full step-by-step launch is in [`go-live.md`](go-live.md) (Spanish); the SEO-specific items are:

1. Set `NEXT_PUBLIC_SITE_URL=https://www.dsstudio.com.uy` and, once everything else is ready,
   `SITE_INDEXING=on` on the production web service (both are read at build time: redeploy).
2. Check Ajustes after the seed: it sets "Colonia 1812 esq. Tristán Narvaja", barrio Centro,
   CP 11200 and the map coordinates. Phone and email are still placeholders to replace there.
3. Google Search Console: verify the domain and submit `/sitemap.xml`.
4. Google Business Profile: primary category "Barbería", secondary "Peluquería"; booking link to
   `https://www.dsstudio.com.uy/#agendar`; services with prices; weekly photos and posts; reply to every review.
5. Same name, address and phone everywhere (site, Business Profile, Instagram, directories).
6. Get listed in the directories that already rank for these searches: synara.ar,
   busco.info, guiadeo.com, barberiasenuruguay.online.

## Next improvements

Ordered by expected impact; each one is independent.

| # | Improvement | Why | Effort |
|---|---|---|---|
| 1 | Review request email when a turn is marked "Completado" (needs a Google review link field in Ajustes) | Review recency is the fastest-growing ranking signal | Medium |
| 2 | Show the Google rating and a few reviews on the home page | Social proof; competitors show reviews on-page | Medium (Places API or manual) |
| 3 | "Sobre nosotros / Cómo llegar" text mentioning the barrio and nearby landmarks | Top competitor pages have ~1,500 words; ours is short | Low code, needs real content |
| 4 | One page per service (`/servicios/fade`, `/servicios/barba`, …) with photos and prices | More entry points for specific searches | Medium |
| 5 | Reschedule (not only cancel) from the email link | Fewer no-shows and lost turns | Medium |
| 6 | Optional deposit for peak hours via Mercado Pago | Cuts no-shows on the busiest slots | High, business decision |

## Avoid

- Several domains for the same shop (a competitor splits its authority across three).
- Mass-produced blog posts; a few genuinely useful pages beat many thin ones.
- Booking on a third-party site: keeping it on-site is an advantage over every competitor reviewed.
