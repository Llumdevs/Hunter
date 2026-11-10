// Subida y borrado de fotos con la API real de Storage (el borrado no se puede probar en SQL).
import { execFileSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const DEMO_PLACE = "30000000-0000-0000-0000-0000000000d1";
// PNG de 1×1 píxel.
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function signedIn(): Promise<{ client: SupabaseClient; email: string }> {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const email = `it-${crypto.randomUUID()}@test.local`;
  const { error } = await client.auth.signUp({ email, password: crypto.randomUUID() });
  if (error) throw error;
  return { client, email };
}

describe("fotos de locales en Storage", () => {
  let staff: SupabaseClient;
  let stranger: SupabaseClient;
  const path = `${DEMO_PLACE}/${crypto.randomUUID()}.png`;

  beforeAll(async () => {
    const owner = await signedIn();
    execFileSync("scripts/grant-place-access.sh", [owner.email], { stdio: "pipe" });
    staff = owner.client;
    stranger = (await signedIn()).client;
  });

  it("el personal sube una foto a la carpeta de su local", async () => {
    const { error } = await staff.storage.from("place-photos").upload(path, PIXEL, { contentType: "image/png" });
    expect(error).toBeNull();
  });

  it("la foto es pública", async () => {
    const response = await fetch(staff.storage.from("place-photos").getPublicUrl(path).data.publicUrl);
    expect(response.status).toBe(200);
  });

  it("quien no es del local no puede subir a su carpeta", async () => {
    const { error } = await stranger.storage
      .from("place-photos")
      .upload(`${DEMO_PLACE}/${crypto.randomUUID()}.png`, PIXEL, { contentType: "image/png" });
    expect(error).not.toBeNull();
  });

  it("no se aceptan ficheros que no sean imágenes", async () => {
    const { error } = await staff.storage
      .from("place-photos")
      .upload(`${DEMO_PLACE}/${crypto.randomUUID()}.txt`, Buffer.from("hola"), { contentType: "text/plain" });
    expect(error).not.toBeNull();
  });

  it("quien no es del local no puede borrar la foto", async () => {
    const { data } = await stranger.storage.from("place-photos").remove([path]);
    expect(data).toEqual([]);
  });

  it("el personal puede borrar la foto", async () => {
    const { data, error } = await staff.storage.from("place-photos").remove([path]);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});
