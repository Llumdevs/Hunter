import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./login-errors";

describe("errores de acceso", () => {
  it("explica el requisito del acceso de invitado", () => {
    expect(loginErrorMessage("anonymous_provider_disabled")).toContain("Anonymous Sign-ins");
  });
  it("explica la restricción de destinatarios de Supabase", () => {
    expect(loginErrorMessage("email_address_not_authorized")).toContain("habilitar los envíos");
  });
  it("permite recuperarse de límites de envío y enlaces caducados", () => {
    expect(loginErrorMessage("over_email_send_rate_limit")).toContain("Espera");
    expect(loginErrorMessage("otp_expired")).toContain("Solicita uno nuevo");
  });
  it("no refleja errores desconocidos del proveedor", () => {
    expect(loginErrorMessage("untrusted-provider-error")).not.toContain("untrusted");
  });
});
