import { describe, expect, it } from "vitest";
import { computeScreenCode, msUntilNextStep, screenStep } from "./screen-code";

// Vectores calculados con Python (hmac/sha256) y verificados también en pgTAP (app.screen_code).
const SECRET_1_HEX = Buffer.from("secret-1").toString("hex");

describe("computeScreenCode", () => {
  it("coincide con el vector de referencia 1", async () => {
    await expect(computeScreenCode(SECRET_1_HEX, 59012345)).resolves.toBe("43dd8124");
  });

  it("coincide con el vector de referencia 2", async () => {
    await expect(computeScreenCode(SECRET_1_HEX, 0)).resolves.toBe("da70af9b");
  });

  it("conserva los ceros a la izquierda de cada byte (vector con 0x05)", async () => {
    await expect(computeScreenCode(SECRET_1_HEX, 14)).resolves.toBe("93600592");
  });

  it.each([
    ["longitud impar", "abc"],
    ["caracteres no hexadecimales", "zz"],
    ["vacío", ""],
  ])("rechaza un secreto con %s", async (_label, secret) => {
    await expect(computeScreenCode(secret, 1)).rejects.toThrow("invalid_secret");
  });
});

describe("screenStep", () => {
  it("es el número de periodos de 30 s desde 1970", () => {
    expect(screenStep(new Date("2026-11-14T00:30:00Z"))).toBe(59820540);
  });

  it("cambia justo al empezar un nuevo periodo", () => {
    expect(screenStep(new Date("2026-11-14T00:30:29.999Z"))).toBe(59820540);
    expect(screenStep(new Date("2026-11-14T00:30:30Z"))).toBe(59820541);
  });
});

describe("msUntilNextStep", () => {
  it("cuenta lo que falta para el siguiente periodo", () => {
    expect(msUntilNextStep(new Date("2026-11-14T00:30:10Z"))).toBe(20_000);
  });

  it("en el límite exacto falta un periodo entero", () => {
    expect(msUntilNextStep(new Date("2026-11-14T00:30:00Z"))).toBe(30_000);
  });
});
