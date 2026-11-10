import { describe, expect, it } from "vitest";
import { CHECK_IN_ERRORS, REDEEM_ERRORS } from "./results";
import { checkInErrorMessage, redeemErrorMessage, UNEXPECTED_ERROR_MESSAGE } from "./messages";

describe("mensajes de error", () => {
  it.each(CHECK_IN_ERRORS)("check-in: %s tiene mensaje", (code) => {
    expect(checkInErrorMessage(code).trim().length).toBeGreaterThan(0);
  });

  it.each(REDEEM_ERRORS)("canje: %s tiene mensaje", (code) => {
    expect(redeemErrorMessage(code).trim().length).toBeGreaterThan(0);
  });

  it("el mensaje de error inesperado no está vacío", () => {
    expect(UNEXPECTED_ERROR_MESSAGE.trim().length).toBeGreaterThan(0);
  });

  it("no filtra el código técnico al usuario", () => {
    expect(checkInErrorMessage("qr_invalid")).not.toContain("qr_invalid");
  });
});
