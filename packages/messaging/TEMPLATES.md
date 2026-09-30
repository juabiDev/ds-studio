# WhatsApp templates

Create these in **WhatsApp Manager → Message templates** before enabling WhatsApp. Names,
categories, parameter names and button order must match exactly: the code sends parameters by
name (`{{nombre}}`) and the quick-reply buttons by position.

Language: **Spanish (`es`)** — change `WHATSAPP_TEMPLATE_LANGUAGE` if you pick another variant.
Parameter type: **Named**.

## 1. `reserva_confirmada` — Utility

Sent right after a booking (online or entered by staff with a phone number).

**Body**

```
Hola {{nombre}}, tu turno en DS STUDIO quedó reservado:

✂️ {{servicio}} con {{barbero}}
📅 {{fecha}} a las {{hora}} hs

¿Nos confirmás que venís?
```

**Buttons** (Quick reply, in this order)

1. `Confirmo asistencia`
2. `Cancelar turno`

Sample values for review: nombre `Juan`, servicio `Fade / Degradé`, barbero `Diego S.`,
fecha `martes 29 de septiembre`, hora `10:00`.

## 2. `reserva_cancelada_local` — Utility

Sent when staff cancel an appointment from the admin.

**Body**

```
Hola {{nombre}}, lamentamos avisarte que tu turno de {{servicio}} del {{fecha}} a las {{hora}} hs fue cancelado por el local.

Podés reservar un nuevo horario en {{sitio}} o respondiendo este mensaje.
```

No buttons. Sample values: nombre `Juan`, servicio `Corte Clásico`, fecha `martes 29 de septiembre`,
hora `10:00`, sitio `https://dsstudio.uy`.

## Notes

- Keep both templates free of promotions: Meta re-categorizes utility templates with marketing
  content as Marketing (≈6× the price).
- Replies after a button tap ("¡Gracias!…", "Listo, cancelamos…") are free-form texts sent inside
  the 24-hour customer service window, so they need no template.
