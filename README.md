# DS STUDIO

Sistema de la barbería **DS STUDIO** (Montevideo): un **sitio público** con reserva de turnos online y un **panel de administración** para el local. Son dos apps Next.js separadas que comparten una única base de datos PostgreSQL (Railway) y un único `schema.prisma`.

Diseño original en Figma: https://www.figma.com/design/2lfePeOFa0BmF5MEiGNCua/Landing-page-para-barber%C3%ADa

---

## Índice

1. [Estado actual](#1-estado-actual)
2. [Arquitectura](#2-arquitectura)
3. [Cómo arrancar en local](#3-cómo-arrancar-en-local)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Scripts](#5-scripts)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Reservas: cómo funcionan](#7-reservas-cómo-funcionan)
8. [Sitio público](#8-sitio-público)
9. [Panel de administración](#9-panel-de-administración)
10. [Autenticación (Better Auth)](#10-autenticación-better-auth)
11. [WhatsApp](#11-whatsapp)
12. [Email](#12-email)
13. [Seguridad](#13-seguridad)
14. [Deploy en Railway](#14-deploy-en-railway)
15. [Pruebas](#15-pruebas)
16. [Decisiones tomadas y por qué](#16-decisiones-tomadas-y-por-qué)
17. [Pendientes](#17-pendientes)

---

## 1. Estado actual

| Área | Estado |
|---|---|
| Sitio público (landing + reservas reales) | ✅ Hecho y probado |
| Panel admin (agenda, horarios, cierres, barberos, turnos por teléfono) | ✅ Hecho y probado |
| Panel admin: servicios, galería con subida de fotos, preguntas frecuentes, clientes, estadísticas | ✅ Hecho y probado |
| Privacidad (Ley 18.331): página `/privacidad` y anonimización automática a los 12 meses | ✅ Hecho |
| SEO local: título y `h1` con el barrio, datos estructurados, sitemap, imagen para compartir | ✅ Hecho (indexación apagada hasta el lanzamiento) |
| Login de administradores (Better Auth) | ✅ Hecho y probado |
| Protección anti-spam de reservas | ✅ Hecho y probado |
| WhatsApp: confirmación, confirmar asistencia, cancelar | ✅ Hecho, probado contra un **simulador** de Meta |
| Email al local por cada reserva/cancelación | ✅ Hecho (sin credenciales solo se escribe en el log) |
| Email al cliente: confirmación de la reserva | ✅ Hecho (plantilla local) |
| Email al cliente: recordatorio el mismo día a las 8:00 | ✅ Hecho (cron de Railway) |
| Recordatorios por WhatsApp (día anterior / 2 h antes) | ⏳ Pendiente |
| Email marketing | ⏳ Pendiente (a futuro) |

**Todavía no se probó contra servicios reales**: Railway, Meta (WhatsApp), Resend, Cloudflare Turnstile ni Cloudflare Images. Todo se probó en local con PostgreSQL real y builds de producción (ver [Pruebas](#15-pruebas)).

**Para salir a producción, sigue [`docs/go-live.md`](docs/go-live.md).** Las mejoras de SEO pendientes están en [`docs/seo-roadmap.md`](docs/seo-roadmap.md).

---

## 2. Arquitectura

Monorepo con **npm workspaces + Turborepo**.

| Carpeta | Paquete | Qué contiene |
|---|---|---|
| `apps/web` | `@ds-studio/web` | Sitio público (puerto 3000). Landing, reservas, API de disponibilidad, webhook de WhatsApp |
| `apps/admin` | `@ds-studio/admin` | Panel admin (puerto 3001). Solo usuarios con rol `ADMIN` |
| `packages/database` | `@ds-studio/database` | **El único `schema.prisma`**, migraciones, cliente Prisma, reglas de reserva (`booking.ts`), fechas en hora de Montevideo (`dates.ts`), seed y stress test |
| `packages/auth` | `@ds-studio/auth` | Configuración de Better Auth, `requireAdmin()`, límite de intentos de login, script `create-admin` |
| `packages/messaging` | `@ds-studio/messaging` | WhatsApp Cloud API: envío de plantillas, webhook, verificación de firmas |
| `packages/ui` | `@ds-studio/ui` | Componentes shadcn/ui y tema (los usa el admin) |

```
                 ┌──────────────┐        ┌──────────────┐
  Clientes ────▶ │   apps/web   │        │  apps/admin  │ ◀──── Personal del local
                 └──────┬───────┘        └──────┬───────┘
                        │   packages/database   │
                        │   packages/messaging  │   packages/auth, packages/ui
                        └──────────┬────────────┘
                                   ▼
                        PostgreSQL (Railway)
        Meta WhatsApp Cloud API ◀──▶ /api/whatsapp/webhook (web)
        Resend (email al local)
```

**Criterios de diseño**
- **Server Components por defecto.** Solo lo interactivo es componente de cliente, cada uno en su propio archivo (`NavScrollContainer`, `MobileMenu`, `GalleryGrid`, `BookingWizard`, `OpenStatus`, `MobileActionBar`, `TurnstileWidget`, `BookServiceButton`).
- **Mobile first en las dos apps:** botones de 44px o más, barras de acción abajo al alcance del pulgar, nada que dependa del hover.
- **Validación con Zod** en todas las server actions y endpoints.
- **Nunca se muestran errores crudos al usuario:** se loguean en el servidor y se muestra un mensaje genérico.

---

## 3. Cómo arrancar en local

```bash
cp .env.example .env          # completar DATABASE_URL y BETTER_AUTH_SECRET como mínimo
npm install                   # también genera el cliente Prisma
npm run db:deploy             # aplica las migraciones
npm run db:seed               # carga servicios, barberos y horarios semanales
npm run auth:create-admin -- --email vos@dominio.uy --name "Tu nombre"
npm run dev                   # web en :3000, admin en :3001
```

- El `.env` va **en la raíz**: lo leen las dos apps y los scripts de Prisma y auth.
- `create-admin` pide la contraseña (mínimo 10 caracteres) sin mostrarla en pantalla. Si lo corrés de nuevo con el mismo email, resetea la contraseña y cierra todas las sesiones de esa persona.

---

## 4. Variables de entorno

| Variable | App | ¿Obligatoria? | Para qué |
|---|---|---|---|
| `DATABASE_URL` | ambas + CLI | ✅ | PostgreSQL de Railway. En local, `DATABASE_PUBLIC_URL`; dentro de Railway, `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | admin | ✅ | Mínimo 32 caracteres aleatorios (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | admin | ✅ | URL pública del admin |
| `NEXT_PUBLIC_SITE_URL` | ambas + cron | ✅ en producción | URL del sitio público (`https://www.dsstudio.com.uy`): SEO, links de los emails y de WhatsApp. **Se lee al compilar** |
| `SITE_INDEXING` | web | Al lanzar | `on` permite que Google indexe el sitio (`robots.txt` y meta `robots`). Vacía = no indexar. **Se lee al compilar** |
| `CLIENT_IP_HEADER` | ambas | ❌ No usar hoy | Header con la IP real del cliente. Por defecto `x-real-ip` (Railway). Solo cambia si se pone el proxy de Cloudflare delante |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_IMAGES_API_TOKEN` | admin | Para fotos | Subida de fotos de galería y barberos a Cloudflare Images. Sin estas variables, el panel explica que falta configurarlo |
| `IP_HASH_SALT` | web | Recomendada | Se mezcla con las IPs antes de guardarlas hasheadas |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | web | Recomendada | Control anti-bots de Cloudflare. Sin estas variables no se usa y cada reserva deja un error en el log |
| `RESEND_API_KEY`, `BOOKING_EMAIL_FROM` | ambas | Opcional | Emails al cliente (confirmación y recordatorio). Sin estas variables, solo se escribe en el log |
| `BOOKING_NOTIFY_EMAIL` | web | Opcional | Email al local por cada reserva/cancelación |
| `BOOKING_LINK_SECRET` | ambas | Recomendada | Firma el link "Cancelar turno" de los emails (mismo valor en web y admin). Sin esta variable, los emails salen sin ese botón |
| `CRON_SECRET` | web + cron | Para el cron diario | Protege `/api/cron/reminders` y `/api/cron/retention`. Sin esta variable responden 404 |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | ambas | Opcional | WhatsApp. Si falta alguna, no se envía nada y el webhook responde 404 |
| `WHATSAPP_GRAPH_VERSION` | ambas | Opcional | Por defecto `v26.0` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | ambas | Opcional | Por defecto `es` |
| `WHATSAPP_API_BASE_URL` | ambas | ❌ Solo pruebas | Apunta al simulador de Meta. **No se usa en producción** |

Plantilla completa en [`.env.example`](.env.example). **Las credenciales van solo en las variables de Railway, nunca en el repositorio.**

---

## 5. Scripts

Se corren desde la raíz:

| Comando | Qué hace |
|---|---|
| `npm run dev` / `dev:web` / `dev:admin` | Modo desarrollo |
| `npm run build` · `npm run typecheck` | Compilación y chequeo de tipos de todo el monorepo |
| `npm run db:migrate` | Crear una migración después de editar `schema.prisma` |
| `npm run db:deploy` | Aplicar migraciones (el que se usa en Railway) |
| `npm run db:seed` | Cargar el catálogo inicial. Se puede repetir sin duplicar datos |
| `npm run db:studio` | Explorar la base de datos con Prisma Studio |
| `npm run db:stress-test` | Prueba de concurrencia y reglas de reserva. **Seguro en producción**: solo usa filas propias `stress_*` a las 23:00/23:30, esquiva días con cierres y borra todo al terminar |
| `npm run auth:create-admin -- --email … --name …` | Crear un admin o resetear su contraseña |

`npm run lint` no funciona: el proyecto nunca tuvo configuración de ESLint.

---

## 6. Modelo de datos

Todo está en [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma). En la base, las tablas y columnas usan snake_case.

| Modelo | Para qué |
|---|---|
| `Service` | Servicios, con duración en minutos y precio decimal |
| `Employee` | Barberos: nombre, rol, especialidad, experiencia y foto (`Thumbnail`) |
| `Thumbnail` | Imagen con variantes (`sm`, `md`) |
| `Availability` | Horarios del local cada 30 minutos: día de la semana + hora, o una fecha puntual. `available` abre o cierra ese horario **para todo el local** |
| `EmployeeAvailability` | Qué barbero atiende en qué horario. `available = false` bloquea el horario **para ese barbero** sin borrarlo |
| `Closure` | Fechas cerradas: feriado de todo el local (`employeeId` vacío) o días libres de un barbero, desde/hasta |
| `Appointment` | Turno reservado: fecha + hora en hora de Montevideo, duración congelada al reservar, cliente, `source` (ONLINE/ADMIN), `status`, confirmación y cancelación, hash del código de los botones |
| `MessageLog` | Cada mensaje de WhatsApp enviado o recibido, con su estado de entrega. También evita procesar dos veces el mismo aviso de Meta |
| `User`, `Session`, `Account`, `Verification` | Tablas de Better Auth. `User.role` es ADMIN o CUSTOMER |
| `Setting` | Configuración clave/valor (todavía sin uso) |

Todas las tablas propias tienen `deleted_at` (borrado lógico), `updated_at` y `created_at`.

**Migraciones:** `20260927000000_init` (todo el esquema base) y `20260928000000_whatsapp_messaging`.

---

## 7. Reservas: cómo funcionan

La lógica está en [`packages/database/src/booking.ts`](packages/database/src/booking.ts). La usan el sitio público, el admin y el stress test.

**Qué horarios se muestran**

Un horario se ofrece solo si se cumple todo esto:
1. El barbero tiene horario abierto en **cada tramo de 30 minutos** que dura el servicio. Así se respetan el almuerzo (12:30) y el cierre: por ejemplo, un servicio de 45 minutos no se ofrece a las 19:30.
2. El horario está abierto para el local y para ese barbero.
3. No hay un **cierre** (feriado o día libre) en esa fecha.
4. No se superpone con otro turno del barbero.
5. Si es para hoy, faltan al menos **30 minutos**. Esto solo aplica a reservas online; el personal puede cargar turnos para ya mismo.

Las reservas online se pueden hacer desde hoy hasta 14 días adelante.

**"Cualquiera":** el cliente puede no elegir barbero, y se asigna el primero libre en ese horario.

**Sin reservas dobles:** cada reserva vuelve a verificar la disponibilidad y se guarda dentro de una transacción `SERIALIZABLE` de Postgres. Si dos personas reservan lo mismo al mismo tiempo, Postgres aborta una; se reintenta hasta 3 veces y, si el horario ya no está libre, responde "se acaba de ocupar". Probado: de 20 reservas simultáneas del mismo horario, se guarda exactamente 1.

**Límites por teléfono** (solo reservas online): máximo 2 turnos futuros y 1 por día por número. Los teléfonos se guardan en formato internacional (`+59899123456`), así que "099 123 456", "99123456" y "+598 99 123 456" cuentan como el mismo cliente.

**Verificación antes de confirmar:** el wizard vuelve a consultar la disponibilidad al tocar "Continuar" y otra vez justo antes de guardar. Si el horario se ocupó, vuelve a la selección con el aviso "Las 10:00 se acaban de ocupar".

**Fechas y horas:** todo se maneja en hora de **America/Montevideo**. Las fechas viajan como `"YYYY-MM-DD"` y las horas como `"HH:mm"`, así no hay problemas de zona horaria.

---

## 8. Sitio público

`apps/web` — [`src/app/page.tsx`](apps/web/src/app/page.tsx)

- **Servicios y barberos vienen de la base de datos.** La página es estática y se regenera cada 5 minutos. **El build necesita `DATABASE_URL`.**
- **Wizard de reserva en 3 pasos:** Servicio → Horario (barbero, fecha y hora) → Datos (nombre y teléfono). Tocar un servicio lleva directo al paso 2, y "Agendar →" en una tarjeta de servicio abre el wizard con ese servicio ya elegido. En celulares, los botones de cada paso quedan fijos abajo de la pantalla.
- **Barra inferior en celulares** con Reservar · WhatsApp · Llamar. Se oculta cuando la sección de reservas está en pantalla.
- **Contacto:** teléfono, email y "Cómo llegar" son links que se pueden tocar. Los datos del negocio (dirección, barrio, horario, redes) se editan en **Ajustes** del panel y deben coincidir con el perfil de Google del negocio.
- **Otros detalles:** badge "Abierto ahora · cierra 20:00", imágenes con `next/image`, fuentes con `next/font`, mapa con carga diferida y datos estructurados `HairSalon` (JSON-LD) para Google.
- **Preguntas frecuentes** desde la base de datos; si se apagan en el panel o no hay preguntas, la sección no aparece.
- **Endpoints:** `GET /api/availability` (horarios libres, con límite por IP), `/api/whatsapp/webhook` (Meta) y `/api/cron/reminders` y `/api/cron/retention` (cron diario).
- La indexación depende de `SITE_INDEXING`: apagada hasta el lanzamiento (paso 10 de [`docs/go-live.md`](docs/go-live.md)).

---

## 9. Panel de administración

`apps/admin`. En celulares tiene barra de navegación abajo (Agenda, Horarios, Cierres, Clientes y **Más**); en escritorio, pestañas arriba. Las pantallas de uso ocasional están en **Más**.

| Pantalla | Qué permite |
|---|---|
| **Agenda** (`/`) | Turnos del día (con ‹ › para cambiar de día). Botones Llamar/WhatsApp y Completado/No vino/Cancelar. Muestra si el cliente confirmó, si el WhatsApp fue entregado o leído, y un aviso "**WhatsApp no llegó — llamar**". Botón **Nuevo turno** |
| **Nuevo turno** (`/turnos/nuevo`) | Cargar turnos por teléfono o de clientes que llegan sin reserva. El teléfono es opcional; si se carga, el cliente recibe la confirmación por WhatsApp |
| **Horarios** (`/horarios`) | Elegir barbero y día, y tocar cada horario para bloquearlo o habilitarlo. También bloquear o habilitar el día entero. La opción **"Todo el local"** abre o cierra un horario para todos los barberos |
| **Cierres** (`/cierres`) | Feriados del local o días libres de un barbero (desde/hasta). Muestra cuántos turnos ya reservados quedan afectados |
| **Clientes** (`/clientes`) | Buscar por teléfono o nombre: visitas, faltas, cancelaciones y contacto |
| **Barberos** (`/barberos`, `/barberos/[id]`) | Lista con horarios; editar nombre, rol, especialidad, experiencia y foto |
| **Servicios** (`/servicios`) | Crear, editar (nombre, duración, precio) y eliminar servicios |
| **Galería** (`/galeria`) | Subir fotos a Cloudflare Images, categoría, descripción, orden y eliminar |
| **Preguntas frecuentes** (`/preguntas`) | Mostrar u ocultar la sección, crear, editar, ordenar y eliminar preguntas |
| **Estadísticas** (`/estadisticas`) | Turnos, ingresos estimados, tasa de faltas y reservas online de los últimos 30 días; días y horarios más pedidos |
| **Ajustes** (`/ajustes`) | Contacto, dirección, barrio, código postal, coordenadas, redes y horario de atención |

Cada acción del admin verifica la sesión y el rol (`requireAdmin()`) y valida los datos con Zod.

---

## 10. Autenticación (Better Auth)

[`packages/auth`](packages/auth)

- **Email + contraseña.** El registro público está **desactivado**: los admins se crean con `npm run auth:create-admin`.
- **Contraseñas:** hasheadas con scrypt, mínimo 10 caracteres.
- **Sesiones:** guardadas en la base de datos, duran 7 días y se renuevan una vez por día.
- **Dos niveles de verificación:**
  1. El middleware (runtime Node.js) revisa rápido que exista la cookie de sesión.
  2. `requireAdmin()` verifica la sesión real en la base de datos y el rol `ADMIN` en cada página y cada acción. Probado: una cookie falsificada no logra ver ni modificar nada.
- **El login solo acepta cuentas con rol `ADMIN`.** Ante cualquier error responde "Email o contraseña incorrectos", sin revelar qué emails existen.
- **Límite de intentos:** 5 por minuto por IP **y** por email. Los intentos se cuentan en memoria, así que el contador se reinicia con cada deploy y cada instancia lleva su propia cuenta.
- **Cerrar sesión** borra la sesión de la base de datos y la cookie.

---

## 11. WhatsApp

[`packages/messaging`](packages/messaging) — usa **Meta WhatsApp Cloud API** directamente, sin intermediarios.

**Flujo**
1. El cliente reserva y recibe la plantilla `reserva_confirmada` con los botones **Confirmo asistencia** / **Cancelar turno**.
2. Cuando toca un botón, Meta avisa a la app en `POST /api/whatsapp/webhook`:
   - **Confirmar:** se registra `customer_confirmed_at` y se responde "¡Gracias, Juana! Te esperamos…".
   - **Cancelar:** el turno se cancela y el horario queda libre enseguida. Se responde "Listo, cancelamos…" y se manda un email al local.
3. Si el local cancela desde el admin, el cliente recibe la plantilla `reserva_cancelada_local`.
4. Los estados de entrega (enviado, entregado, leído, falló) se guardan en `message_logs` y se ven en la agenda.
5. Los mensajes de texto comunes no reciben respuesta automática: quedan para que el local los conteste desde la app de WhatsApp Business.

**Configuración**
1. Crear las 2 plantillas **exactamente** como en [`packages/messaging/TEMPLATES.md`](packages/messaging/TEMPLATES.md).
2. Crear un **token de System User** con **solo** el permiso `whatsapp_business_messaging`, asignado solo a tu cuenta de WhatsApp Business.
3. Activar **"Require App Secret"** en la configuración de la app de Meta.
4. Cargar las variables `WHATSAPP_*` en los dos servicios de Railway.
5. Registrar el webhook en Meta con la URL `https://<sitio>/api/whatsapp/webhook`, el `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, y suscribirse al campo `messages`.
6. Activar la verificación en dos pasos para los admins del negocio en Meta y para el número.
7. Hacer una reserva real con tu celular para probar contra Meta.

**Costo estimado en Uruguay:** $0.0113 USD por mensaje "utility". Con 400 reservas por mes, unos 11 USD.

---

## 12. Email

- **Hoy:** todo vía **Resend**, desde `BOOKING_EMAIL_FROM` (`contacto@dsstudio.com.uy`):
  - **Confirmación al cliente** apenas reserva (online, o desde el admin si se cargó el email).
  - **Recordatorio al cliente** el día del turno a las 8:00, con la hora y el barbero.
  - **Aviso al cliente cuando el local cancela** el turno desde el admin, con botón para reservar otro.
  - **Aviso al local** por cada reserva online y cada cancelación hecha por el cliente ([`apps/web/src/lib/notify.ts`](apps/web/src/lib/notify.ts)).
- **Cancelar desde el email:** la confirmación y el recordatorio traen un botón "Cancelar turno" (hasta 2 horas antes; después, el email sugiere WhatsApp). El link abre `/cancelar-turno/<id>?t=<firma>`, que pide confirmar con un botón: abrir el link no cancela nada, porque los filtros de Outlook y Gmail abren los links solos. La firma es un HMAC con `BOOKING_LINK_SECRET`, así que no se guarda ningún token. Al cancelar se avisa al local igual que con WhatsApp.
- **Tono:** los emails usan "tú" neutro; el sitio sigue con "vos".
- **Plantillas:** locales, en [`packages/messaging/src/email/templates.ts`](packages/messaging/src/email/templates.ts). Se pueden pasar a plantillas de Resend más adelante.
- Cada envío queda en `message_logs` (canal `EMAIL`, tipos `booking_confirmation_email`, `reminder_email` y `staff_cancellation_email`). El recordatorio no se repite si el cron corre dos veces, y uno que falló se reintenta en la próxima corrida.
- **Recomendación:** una clave de Resend de **"solo envío" limitada a un subdominio** (por ejemplo `notificaciones.tudominio.uy`). Si se filtra, no da ningún acceso a Google Workspace ni a tu dominio principal.
- **Google Workspace queda solo para el correo de las personas.** No se integra con la app (ver decisiones en la sección 16).
- **Además:** configurar **DMARC** (`p=quarantine` y después `p=reject`) en el dominio principal, para que nadie pueda falsificar emails a su nombre.

---

## 13. Seguridad

| Riesgo | Protección |
|---|---|
| Reservas falsas o spam | Campo trampa (honeypot), máximo 3 reservas por hora por IP (guardada hasheada), máximo 2 turnos por teléfono, Turnstile opcional |
| Dos reservas del mismo horario | Transacción `SERIALIZABLE` con reintentos |
| Adivinar contraseñas del admin | Máximo 5 intentos por minuto por IP y por email, scrypt, registro público desactivado |
| Cookie de sesión falsificada | `requireAdmin()` verifica la sesión en la base de datos y el rol en cada página y acción |
| Avisos falsos al webhook de WhatsApp | Firma `X-Hub-Signature-256` verificada sobre el contenido exacto, con comparación de tiempo constante |
| Cancelar turnos ajenos | El código de los botones es aleatorio (144 bits), se guarda solo su hash, y el teléfono que toca tiene que ser el de la reserva |
| Aviso de Meta repetido | Cada mensaje se procesa una sola vez (id único en `message_logs`) |
| Token de WhatsApp filtrado | Permiso mínimo + `appsecret_proof` con "Require App Secret" (verificar con Meta real) |
| Errores internos expuestos | Mensajes genéricos al usuario; el detalle solo va al log del servidor |

**IP del cliente:** se toma de `x-real-ip`, que el borde de Railway siempre reescribe. `X-Forwarded-For` (que el cliente puede falsificar) solo se usa en desarrollo. También hay encabezados de seguridad en las dos apps (CSP, HSTS, `frame-ancestors 'none'`) y el admin responde `X-Robots-Tag: noindex`.

---

## 14. Deploy en Railway

> El paso a paso completo de la salida (dominios, DNS, Resend, Turnstile, Cloudflare Images y contenido) está en [`docs/go-live.md`](docs/go-live.md).

Dos servicios desde este repo, más una base PostgreSQL:

| Servicio | Build | Start | Pre-deploy |
|---|---|---|---|
| web | `npx turbo build --filter=@ds-studio/web` | `npm run start -w @ds-studio/web -- --port $PORT` | `npm run db:deploy` |
| admin | `npx turbo build --filter=@ds-studio/admin` | `npm run start -w @ds-studio/admin -- --port $PORT` | – |

- `DATABASE_URL=${{Postgres.DATABASE_URL}}` en los dos servicios.
- En admin, además: `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`.
- En los dos: las variables `WHATSAPP_*` si se usa WhatsApp, y `NEXT_PUBLIC_SITE_URL`.
- Las migraciones corren una sola vez, desde el pre-deploy de web.
- Railway **bloquea SMTP en el plan Hobby.** Por eso el email usa la API HTTPS de Resend.
- En los dos: `RESEND_API_KEY`, `BOOKING_EMAIL_FROM` y `BOOKING_LINK_SECRET` (mismo valor). En web, además: `CRON_SECRET`.

**Recordatorios (cron).** Un tercer servicio desde este repo, sin dominio público:

| Servicio | Cron schedule | Start | Variables |
|---|---|---|---|
| reminders | `0 11 * * *` (Railway usa UTC: 11:00 UTC = 08:00 en Montevideo) | `npm run cron:reminders` (build: `echo "sin build"`) | `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` (el mismo que en web) |

El servicio llama a `POST /api/cron/reminders` (recordatorios del día) y a `POST /api/cron/retention` (anonimiza datos de clientes de más de 12 meses) y termina. Para probarlo a mano:
`curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<sitio>/api/cron/reminders`.

**Primera vez:** `db:deploy` → `db:seed` → `auth:create-admin`. ⚠️ El seed se corre **una sola vez**: si se repite, pisa los servicios, barberos y la galería editados en el panel.

---

## 15. Pruebas

No hay tests automáticos en el repo, salvo el stress test. Lo siguiente se probó en local contra **PostgreSQL 18 real** (con `embedded-postgres`) y los servidores de producción de Next.js:

| Prueba | Controles | Resultado |
|---|---|---|
| `npm run db:stress-test` (concurrencia, "cualquiera", cierres, límites por teléfono) | 13 | ✅ |
| Reservas en el sitio público por HTTP (API, reserva, honeypot, límites por IP y teléfono, validación) | 11 | ✅ |
| Login y acceso al admin (login, sesiones, cookie falsa, acciones, cerrar sesión, límite de intentos) | 23 | ✅ |
| WhatsApp en el sitio público (plantilla, `appsecret_proof`, firmas, código, teléfono, avisos repetidos, estados, fallas) | 27 | ✅ |
| WhatsApp en el admin (turnos por teléfono, cancelación del local, estados en la agenda) | 11 | ✅ |

**Bugs reales encontrados y corregidos gracias a las pruebas**
1. **Reservas simultáneas de "Cualquiera":** cuando Postgres abortaba una transacción al confirmarla, Prisma 7 lo informaba en un formato que el código no reconocía. No se reintentaba y el cliente veía un error. Ahora se reconocen los dos formatos.
2. **Login sin límite de intentos:** Better Auth limita los intentos en sus propios endpoints HTTP, pero la server action lo llama directamente y saltea ese límite. Ahora hay un límite propio.
3. **El stress test fallaba si había un feriado real** en los próximos 3 días. Ahora elige días sin cierres.
4. **Una migración no era compatible con bases no UTF-8** por caracteres especiales en un comentario. Se pasó a ASCII.

---

## 16. Decisiones tomadas y por qué

**Estructura**
- **Monorepo con dos apps separadas** (web y admin) y un único `schema.prisma` compartido. Se despliegan de forma independiente.
- **npm + Turborepo:** el proyecto ya usaba npm, así que no valía la pena migrar a pnpm.
- **Server Components por defecto** y lo interactivo en archivos de cliente separados. La página pública bajó de 8.54 kB a 4.15 kB de JS antes de agregar las reservas reales (hoy son 13.5 kB).

**Base de datos y autenticación**
- **Supabase → Railway.** Con eso se sacó toda la configuración propia de Supabase (el vínculo con `auth.users`, el trigger de registro, RLS y `DIRECT_URL`). Como no había nada desplegado, las migraciones se unificaron en un `init` limpio.
- **NextAuth → Better Auth.** Pediste NextAuth, pero desde 2026 Auth.js es parte de Better Auth y quedó en modo mantenimiento (solo parches de seguridad). La v5 nunca salió de beta y sus propios mantenedores recomiendan Better Auth para proyectos nuevos. Además, el login con email y contraseña de NextAuth está desaconsejado y no soporta sesiones en la base de datos.

**Mensajería**
- **WhatsApp con Meta Cloud API directa**, en vez de Twilio o 360dialog: es más barata (Twilio suma $0.005 por mensaje), hay una empresa menos que ve los mensajes y no hay riesgo de bloqueo del número.
- **Nunca librerías no oficiales** (Baileys, whatsapp-web.js): guardan la sesión completa del número en el servidor y terminan en bloqueo permanente del número.
- **Email con Resend y no con Gmail/Workspace.**
  - La Gmail API con cuenta de servicio necesita "delegación a nivel de dominio", que permite **hacerse pasar por cualquier usuario** del dominio. Existe además la vulnerabilidad DeleFriend, y Google recomienda evitarla.
  - El relay SMTP con contraseña de aplicación da acceso total a la casilla y saltea la verificación en dos pasos. Además, Railway bloquea SMTP en el plan Hobby.
  - Una clave de Resend de solo envío, limitada a un subdominio, es la opción con **menos daño posible** si se filtra.
- **SMS no por ahora:** cuesta unas 7 veces más que WhatsApp ($0.085 contra $0.011) y cerca del 86% de los uruguayos usa WhatsApp.
- **Email marketing a futuro con Brevo o Resend Broadcasts**, desde un subdominio aparte, nunca desde Workspace: la política de Google puede suspender todo el dominio. Además, pedir consentimiento explícito (Ley 18.331).

**Producto**
- **"Cualquiera" preseleccionado y reservas para el mismo día:** es lo que mejor convierte según la investigación de UX.
- **Se sacó el botón de video falso** del sitio, porque no reproducía nada.
- **No se inventaron reseñas ni fotos:** necesitan contenido real.

---

## 17. Pendientes

**Para lanzar**
- [ ] Seguir [`docs/go-live.md`](docs/go-live.md) (Railway, dominios, Resend, Turnstile, Cloudflare Images, contenido y prueba completa).
- [ ] Configurar WhatsApp (sección 11) después del lanzamiento, volviendo a enviar a Meta las plantillas en "tú".
- [ ] Eliminar, si no los quieren, `.agents/`, `.windsurf/`, `.claude/skills/` y `skills-lock.json`, que agregó `prisma init`.

**Contenido real necesario**
- [ ] Reseñas de Google y fotos reales del equipo y del local (el seed usa fotos de stock de Unsplash).
- [ ] URLs de Instagram y Facebook en `BUSINESS.social` (los links quedan ocultos mientras estén vacías).
- [ ] Números reales de la sección principal del sitio ("500+ clientes", "6 años").
- [ ] Descripción de cada servicio y política de cancelación.

**Próximas funcionalidades**
- [ ] Recordatorios por WhatsApp el día anterior y 2 horas antes (el cron de emails ya existe y se puede reutilizar).
- [ ] Pasar las plantillas de email a Resend.
- [ ] Email marketing con consentimiento.
- [ ] Tests unitarios de `findOpenSlots`.
- [ ] Mejoras de SEO: ver [`docs/seo-roadmap.md`](docs/seo-roadmap.md).

---

## Uso de los paquetes compartidos

```ts
import { prisma, type Employee } from "@ds-studio/database";
import { bookAppointment, findOpenSlots } from "@ds-studio/database/booking";
import { toShopDateKey } from "@ds-studio/database/dates";
import { getCurrentUser, requireAdmin } from "@ds-studio/auth";
import { auth } from "@ds-studio/auth/server";
import { sendBookingConfirmation } from "@ds-studio/messaging";
import { Button } from "@ds-studio/ui/button";
```
