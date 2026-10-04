export type ActionResult = { ok: true } | { ok: false; error: string };

/** id + display name, as used by barber/service selects and chip rows. */
export type NamedOption = { id: string; name: string };
