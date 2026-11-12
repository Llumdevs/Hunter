import { describe, expect, it } from "vitest";
import { parsePurchaseQr, purchaseQr, rankingMonths, rewardsError, rankingAliasSchema } from "./data";
const place = "70000000-0000-4000-8000-000000000001";
const token = "ab".repeat(32);
describe("compras y ranking", () => {
  it("acepta el QR solo para su local y propósito", () => {
    expect(parsePurchaseQr(purchaseQr(place, token), place)).toBe(token);
    expect(parsePurchaseQr(token, place)).toBe(token);
    expect(parsePurchaseQr(purchaseQr(place, token), place.replace(/1$/, "2"))).toBeNull();
    expect(parsePurchaseQr(`https://hunter.test/c/${place}?token=${token}`, place)).toBeNull();
    expect(parsePurchaseQr(`HUNTER:CHECKIN:${place}:${token}`, place)).toBeNull();
    expect(parsePurchaseQr(token.slice(1), place)).toBeNull();
  });
  it("calcula los meses en Madrid incluso antes de medianoche UTC", () => {
    const months = rankingMonths(new Date("2026-11-30T23:30:00Z"));
    expect(months).toHaveLength(13);
    expect(months[0]).toBe("2026-12-01");
    expect(months[12]).toBe("2025-12-01");
  });
  it("exige confirmación válida y explica duplicados o caducidad", () => {
    expect(rewardsError({ ok: true })).toBeNull();
    expect(rewardsError(null)).toBeTruthy();
    expect(rewardsError({ ok: true }, true)).toBeTruthy();
    expect(rewardsError({ ok: false, error: "qr_expired" })).toContain("caducado");
    expect(rewardsError({ ok: false, error: "receipt_already_used" })).toContain("anulado");
  });
  it("el alias no admite correo ni URLs", () => {
    expect(rankingAliasSchema.safeParse("Luz Valencia").success).toBe(true);
    expect(rankingAliasSchema.safeParse("persona@example.com").success).toBe(false);
    expect(rankingAliasSchema.safeParse("https://example.com").success).toBe(false);
  });
});
