import { createServer, type Server } from "node:http";
import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

let server: Server;
let challenge = "";
let callback = "";
let existingProfile = false;
let deliveryError = false;
let guestDisabled = false;
let guestSignups = 0;
const user = {
  id: "10000000-0000-0000-0000-000000000001",
  aud: "authenticated", role: "authenticated", email: "tester@example.com",
  app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString(),
};

function session(anonymous = false) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const jwt = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: user.aud, role: user.role, is_anonymous: anonymous, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.test-signature`;
  return { access_token: jwt, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user: { ...user, is_anonymous: anonymous } };
}

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept-profile");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Supabase-Api-Version", "2024-01-01");
    res.setHeader("Access-Control-Expose-Headers", "X-Supabase-Api-Version");
    if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
    const url = new URL(req.url!, "http://127.0.0.1:54331");
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (url.pathname === "/auth/v1/signup") {
      if (guestDisabled) {
        res.writeHead(422).end(JSON.stringify({ code: "anonymous_provider_disabled", msg: "Anonymous sign-ins disabled" }));
      } else {
        guestSignups++;
        res.end(JSON.stringify(session(true)));
      }
    } else if (url.pathname === "/auth/v1/otp") {
      challenge = body.code_challenge;
      callback = url.searchParams.get("redirect_to")!;
      if (deliveryError) {
        res.writeHead(403).end(JSON.stringify({ code: "email_address_not_authorized", msg: "Email not authorized" }));
      } else res.end("{}");
    } else if (url.pathname === "/auth/v1/token") {
      const verified = createHash("sha256").update(body.code_verifier ?? "").digest("base64url") === challenge;
      if (body.auth_code !== "valid" || !verified) {
        res.writeHead(400).end(JSON.stringify({ code: "flow_state_not_found", msg: "Invalid code or verifier" }));
        return;
      }
      res.end(JSON.stringify(session()));
    } else if (url.pathname === "/auth/v1/user") {
      res.end(JSON.stringify(user));
    } else if (url.pathname === "/rest/v1/profiles") {
      res.end(JSON.stringify(existingProfile ? [{ id: user.id }] : []));
    } else {
      res.writeHead(404).end(JSON.stringify({ message: "Unexpected provider request" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(54331, "127.0.0.1", resolve));
});

test.afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });
test.beforeEach(() => { challenge = ""; callback = ""; existingProfile = false; deliveryError = false; guestDisabled = false; guestSignups = 0; });

async function requestLink(page: Page, next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Tu email").fill(user.email);
  await page.getByRole("button", { name: "Enviarme un enlace" }).click();
  await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
  expect(new URL(callback).pathname).toBe("/auth/callback");
  expect(new URL(callback).searchParams.get("next")).toBe(next);
  expect(challenge).not.toBe("");
}

test("el enlace crea cookies de sesión y abre el alta del perfil", async ({ page, context }) => {
  await requestLink(page, "/planes");
  await page.goto(`${callback}&code=valid`);
  await expect(page).toHaveURL(/\/perfil\/nuevo\?next=%2Fplanes/);
  await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name.includes("auth-token"))).toBe(true);
  await page.reload();
  await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
});

test("el usuario con perfil continúa al destino sin bucle", async ({ page }) => {
  existingProfile = true;
  await requestLink(page, "/privacidad");
  await page.goto(`${callback}&code=valid`);
  await expect(page).toHaveURL("http://127.0.0.1:3100/privacidad");
});

test("también admite el retorno al Site URL raíz", async ({ page }) => {
  await requestLink(page);
  await page.goto("/?code=valid");
  await expect(page).toHaveURL(/\/perfil\/nuevo/);
});

test("un enlace inválido muestra cómo recuperarse", async ({ page }) => {
  await page.goto("/auth/callback?code=invalid");
  await expect(page.getByText(/No hemos podido completar el acceso/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviarme un enlace" })).toBeEnabled();
});

test("un enlace caducado no termina silenciosamente en la portada", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied&error_code=otp_expired");
  await expect(page.getByText(/El enlace ha caducado/)).toBeVisible();
});

test("explica la restricción de correo en vez de fingir que se envió", async ({ page }) => {
  deliveryError = true;
  await page.goto("/login");
  await page.getByLabel("Tu email").fill(user.email);
  await page.getByRole("button", { name: "Enviarme un enlace" }).click();
  await expect(page.getByText(/habilitar los envíos/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revisa tu correo" })).not.toBeVisible();
});

test("un invitado entra sin enviar correo y conserva su sesión", async ({ page }) => {
  await page.goto("/login?next=%2Fplanes");
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page).toHaveURL(/\/perfil\/nuevo\?next=%2Fplanes/);
  await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
  expect(guestSignups).toBe(1);
  expect(challenge).toBe("");
  await page.goto("/login?next=%2Fplanes");
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page).toHaveURL(/\/perfil\/nuevo/);
  expect(guestSignups).toBe(1);
});

test("si Supabase no permite invitados, explica qué falta y permite reintentar", async ({ page }) => {
  guestDisabled = true;
  await page.goto("/login");
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page.getByText(/activar Anonymous Sign-ins/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Probar sin correo" })).toBeEnabled();
});
