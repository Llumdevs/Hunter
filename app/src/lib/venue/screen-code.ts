// Código del QR de pantalla, idéntico a app.screen_code en la base de datos:
// 8 primeros caracteres hex de HMAC-SHA256(secreto, número de paso en texto).

export const SCREEN_STEP_SECONDS = 30;
const MS_PER_SECOND = 1000;
const STEP_MS = SCREEN_STEP_SECONDS * MS_PER_SECOND;
const CODE_LENGTH = 8;
const HEX = /^(?:[0-9a-f]{2})+$/;

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (!HEX.test(hex)) throw new Error("invalid_secret");
  return Uint8Array.from(hex.match(/../g)!, (pair) => Number.parseInt(pair, 16));
}

const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

export async function computeScreenCode(secretHex: string, step: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", hexToBytes(secretHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(step)));
  return toHex(signature).slice(0, CODE_LENGTH);
}

export const screenStep = (now: Date): number => Math.floor(now.getTime() / STEP_MS);

export const msUntilNextStep = (now: Date): number => STEP_MS - (now.getTime() % STEP_MS);
