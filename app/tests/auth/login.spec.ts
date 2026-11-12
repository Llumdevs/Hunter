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
let referralClaimed = false;
let rankAlias: string | null = null;
let rankOptin = false;
let purchaseCancelled = false;
let purchaseRecorded = false;
const purchaseToken = "ab".repeat(32);
const purchaseId = "71000000-0000-4000-8000-000000000001";
const rewardRules = { purchase_points: 10, daily_purchase_limit: 3, referral_points: 20, monthly_referral_limit: 5, token_ttl_seconds: 300, timezone: "Europe/Madrid", prize: { title: "Dos entradas · Ejemplo", description: "Premio ficticio, sin patrocinador." } };
let emptyPlaces = false;
let demoVenueCreated = false;
let venueAdmin = false;
const demoVenueId = "70000000-0000-4000-8000-000000000001";
const demoOrganizerId = "70000000-0000-4000-8000-000000000002";
let demoVenueOffers = [{ id: "70000000-0000-4000-8000-000000000003", place_id: demoVenueId, title: "Tapa de bienvenida · Demo", description: "Oferta de ejemplo", includes_alcohol: false, days_of_week: [1, 2, 3, 4, 5, 6, 7], valid_until_time: null as string | null, is_active: true }];
type MockApplication = { id: string; applicant_id: string; details: Record<string, unknown>; status: string; created_at: string; decision_note: string; place_id: string | null };
let venueApplications: MockApplication[] = [];
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
      res.end(JSON.stringify(emptyPlaces ? [] : testPlaces));
    } else if (url.pathname === "/rest/v1/rpc/recommendation_settings") {
      res.end(JSON.stringify({ weight_music: 2, weight_vibe: 2, weight_age: 2, weight_price: 1, match_threshold: 0.6 }));
    } else if (url.pathname === "/rest/v1/offers") {
      if (req.method === "POST") {
        demoVenueOffers.push({ ...body, id: "70000000-0000-4000-8000-000000000004", is_active: true });
        res.writeHead(201).end();
      } else if (req.method === "PATCH") {
        demoVenueOffers = demoVenueOffers.map((offer) => `eq.${offer.id}` === url.searchParams.get("id") ? { ...offer, ...body } : offer);
        res.writeHead(204).end();
      } else if (url.searchParams.get("place_id") === `eq.${demoVenueId}`) {
        res.end(JSON.stringify(demoVenueOffers.filter((offer) => !url.searchParams.has("id") || `eq.${offer.id}` === url.searchParams.get("id"))));
      } else res.end(JSON.stringify([{ id: "test-offer", place_id: testPlaces[1].id, title: "Oferta de prueba", days_of_week: [1, 2, 3, 4, 5, 6, 7] }]));
    } else if (url.pathname === "/rest/v1/organizer_members") {
      res.end(JSON.stringify(demoVenueCreated ? [{ organizer_id: demoOrganizerId }] : []));
    } else if (url.pathname === "/rest/v1/places") {
      res.end(JSON.stringify(demoVenueCreated ? [{ id: demoVenueId, name: "Mi local de prueba · Demo", zone: "Ruzafa", organizer_id: demoOrganizerId, is_active: false, is_demo: true, cities: { timezone: "Europe/Madrid" } }] : []));
    } else if (url.pathname === "/rest/v1/venue_applications") {
      res.end(JSON.stringify(venueApplications.filter((application) => !url.searchParams.has("status") || `eq.${application.status}` === url.searchParams.get("status"))));
    } else if (url.pathname === "/rest/v1/rpc/venue_management_context") {
      res.end(JSON.stringify({ is_admin: venueAdmin, approvals_enabled: venueAdmin, demo_place_id: demoVenueCreated ? demoVenueId : null }));
    } else if (url.pathname === "/rest/v1/rpc/create_my_demo_venue") {
      demoVenueCreated = true;
      res.end(JSON.stringify({ ok: true, place_id: demoVenueId }));
    } else if (url.pathname === "/rest/v1/rpc/place_nightly_stats") {
      res.end("[]");
    } else if (url.pathname === "/rest/v1/rpc/place_qr_credentials") {
      res.end(JSON.stringify([{ static_token: "test-only-demo-qr", screen_secret: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff" }]));
    } else if (url.pathname === "/rest/v1/rpc/submit_venue_application") {
      const id = "80000000-0000-4000-8000-000000000001";
      venueApplications.push({ id, applicant_id: user.id, details: body.p_details, status: "pending", created_at: new Date().toISOString(), decision_note: "", place_id: null });
      res.end(JSON.stringify({ ok: true, application_id: id }));
    } else if (url.pathname === "/rest/v1/rpc/cancel_venue_application") {
      venueApplications = venueApplications.map((application) => application.id === body.p_id ? { ...application, status: "cancelled" } : application);
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/review_venue_application") {
      if (!venueAdmin) res.end('{"ok":false,"error":"forbidden"}');
      else {
        venueApplications = venueApplications.map((application) => application.id === body.p_id ? { ...application, status: body.p_approve ? "approved" : "rejected", decision_note: body.p_note, place_id: body.p_approve ? "90000000-0000-4000-8000-000000000001" : null } : application);
        res.end('{"ok":true}');
      }
    } else if (url.pathname === "/rest/v1/rpc/my_pilot_profile") {
      res.end(JSON.stringify({ name: "Prueba", home_city: mockCity, age: 25, contact: user.email, friend_code: "0123456789abcdef", signups: 2, checkins: 1, reviews: mockRating === null ? 0 : 1, points: 0, legacy_points: mockRating === null ? 10 : 15 }));
    } else if (url.pathname === "/rest/v1/rpc/update_my_city") {
      mockCity = body.p_city;
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/send_pilot_feedback") {
      lastFeedback = body.p_message;
      res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/my_referrals") {
      res.end(JSON.stringify({ code: "0123456789abcdef", has_inviter: referralClaimed, can_claim: !referralClaimed, invited_count: 0, rewarded_count: 0, monthly_referral_points: 0, rules: rewardRules }));
    } else if (url.pathname === "/rest/v1/rpc/claim_referral") {
      referralClaimed = true; res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/monthly_ranking") {
      res.end(JSON.stringify({ month: body.p_month ?? new Date().toISOString().slice(0,7)+"-01", entries: [], me: { points: 0, purchase_points: 0, referral_points: 0, alias: rankAlias, participating: rankOptin }, rules: rewardRules }));
    } else if (url.pathname === "/rest/v1/rpc/set_ranking_participation") {
      rankAlias = body.p_alias; rankOptin = body.p_participating; res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/purchase_venues") {
      res.end(JSON.stringify([{ id: demoVenueId, name: "Mi local de prueba · Demo", zone: "Ruzafa", is_demo: true }]));
    } else if (url.pathname === "/rest/v1/rpc/create_purchase_request") {
      res.end(JSON.stringify({ ok: true, token: purchaseToken, place_id: demoVenueId, expires_at: new Date(Date.now()+300000).toISOString(), is_demo: true }));
    } else if (url.pathname === "/rest/v1/rpc/inspect_purchase_request") {
      res.end(JSON.stringify({ ok: true, expires_at: new Date(Date.now()+300000).toISOString() }));
    } else if (url.pathname === "/rest/v1/rpc/validate_purchase") {
      purchaseRecorded = true; res.end(JSON.stringify({ ok: true, purchase_id: purchaseId, purchase_points: 0, is_demo: true, cancelled: purchaseCancelled }));
    } else if (url.pathname === "/rest/v1/rpc/cancel_validated_purchase") {
      purchaseCancelled = true; res.end('{"ok":true}');
    } else if (url.pathname === "/rest/v1/rpc/place_purchase_history") {
      res.end(JSON.stringify(purchaseRecorded ? [{ id: purchaseId, validated_at: new Date().toISOString(), is_demo: true, cancelled: purchaseCancelled, cancellation_reason: purchaseCancelled ? "Ticket devuelto" : null }] : []));
    } else if (url.pathname === "/rest/v1/rpc/my_purchase_history") {
      res.end(JSON.stringify(purchaseRecorded ? [{ id: purchaseId, place_name: "Mi local de prueba · Demo", validated_at: new Date().toISOString(), is_demo: true, cancelled: purchaseCancelled, points: 0 }] : []));
    } else if (url.pathname === "/rest/v1/rpc/my_reviewable_visits") {
      res.end(JSON.stringify([{ id: "50000000-0000-0000-0000-000000000001", place_name: "Sala de prueba", night_date: "2026-11-10", rating: mockRating }]));
    } else if (url.pathname === "/rest/v1/rpc/review_visit") {
      if (mockRating !== null) res.end('{"ok":false,"error":"already_reviewed"}');
      else { mockRating = body.p_rating; res.end('{"ok":true}'); }
    } else if (url.pathname === "/auth/v1/logout") {
      res.end("{}");
    } else {
      res.writeHead(404).end(JSON.stringify({ message: "Unexpected provider request" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(54331, "127.0.0.1", resolve));
});

test.afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });
test.beforeEach(async ({ context }) => {
  challenge = ""; callback = ""; existingProfile = false; deliveryError = false; guestDisabled = false; guestSignups = 0; mockCity = null; lastFeedback = ""; mockRating = null; referralClaimed = false; rankAlias = null; rankOptin = false; purchaseCancelled = false; purchaseRecorded = false; emptyPlaces = false;
  demoVenueCreated = false; venueAdmin = false; venueApplications = [];
  demoVenueOffers = [{ id: "70000000-0000-4000-8000-000000000003", place_id: demoVenueId, title: "Tapa de bienvenida · Demo", description: "Oferta de ejemplo", includes_alcohol: false, days_of_week: [1, 2, 3, 4, 5, 6, 7], valid_until_time: null, is_active: true }];
  // Leaflet es real; solo se aíslan las imágenes externas del callejero.
  await context.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") }));
});

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
  await card.getByRole("link", { name: "Ver el local" }).click({ trial: true });
  await page.screenshot({ path: test.info().outputPath("mapa-movil.png") });
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

test("la ruta antigua abre códigos sin solicitudes ni red social", async ({ page }) => {
  await enterPilot(page, "/amigos");
  await expect(page).toHaveURL(/\/invitaciones$/);
  await expect(page.getByRole("heading", { name: "Invita con tu código" })).toBeVisible();
  await page.getByLabel("Código de quien te invitó").fill("abcdef0123456789");
  await page.getByRole("button", { name: "Asociar invitación" }).click();
  await expect(page.getByRole("status")).toContainText("primera compra validada");
  await expect(page.getByText("Ya tienes una invitación asociada.")).toBeVisible();
  await expect(page.getByRole("button", { name: /solicitud/ })).toHaveCount(0);
});

test("la valoración se guarda una sola vez sin sumar puntos nuevos", async ({ page }) => {
  await enterPilot(page, "/valoraciones");
  await page.getByLabel("Puntuación de Sala de prueba").selectOption("4");
  await page.getByLabel("Comentario (opcional)").fill("Buena música.");
  await page.getByRole("button", { name: "Guardar valoración" }).click();
  await expect(page.getByText("Tu valoración: 4 de 5 ★")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar valoración" })).toHaveCount(0);
  await page.goto("/perfil");
  await expect(page.locator("dt", { hasText: /^Puntos$/ }).locator("+ dd")).toHaveText("0");
});

test("la barra tiene cinco accesos y el menú lateral permite abrir perfil y cerrar con Escape", async ({ page }) => {
  await enterPilot(page, "/mapa");
  const navigation = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(navigation.getByRole("link")).toHaveCount(5);
  await expect(navigation.getByRole("link", { name: "Perfil", exact: true })).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Abrir menú" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Tu Hunter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salir", exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("menu-lateral.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("link", { name: "Mi perfil", exact: true }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("el mapa pide la ubicación al entrar y ofrece controles de zoom", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 39.467, longitude: -0.373 });
  await enterPilot(page, "/mapa");
  await expect(page.getByRole("region", { name: "Mapa interactivo de locales" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Centrar en mi ubicación" })).toBeVisible();
  await page.getByRole("button", { name: "Acercar", exact: true }).click();
  await page.getByRole("button", { name: "Alejar", exact: true }).click();
  await page.getByRole("button", { name: "Ver todos los locales" }).click();
  await expect(page.getByRole("button", { name: "Jazz de prueba", exact: true })).toBeVisible();
});

test("sin permiso de ubicación se puede seguir seleccionando locales", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code: 1 }) } }));
  await enterPilot(page, "/mapa");
  await expect(page.getByText(/No tenemos acceso a tu ubicación/)).toBeVisible();
  await page.getByRole("button", { name: "Jazz de prueba", exact: true }).click();
  await expect(page.getByRole("region", { name: "Local seleccionado" })).toBeVisible();
});

test("con base vacía hay eventos demo, planes persistentes y check-in simulado", async ({ page }) => {
  emptyPlaces = true;
  await enterPilot(page, "/");
  const events = page.getByRole("region", { name: "Eventos simulados" });
  await expect(events.getByRole("link")).toHaveCount(4);
  await events.getByRole("link", { name: /House en Ruzafa/ }).click();
  await expect(page.getByRole("heading", { name: "Sala Neón · Demo" })).toBeVisible();
  await page.getByRole("button", { name: "Apuntarme a este plan demo" }).click();
  await page.getByRole("link", { name: /Plan demo guardado/ }).click();
  const plans = page.getByRole("region", { name: "Planes demo" });
  await expect(plans.getByRole("link", { name: "House en Ruzafa" })).toBeVisible();
  await page.reload();
  await plans.getByRole("button", { name: "Simular check-in" }).click();
  await plans.getByLabel("Valorar House en Ruzafa").selectOption("4");
  await expect(plans.getByText(/Tu valoración demo: 4/)).toBeVisible();
  await plans.getByRole("button", { name: "Simular compra validada" }).click();
  await page.goto("/demo");
  await expect(page.getByText(/Puntos demo: 10/)).toBeVisible();
  await page.getByRole("button", { name: "Reiniciar datos demo" }).click();
  await expect(page.getByText(/Puntos demo: 0/)).toBeVisible();
});

test("cerrar sesión desde el menú vuelve a la portada", async ({ page }) => {
  await enterPilot(page, "/perfil");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await expect(page.getByRole("link", { name: "Empezar", exact: true })).toBeVisible();
});

test("si el callejero falla sigue disponible un mapa sin calles con selección", async ({ page, context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await enterPilot(page, "/mapa");
  await page.getByRole("button", { name: "Ver mapa sin calles" }).click();
  await page.getByRole("button", { name: "Jazz de prueba", exact: true }).click();
  await expect(page.getByRole("region", { name: "Local seleccionado" }).getByRole("heading", { name: "Jazz de prueba" })).toBeVisible();
});

test("las tarjetas siguen desplazándose sin mostrar la barra horizontal", async ({ page }) => {
  emptyPlaces = true;
  await enterPilot(page, "/");
  const carousel = page.getByRole("group", { name: "Locales de También te puede gustar" });
  expect(await carousel.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await carousel.evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe("none");
  await carousel.hover();
  await page.mouse.wheel(400, 0);
  await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("tocar un punto del minimapa de inicio abre Mapa y no la ficha del local", async ({ page }) => {
  await enterPilot(page, "/");
  const preview = page.getByRole("link", { name: "Abrir mapa de esta noche" });
  await expect(preview.locator("a")).toHaveCount(0);
  await preview.locator("circle").first().click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/mapa");
  await expect(page.getByRole("region", { name: "Mapa interactivo de locales" })).toBeVisible();
});

test("los locales tienen una entrada propia con acceso al panel y al alta", async ({ page }) => {
  await page.goto("/locales");
  await expect(page.getByRole("heading", { name: "Tu local, en los planes de esta noche." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar en mi panel", exact: true })).toHaveAttribute("href", "/panel");
  await expect(page.getByRole("link", { name: "Solicitar el alta de mi local" })).toHaveAttribute("href", "/panel/solicitar-alta");
});

test("un usuario crea su local demo, edita ofertas y tiene sus QR sin ser admin", async ({ page }) => {
  await enterPilot(page, "/panel");
  await expect(page.getByRole("link", { name: "Revisar solicitudes de locales" })).toHaveCount(0);
  await page.getByRole("button", { name: "Crear mi local demo" }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:3100/panel/${demoVenueId}`);
  await expect(page.getByText("Local demo personal.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tonight-Check-ins")).toHaveText("0");
  await page.screenshot({ path: test.info().outputPath("panel-demo.png"), fullPage: true });
  const toggle = page.getByRole("switch", { name: "Oferta activa: Tapa de bienvenida · Demo" });
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.getByRole("link", { name: "Tapa de bienvenida · Demo", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Oferta editada de prueba");
  await page.getByRole("button", { name: "Guardar oferta", exact: true }).click();
  await expect(page.getByRole("link", { name: "Oferta editada de prueba", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Mi QR para imprimir" }).click();
  await expect(page.getByLabel("QR fijo del local")).toHaveAttribute("data-qr-url", new RegExp(`/c/${demoVenueId}`));
  await expect(page.getByText("Local demo personal.", { exact: true })).toBeVisible();
});

test("la solicitud de alta queda pendiente y el propietario puede cancelarla", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await enterPilot(page, "/panel/solicitar-alta");
  await page.getByLabel("Nombre del local").fill("Mi bar de prueba");
  await page.getByLabel("Barrio / zona").fill("Ruzafa");
  await page.getByLabel("Dirección en Valencia").fill("Calle de prueba 12");
  await page.getByLabel("Email o teléfono de contacto").fill("local@example.com");
  await page.getByLabel("Latitud", { exact: true }).fill("39.46");
  await page.getByLabel("Longitud", { exact: true }).fill("-0.37");
  await page.getByRole("checkbox", { name: /Confirmo que estoy autorizado/ }).check();
  await page.getByRole("button", { name: "Enviar solicitud de alta", exact: true }).click();
  await expect(page).toHaveURL(/\/panel\?alta=enviada$/);
  await expect(page.getByRole("heading", { name: "Mi bar de prueba", exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente de revisión", { exact: true })).toBeVisible();
  expect(venueApplications[0].status).toBe("pending");
  await page.getByRole("button", { name: "Cancelar solicitud de alta" }).click();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("una cuenta de prueba no puede entrar en la revisión de altas", async ({ page }) => {
  await enterPilot(page, "/panel/admin");
  await expect(page.getByRole("heading", { name: "Acceso reservado" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar decisión" })).toHaveCount(0);
});

test("el flujo preparado de revisión exige confirmar antes de publicar", async ({ page }) => {
  // Rol simulado solo en este test; la migración no asigna ningún administrador real.
  venueAdmin = true;
  venueApplications = [{ id: "80000000-0000-4000-8000-000000000001", applicant_id: user.id,
    details: { name: "Bar pendiente", zone: "Ruzafa", address: "Calle de prueba 12", contact: "local@example.com", kind: "bar", price: "€€", lat: 39.46, lng: -0.37, days: [1, 5, 6], opens_at: "20:00", closes_at: "03:00" }, status: "pending", created_at: new Date().toISOString(), decision_note: "", place_id: null }];
  await enterPilot(page, "/panel/admin");
  await page.getByRole("button", { name: "Confirmar decisión" }).click();
  await expect(page.getByText("Confirma que has revisado el local antes de publicarlo.", { exact: true })).toBeVisible();
  expect(venueApplications[0].status).toBe("pending");
  await page.getByRole("checkbox", { name: /He revisado la información/ }).check();
  await page.getByRole("button", { name: "Confirmar decisión" }).click();
  await expect(page.getByText("No hay solicitudes pendientes.")).toBeVisible();
});

test("el cliente genera un QR temporal de compra para su local", async ({ page }) => {
  await enterPilot(page, "/compras");
  await page.getByRole("button", { name: "Generar mi QR de compra" }).click();
  await expect(page.getByLabel("QR de compra para el personal")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Válido durante");
  await page.getByText("Código para copiar al personal", { exact: true }).click();
  await expect(page.locator("code")).toHaveText(`HUNTER:PURCHASE:${demoVenueId}:${purchaseToken}`);
});

test("el personal valida y anula una compra demo con confirmación de pago", async ({ page }) => {
  demoVenueCreated = true;
  await enterPilot(page, `/panel/${demoVenueId}/compras`);
  await page.getByLabel("QR o código de compra del cliente").fill("QR-CHECKIN-INVALIDO");
  await page.getByRole("button", { name: "Comprobar QR de compra" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("no es un QR de compra");
  await page.getByLabel("QR o código de compra del cliente").fill(`HUNTER:PURCHASE:${demoVenueId}:${purchaseToken}`);
  await page.getByRole("button", { name: "Comprobar QR de compra" }).click();
  await page.getByLabel("Referencia del ticket").fill("DEMO-001");
  await page.getByRole("button", { name: "Confirmar compra pagada" }).click();
  expect(purchaseRecorded).toBe(false);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar compra pagada" }).click();
  await expect(page.getByRole("status")).toContainText("Compra demo registrada");
  await page.getByRole("button", { name: "Anular esta compra" }).click();
  await page.getByLabel("Motivo de anulación").fill("Ticket devuelto");
  await page.getByRole("button", { name: "Confirmar anulación" }).click();
  await expect(page.getByRole("status")).toContainText("Compra anulada");
  await expect(page.getByText("Anulada", { exact: true })).toBeVisible();
  await page.goto("/compras");
  await expect(page.getByText("Demo · Anulada · sin puntos")).toBeVisible();
});

test("el ranking exige participar con alias y separa el ejemplo ficticio", async ({ page }) => {
  await enterPilot(page, "/ranking");
  await expect(page.getByText("Tus puntos del mes")).toBeVisible();
  await page.getByLabel("Alias público del ranking").fill("Luz Piloto");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Guardar participación" }).click();
  await expect(page.getByRole("status")).toContainText("Participación guardada");
  await page.getByRole("button", { name: "Ver ejemplo ficticio del ranking" }).click();
  await expect(page.getByText("Solo demo · No son usuarios ni puntos reales")).toBeVisible();
  await page.getByRole("checkbox").uncheck();
  await page.getByRole("button", { name: "Guardar participación" }).click();
  await expect(page.getByRole("status")).toContainText("Tus puntos se conservan");
});

test("la búsqueda y las categorías filtran los eventos fotográficos", async ({ page }) => {
  emptyPlaces = true;
  await enterPilot(page, "/");
  const events = page.getByRole("region", { name: "Eventos simulados" });
  await expect(events.getByRole("link")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Buscar un evento o local" }).fill("ruzafa");
  await expect(events.getByRole("link")).toHaveCount(1);
  await expect(events.getByRole("heading", { name: "House en Ruzafa" })).toBeVisible();
  await page.getByRole("searchbox").fill("media luz");
  await expect(events.getByRole("heading", { name: "Jazz a media luz" })).toBeVisible();
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "En directo", exact: true }).click();
  await expect(events.getByRole("link")).toHaveCount(1);
  await expect(events.getByRole("heading", { name: "Jazz a media luz" })).toBeVisible();
  await page.getByRole("button", { name: "Todo", exact: true }).click();
  await page.locator("img").evaluateAll(async (images) => { await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => {}))); });
  await page.screenshot({ path: test.info().outputPath("inicio-editorial.png"), style: "nextjs-portal { display: none !important; }" });
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("la introducción permite cambiar de paso y continúa al acceso", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /2\. Haz/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Haz que la noche sea tuya");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: /3\. Nos/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tabpanel")).toContainText("Encuentra tu frecuencia");
  await page.locator("img").evaluateAll(async (images) => { await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => {}))); });
  await page.screenshot({ path: test.info().outputPath("portada-editorial.png"), style: "nextjs-portal { display: none !important; }" });
  await page.getByRole("link", { name: "Empezar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Entra en Hunter" })).toBeVisible();
});

test("la ficha ofrece galería ampliable y conserva la acción de apuntarse", async ({ page }) => {
  emptyPlaces = true;
  await enterPilot(page, "/local/d0000000-0000-4000-8000-000000000002");
  await expect(page.getByRole("heading", { name: "Jazz Cellar · Demo" })).toBeVisible();
  await page.getByRole("button", { name: "Ampliar foto 2", exact: true }).click();
  const gallery = page.getByRole("dialog", { name: "Galería de fotos" });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByText("2 / 4")).toBeVisible();
  await gallery.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(gallery.getByText("3 / 4")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(gallery).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("img").evaluateAll(async (images) => { await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => {}))); });
  await page.screenshot({ path: test.info().outputPath("ficha-editorial.png"), style: "nextjs-portal { display: none !important; }" });
  await page.getByRole("button", { name: "Apuntarme a este plan demo" }).click();
  await expect(page.getByRole("link", { name: /Plan demo guardado/ })).toBeVisible();
});
