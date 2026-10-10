# Salida a producción — DS STUDIO

Paso a paso para publicar el sitio y el panel. Sigue el orden: cada paso supone que los anteriores
están hechos. Marca cada casilla al terminarla.

**Datos de esta salida**

| | |
|---|---|
| Sitio público | `https://www.dsstudio.com.uy` (el dominio sin `www` redirige aquí) |
| Panel de administración | `https://admin.dsstudio.com.uy` |
| Emails a clientes | desde `contacto@dsstudio.com.uy` (Resend) |
| Hosting | Railway: servicios `web`, `admin`, `reminders` (cron) y una base PostgreSQL |
| DNS | en el proveedor del dominio (sin Cloudflare) |
| Integraciones el día 1 | Email (Resend), Turnstile, fotos (Cloudflare Images). **WhatsApp queda para después** |

> **Por qué `www`:** Railway solo puede servir el dominio "pelado" (`dsstudio.com.uy`) si el
> proveedor de DNS admite registros ALIAS o "CNAME flattening", y muchos no lo hacen. Con `www`
> alcanza un CNAME normal, que funciona en cualquier proveedor.

---

## 0. Código

- [ ] Revisar y aprobar el pull request de `feature/monorepo-gallery-settings` y hacer merge a `main`.
- [ ] Confirmar que Railway despliega desde `main`.

## 1. Railway: proyecto y base de datos

- [ ] Crear el proyecto en Railway y agregar una base **PostgreSQL**.
- [ ] Crear tres servicios desde este repositorio (raíz del repo, sin "root directory"):

| Servicio | Build | Start | Pre-deploy | Dominio |
|---|---|---|---|---|
| `web` | `npx turbo build --filter=@ds-studio/web` | `npm run start -w @ds-studio/web -- --port $PORT` | `npm run db:deploy` | sí |
| `admin` | `npx turbo build --filter=@ds-studio/admin` | `npm run start -w @ds-studio/admin -- --port $PORT` | – | sí |
| `reminders` | `echo "sin build"` | `npm run cron:reminders` | – | no |

- [ ] En `reminders`, configurar el **Cron Schedule** en `0 11 * * *` (11:00 UTC = 08:00 en
  Montevideo). Cada día envía los recordatorios del día y anonimiza los datos viejos de clientes.
- [ ] En `reminders`, el build tiene que ser ese comando que no hace nada: si queda vacío, Railway
  corre `npm run build`, que intenta compilar las dos apps y falla.
- [ ] Las migraciones corren solas en el pre-deploy de `web`. **Nunca** las corras desde `admin`.

## 2. Variables de entorno

Genera cada secreto con `openssl rand -base64 32` y **no lo reutilices** entre variables distintas.
Donde dice "mismo valor", copia exactamente el mismo texto en los dos servicios.

**`web`**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.dsstudio.com.uy` |
| `SITE_INDEXING` | **vacía por ahora** (se activa en el paso 10) |
| `IP_HASH_SALT` | secreto nuevo |
| `BOOKING_LINK_SECRET` | secreto nuevo (**mismo valor** en `admin`) |
| `CRON_SECRET` | secreto nuevo (**mismo valor** en `reminders`) |
| `RESEND_API_KEY` | clave de Resend (paso 5) |
| `BOOKING_EMAIL_FROM` | `contacto@dsstudio.com.uy` |
| `BOOKING_NOTIFY_EMAIL` | email (o emails separados por coma) donde el local recibe cada reserva |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | claves de Turnstile (paso 6) |

**`admin`**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.dsstudio.com.uy` |
| `BETTER_AUTH_SECRET` | secreto nuevo (solo admin) |
| `BETTER_AUTH_URL` | `https://admin.dsstudio.com.uy` |
| `BOOKING_LINK_SECRET` | **mismo valor** que en `web` |
| `RESEND_API_KEY` / `BOOKING_EMAIL_FROM` | iguales que en `web` |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_IMAGES_API_TOKEN` | del paso 7 |

**`reminders`**

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.dsstudio.com.uy` |
| `CRON_SECRET` | **mismo valor** que en `web` |

> **Importante:** `NEXT_PUBLIC_SITE_URL` y `SITE_INDEXING` se leen **al compilar**. Si cambias
> cualquiera de las dos, tienes que volver a desplegar el servicio para que tome el cambio.
> `CLIENT_IP_HEADER` **no** se define: con el DNS fuera de Cloudflare, el valor por defecto es el correcto.

## 3. Primer deploy y carga inicial de la base

- [ ] Desplegar `web` (corre las migraciones) y después `admin`. Revisar que ambos builds terminen bien.
- [ ] Desde tu computadora, con la URL **pública** de la base (`DATABASE_PUBLIC_URL` del servicio
  Postgres en Railway) puesta como `DATABASE_URL` en tu `.env` local:
  - [ ] `npm run db:seed` — carga los servicios con precios, los barberos (Diego y Maiko), las fotos
    reales de la galería, el horario semanal de turnos y los datos del local (Colonia 1812 esq.
    Tristán Narvaja, Centro).
  - [ ] `npm run auth:create-admin -- --email <tu-email> --name "<Nombre>"` para cada persona que
    va a usar el panel (pide la contraseña, mínimo 10 caracteres).
- [ ] Volver a poner tu `.env` local como estaba.

> ⚠️ **El seed se corre UNA sola vez.** Si lo vuelves a correr, pisa los servicios, precios,
> barberos y el orden de la galería con los valores originales y pierdes lo que editaste en el panel.

## 4. Dominio y DNS (en tu proveedor)

- [ ] En Railway, agregar el dominio `www.dsstudio.com.uy` al servicio `web` y
  `admin.dsstudio.com.uy` al servicio `admin`.
- [ ] En el proveedor del dominio, crear los registros que muestra Railway para cada uno:
  - `www` → **CNAME** al destino que indica Railway.
  - `admin` → **CNAME** al destino que indica Railway.
  - Si Railway pide un registro **TXT** de verificación, crearlo también.
- [ ] Configurar en el proveedor una **redirección 301** de `dsstudio.com.uy` a
  `https://www.dsstudio.com.uy` (a veces se llama "URL forwarding" o "redirección web").
- [ ] Esperar a que Railway muestre los dos dominios como activos con certificado (puede tardar
  desde minutos hasta unas horas).

## 5. Email (Resend)

- [ ] Crear la cuenta en Resend y agregar el dominio `dsstudio.com.uy`.
- [ ] Crear en el proveedor los registros DNS que indica Resend (TXT de SPF y DKIM, y el MX del
  subdominio de envío). Van en subdominios propios de Resend, así que **no tocan** el correo que
  el local ya recibe en `contacto@dsstudio.com.uy`.
- [ ] Esperar a que Resend marque el dominio como verificado.
- [ ] Crear una API key con permiso de **solo envío** ("Sending access") y cargarla como
  `RESEND_API_KEY` en `web` y `admin`.
- [ ] Agregar un registro **DMARC** (TXT en `_dmarc.dsstudio.com.uy`) para que nadie pueda enviar
  emails falsos en nombre del local. Empieza con `v=DMARC1; p=none; rua=mailto:contacto@dsstudio.com.uy`
  (solo observa). Cuando confirmes que el correo habitual del local también pasa SPF y DKIM, sube a
  `p=quarantine` y después a `p=reject`. Empezar directamente estricto puede mandar a spam los emails
  normales del local.

## 6. Turnstile (anti-bots del formulario de reserva)

- [ ] En Cloudflare (alcanza con una cuenta gratis, el DNS no tiene que estar ahí), crear un
  widget de Turnstile para los dominios `www.dsstudio.com.uy` y `dsstudio.com.uy`.
- [ ] Cargar la **site key** como `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y la **secret key** como
  `TURNSTILE_SECRET_KEY` en `web`, y volver a desplegar `web`.
- [ ] Carga **las dos o ninguna**: si falta la secreta, la verificación se saltea y queda un error
  en los logs con cada reserva.

## 7. Fotos (Cloudflare Images)

- [ ] En la misma cuenta de Cloudflare, activar **Cloudflare Images**. Guardar las fotos en Images
  requiere el **plan pago** de Images; revisa el precio vigente antes de activarlo.
- [ ] Copiar el **Account ID** (barra lateral del panel de Cloudflare) → `CLOUDFLARE_ACCOUNT_ID`.
- [ ] Crear un API token con **solo** el permiso "Account → Cloudflare Images → Edit" →
  `CLOUDFLARE_IMAGES_API_TOKEN`. Ambos van **solo** en `admin`.
- [ ] Volver a desplegar `admin` y subir una foto de prueba desde **Galería** para confirmar.

## 8. Contenido en el panel (`admin.dsstudio.com.uy`)

- [ ] **Ajustes:** teléfono y email reales (hoy son de ejemplo), WhatsApp si es otro número,
  Instagram y Facebook. Revisar dirección, barrio, código postal (11200) y el horario de atención.
- [ ] **Servicios:** revisar nombres, duración y precios de los 6 servicios del seed.
- [ ] **Barberos:** subir la foto real de cada uno (hoy son fotos de stock) y revisar rol,
  especialidad y experiencia.
- [ ] **Horarios:** bloquear los horarios en que cada barbero no atiende. El horario base es
  lunes a viernes 10:00–20:00 (sin turno a las 12:30), sábado 9:00–14:00 y domingo 10:00–14:00.
- [ ] **Cierres:** cargar los próximos feriados y vacaciones.
- [ ] **Galería:** agregar fotos reales de cortes y ordenarlas.
- [ ] **Preguntas frecuentes:** revisar las 5 preguntas iniciales (o apagar la sección).

## 9. Prueba completa en producción

- [ ] Abrir `https://www.dsstudio.com.uy` en el celular y en la computadora: carga, se ve bien,
  dice "Barbería en Centro, Montevideo".
- [ ] Abrir `https://dsstudio.com.uy` y confirmar que redirige a `www`.
- [ ] Reservar un turno de prueba con tu teléfono y tu email:
  - [ ] llega el email de confirmación (revisa también spam) y el aviso al local;
  - [ ] el turno aparece en la **Agenda** del panel;
  - [ ] el botón "Cancelar turno" del email lleva a la página de cancelación y funciona.
- [ ] Probar el recordatorio a mano (solo envía a quienes tienen turno hoy y todavía no lo recibieron):
  `curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://www.dsstudio.com.uy/api/cron/reminders`
- [ ] Compartir el link del sitio por WhatsApp y confirmar que aparece la vista previa con imagen.
- [ ] Cancelar el turno de prueba desde la Agenda del panel.

## 10. Abrir el sitio a Google

Solo cuando los pasos 1–9 estén completos.

- [ ] En `web`, poner `SITE_INDEXING=on` y **volver a desplegar**.
- [ ] Confirmar que `https://www.dsstudio.com.uy/robots.txt` dice `Allow: /` y lista el sitemap.
- [ ] **Google Search Console:** agregar la propiedad de dominio `dsstudio.com.uy` (verificación
  con un TXT en el proveedor) y enviar `https://www.dsstudio.com.uy/sitemap.xml`.
- [ ] **Perfil de Empresa de Google:** categoría principal "Barbería" y secundaria "Peluquería";
  el mismo nombre, dirección y teléfono que el sitio; link de reserva a
  `https://www.dsstudio.com.uy/#agendar`; servicios con precio y fotos.
- [ ] Registrar el local en los directorios que ya aparecen en las búsquedas (synara.ar,
  busco.info, guiadeo.com, barberiasenuruguay.online) con los mismos datos.

## 11. Primera semana

- [ ] Al día siguiente, revisar en los logs de `reminders` que corrió a las 08:00 sin errores.
- [ ] Revisar los logs de `web` y `admin` por errores (`[email]`, `[turnstile]`, `[site-config]`).
- [ ] Confirmar que Railway tiene **backups** activados para la base PostgreSQL.
- [ ] Pedir reseñas en Google a los primeros clientes.

## Si algo sale mal

- **Volver atrás un deploy:** en Railway, en el servicio afectado, elegir el deploy anterior y
  "Redeploy". Las migraciones de esta salida solo agregan columnas y tablas, así que el código
  anterior sigue funcionando con la base nueva.
- **El sitio carga pero sin servicios ni barberos:** falta correr el seed (paso 3).
- **Nadie puede reservar:** revisar en **Horarios** que haya horarios disponibles y en
  **Cierres** que no haya un cierre cargado por error.
- **No llegan emails:** el dominio no está verificado en Resend o falta `RESEND_API_KEY`
  (los logs muestran `[email] Not configured`).

## Más adelante (no bloquea la salida)

- **WhatsApp:** configurarlo según la sección 11 del README. Antes, volver a enviar a Meta las
  plantillas de [`packages/messaging/TEMPLATES.md`](../packages/messaging/TEMPLATES.md), que ahora
  usan "tú", y esperar su aprobación.
- **SEO:** mejoras pendientes en [`docs/seo-roadmap.md`](seo-roadmap.md).
