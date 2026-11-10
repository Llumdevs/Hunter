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
let mockCity: string | null = null;
let lastFeedback = "";
let mockRating: number | null = null;
let mockFriends: { id: string; name: string; status: string; incoming: boolean }[] = [];
const user = {
  id: "10000000-0000-0000-0000-000000000001",
  aud: "authenticated", role: "authenticated", email: "tester@example.com",
  app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString(),
};
const testPlaces = [
  { id: "30000000-0000-0000-0000-000000000001", name: "Sala de prueba", zone: "Ruzafa", kind: "club", lat: 39.46, lng: -0.37, price_level: "€€", music: "house", vibe: "bailar", opens_at: "00:00", closes_at: "00:00", age_band: null, age_source: "venue", signups_visible: null, signups_any: false, cover_path: null },
  { id: "30000000-0000-0000-0000-000000000002", name: "Jazz de prueba", zone: "El Carmen", kind: "bar", lat: 39.48, lng: -0.38, price_level: "€", music: "jazz", vibe: "hablar", opens_at: "00:00", closes_at: "00:00", age_band: null, age_source: "venue", signups_visible: null, signups_any: false, cover_path: null },
];

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
      res.end(JSON.stringify(existingProfile ? [{ id: user.id, display_name: "Prueba" }] : []));
    } else if (url.pathname === "/rest/v1/user_preferences") {
      res.end(JSON.stringify([{ music: ["house"], vibe: ["bailar"], price: [], age_bands: [] }]));
    } else if (url.pathname === "/rest/v1/rpc/tonight_places") {
      res.end(JSON.stringify(testPlaces));
    } else if (url.pathname === "/rest/v1/rpc/recommendation_settings") {
      res.end(JSON.stringify({ weight_music: 2, weight_vibe: 2, weight_age: 2, weight_price: 1, match_threshold: 0.6 }));
    } else if (url.pathname === "/rest/v1/offers") {
      res.end(JSON.stringify([{ place_id: testPlaces[1].id, title: "Oferta de prueba", days_of_week: [1, 2, 3, 4, 5, 6, 7] }]));
    } else if (url.pathname === "/rest/v1/organizer_members") {
      res.end("[]");
    } else if (url.pathname === "/rest/v1/rpc/my_pilot_profile") {
      res.end(JSON.stringify({ name: "Prueba", home_city: mockCity, age: 25, contact: user.email, friend_code: "0123456789abcdef", signups: 2, checkins: 1, reviews: mockRating === null ? 0 : 1, points: mockRating === null ? 10 : 15 }));
    } else if (url.pathname === "/rest/v1/rpc/update_my_city") {
      mockCity = body.p_city;
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/send_pilot_feedback") {
      lastFeedback = body.p_message;
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/my_friends") {
      res.end(JSON.stringify(mockFriends));
    } else if (url.pathname === "/rest/v1/rpc/request_friend") {
      mockFriends = [{ id: "60000000-0000-0000-0000-000000000001", name: "Ana", status: "pending", incoming: false }];
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/respond_friend") {
      mockFriends = body.p_accept ? mockFriends.map((f) => ({ ...f, status: "accepted" })) : [];
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/my_reviewable_visits") {
      res.end(JSON.stringify([{ id: "50000000-0000-0000-0000-000000000001", place_name: "Sala de prueba", night_date: "2026-11-10", rating: mockRating }]));
    } else if (url.pathname === "/rest/v1/rpc/review_visit") {
      if (mockRating !== null) res.end('{"ok":false,"error":"already_reviewed"}');
      else { mockRating = body.p_rating; res.end('{"ok":true}'); }
    } else {
      res.writeHead(404).end(JSON.stringify({ message: "Unexpected provider request" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(54331, "127.0.0.1", resolve));
});

test.afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });
test.beforeEach(() => { challenge = ""; callback = ""; existingProfile = false; deliveryError = false; guestDisabled = false; guestSignups = 0; mockCity = null; lastFeedback = ""; mockRating = null; mockFriends = []; });

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

test("los filtros son temporales y las tarjetas muestran el porcentaje de encaje", async ({ page }) => {
  existingProfile = true;
  await page.goto("/login");
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page.getByRole("heading", { name: /Esta noche/ })).toBeVisible();
  await expect(page.getByText("100 % para ti", { exact: true })).toBeVisible();
  await page.getByText("Filtrar esta noche", { exact: true }).click();
  await page.getByLabel("Música esta noche").selectOption("jazz");
  await expect(page.getByRole("link", { name: /Sala de prueba/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Jazz de prueba/ }).last()).toBeVisible();
  await page.getByLabel("Presupuesto esta noche").selectOption("€€€");
  await expect(page.getByText(/No hay locales que coincidan/)).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtros" }).click();
  await expect(page.getByText("100 % para ti", { exact: true })).toBeVisible();
});

test("el mapa permite seleccionar un local, ver su oferta y cerrar la tarjeta", async ({ page }) => {
  existingProfile = true;
  await page.goto("/login?next=%2Fmapa");
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page.getByRole("heading", { name: "Mapa", exact: true })).toBeVisible();
  const pin = page.getByRole("button", { name: "Jazz de prueba", exact: true });
  await pin.focus();
  await page.keyboard.press("Enter");
  const card = page.getByRole("region", { name: "Local seleccionado" });
  await expect(card.getByRole("heading", { name: "Jazz de prueba" })).toBeVisible();
  await expect(card.getByText("Oferta de prueba")).toBeVisible();
  await expect(card.getByRole("link", { name: "Ver el local" })).toHaveAttribute("href", `/local/${testPlaces[1].id}`);
  await card.getByRole("button", { name: "Cerrar local seleccionado" }).click();
  await expect(card).not.toBeVisible();
});

async function enterPilot(page: Page, destination: string) {
  existingProfile = true;
  await page.goto(`/login?next=${encodeURIComponent(destination)}`);
  await page.getByRole("button", { name: "Probar sin correo" }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:3100${destination}`);
}

test("el perfil guarda procedencia y feedback con confirmación", async ({ page }) => {
  await enterPilot(page, "/perfil");
  await page.getByLabel("¿De dónde eres? (opcional)").fill("Valencia");
  await page.getByRole("button", { name: "Guardar procedencia" }).click();
  await expect(page.getByRole("status")).toHaveText("Procedencia guardada.");
  await page.reload();
  await expect(page.getByLabel("¿De dónde eres? (opcional)")).toHaveValue("Valencia");
  await page.getByLabel("¿Qué cambiarías o qué echas en falta?").fill("Quiero compartir planes con mis amigos.");
  await page.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByRole("status")).toContainText("Hemos guardado tu opinión");
  expect(lastFeedback).toBe("Quiero compartir planes con mis amigos.");
});

test("se puede enviar y cancelar una solicitud de amistad", async ({ page }) => {
  await enterPilot(page, "/amigos");
  await page.getByLabel("Código de tu amigo").fill("abcdef0123456789");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByRole("heading", { name: "Ana", exact: true })).toBeVisible();
  await expect(page.getByText("Solicitud enviada · pendiente")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar solicitud" }).click();
  await expect(page.getByText(/Todavía no tienes amigos/)).toBeVisible();
});

test("el destinatario puede aceptar una solicitud y eliminar la amistad", async ({ page }) => {
  mockFriends = [{ id: "60000000-0000-0000-0000-000000000001", name: "Ana", status: "pending", incoming: true }];
  await enterPilot(page, "/amigos");
  await page.getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(page.getByText("Amistad aceptada")).toBeVisible();
  await page.getByRole("button", { name: "Eliminar amistad" }).click();
  await expect(page.getByText(/Todavía no tienes amigos/)).toBeVisible();
});

test("la valoración se guarda una sola vez y los puntos aparecen en el perfil", async ({ page }) => {
  await enterPilot(page, "/valoraciones");
  await page.getByLabel("Puntuación de Sala de prueba").selectOption("4");
  await page.getByLabel("Comentario (opcional)").fill("Buena música.");
  await page.getByRole("button", { name: "Guardar valoración" }).click();
  await expect(page.getByText("Tu valoración: 4 de 5 ★")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar valoración" })).toHaveCount(0);
  await page.goto("/perfil");
  await expect(page.locator("dt", { hasText: /^Puntos$/ }).locator("+ dd")).toHaveText("15");
});
