import { z } from "zod";

export const rulesSchema = z.object({ purchase_points: z.number(), daily_purchase_limit: z.number(), referral_points: z.number(), monthly_referral_limit: z.number(), token_ttl_seconds: z.number(), timezone: z.string(), prize: z.object({ title: z.string(), description: z.string() }) });
export const referralsSchema = z.object({ code: z.string(), has_inviter: z.boolean(), can_claim: z.boolean(), invited_count: z.number(), rewarded_count: z.number(), monthly_referral_points: z.number(), rules: rulesSchema });
export type Referrals = z.infer<typeof referralsSchema>;
export const rankingSchema = z.object({ month: z.string(), entries: z.array(z.object({ alias: z.string(), points: z.number(), position: z.number() })), me: z.object({ points: z.number(), purchase_points: z.number(), referral_points: z.number(), alias: z.string().nullable(), participating: z.boolean() }), rules: rulesSchema });
export type Ranking = z.infer<typeof rankingSchema>;
export const venuesSchema = z.array(z.object({ id: z.string().uuid(), name: z.string(), zone: z.string(), is_demo: z.boolean() }));
export type PurchaseVenue = z.infer<typeof venuesSchema>[number];
export const customerHistorySchema = z.array(z.object({ id: z.string(), place_name: z.string(), validated_at: z.string(), is_demo: z.boolean(), cancelled: z.boolean(), points: z.number() }));
export type CustomerPurchase = z.infer<typeof customerHistorySchema>[number];
export const staffHistorySchema = z.array(z.object({ id: z.string(), validated_at: z.string(), is_demo: z.boolean(), cancelled: z.boolean(), cancellation_reason: z.string().nullable() }));
export type StaffPurchase = z.infer<typeof staffHistorySchema>[number];
export const requestSchema = z.object({ ok: z.literal(true), token: z.string().regex(/^[a-f0-9]{64}$/), place_id: z.string().uuid(), expires_at: z.string(), is_demo: z.boolean() });
export const resultSchema = z.object({ ok: z.boolean(), error: z.string().optional(), purchase_id: z.string().optional(), purchase_points: z.number().optional(), is_demo: z.boolean().optional(), cancelled: z.boolean().optional(), expires_at: z.string().optional() });
export const rankingAliasSchema = z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N} _-]+$/u);

export function rewardsError(data: unknown, failed = false): string | null {
  const result = resultSchema.safeParse(data);
  if (failed || !result.success) return "No hemos podido completar la operación. Comprueba tu conexión y vuelve a intentarlo.";
  if (result.data.ok) return null;
  const errors: Record<string, string> = {
    forbidden: "Tu cuenta no tiene permiso para esta operación en este local.",
    profile_required: "Completa primero tu perfil de mayor de edad.",
    place_unavailable: "Este local no está disponible para validar compras.",
    staff_cannot_earn: "El personal no obtiene puntos por compras en su propio local. Puedes ensayar el flujo en tu local demo.",
    rate_limited: "Has realizado demasiados intentos. Espera unos minutos.",
    invalid_qr: "Ese QR no es válido para este local.",
    qr_expired: "El QR ha caducado. Pide al cliente que genere uno nuevo.",
    qr_already_used: "Ese QR ya se utilizó. Comprueba el historial antes de repetir la operación.",
    receipt_already_used: "Ese ticket ya se ha registrado hoy en este local, aunque se haya anulado.",
    invalid_purchase: "Revisa el QR y la referencia del ticket (entre 3 y 80 caracteres).",
    operation_conflict: "La operación ya existe con otros datos. Comprueba el historial.",
    invalid_cancellation: "Escribe un motivo de anulación de 5 a 200 caracteres.",
    invalid_referral_code: "El código de invitación no existe o es el tuyo.",
    referral_already_set: "Ya tienes un código de invitación asociado. No se puede cambiar.",
    referral_cycle: "No se pueden enlazar códigos formando un círculo de invitaciones.",
    already_purchased: "El código debe asociarse antes de la primera compra validada.",
    invalid_alias: "Usa un alias de 3 a 24 letras, números, espacios, guiones o guiones bajos.",
    alias_taken: "Ese alias ya está en uso. Elige otro.",
  };
  return errors[result.data.error ?? ""] ?? "No se ha podido completar la operación. Vuelve a intentarlo.";
}

export function purchaseQr(placeId: string, token: string) { return `HUNTER:PURCHASE:${placeId}:${token}`; }
export function parsePurchaseQr(value: string, expectedPlace: string): string | null {
  const raw = value.trim();
  if (/^[a-f0-9]{64}$/.test(raw)) return raw;
  const match = /^HUNTER:PURCHASE:([a-f0-9-]{36}):([a-f0-9]{64})$/.exec(raw);
  return match && match[1] === expectedPlace ? match[2] : null;
}
export function rankingMonths(now = new Date()): string[] {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).formatToParts(now).map((p) => [p.type, p.value]));
  return Array.from({ length: 13 }, (_, offset) => new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1 - offset, 1)).toISOString().slice(0, 10));
}
