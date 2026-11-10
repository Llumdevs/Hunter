// Contrato de las funciones públicas check_in y redeem (ver README de la app).
// Un error de negocio es un resultado; una forma inesperada es un fallo de contrato y lanza.
import { z } from "zod";

export const CHECK_IN_ERRORS = [
  "rate_limited", "place_unavailable", "not_adult", "qr_invalid", "invalid_location",
  "too_far", "place_closed", "already_checked_in",
] as const;

export const REDEEM_ERRORS = [
  "rate_limited", "checkin_not_found", "checkin_expired", "offer_unavailable", "offer_expired", "already_redeemed",
] as const;

export type CheckInError = (typeof CHECK_IN_ERRORS)[number];
export type RedeemError = (typeof REDEEM_ERRORS)[number];

const checkinSchema = z
  .object({
    id: z.guid(),
    place_id: z.guid(),
    night_date: z.iso.date(),
    geo_ok: z.boolean(),
  })
  .transform((row) => ({ id: row.id, placeId: row.place_id, nightDate: row.night_date, geoOk: row.geo_ok }));

const redemptionSchema = z
  .object({
    id: z.guid(),
    checkin_id: z.guid(),
    offer_snapshot: z.object({ title: z.string(), description: z.string().nullable() }),
    created_at: z.iso.datetime({ offset: true }),
    expires_at: z.iso.datetime({ offset: true }),
  })
  .transform((row) => ({
    id: row.id,
    checkinId: row.checkin_id,
    offerTitle: row.offer_snapshot.title,
    offerDescription: row.offer_snapshot.description,
    redeemedAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
  }));

const checkInResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), checkin: checkinSchema }),
  z.object({ ok: z.literal(false), error: z.enum(CHECK_IN_ERRORS) }),
]);

const redeemResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), redemption: redemptionSchema }),
  z.object({ ok: z.literal(false), error: z.enum(REDEEM_ERRORS) }),
]);

export type CheckInResult = z.infer<typeof checkInResultSchema>;
export type RedeemResult = z.infer<typeof redeemResultSchema>;
export type Checkin = Extract<CheckInResult, { ok: true }>["checkin"];
export type Redemption = Extract<RedeemResult, { ok: true }>["redemption"];

export const parseCheckInResult = (data: unknown): CheckInResult => checkInResultSchema.parse(data);
export const parseRedeemResult = (data: unknown): RedeemResult => redeemResultSchema.parse(data);
export const parseCheckinRow = (row: unknown): Checkin => checkinSchema.parse(row);
