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
let emptyPlaces = false;
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
  challenge = ""; callback = ""; existingProfile = false; deliveryError = false; guestDisabled = false; guestSignups = 0; mockCity = null; lastFeedback = ""; mockRating = null; mockFriends = []; emptyPlaces = false;
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

test("se puede enviar y cancelar una solicitud de amistad", async ({ page }) => {
  await enterPilot(page, "/amigos");
  await page.getByLabel("Código de tu amigo").fill("abcdef0123456789");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByRole("heading", { name: "Ana", exact: true })).toBeVisible();
  await expect(page.getByText("Solicitud enviada · pendiente")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar solicitud", exact: true }).click();
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
  await page.goto("/demo");
  await expect(page.getByText(/Puntos demo: 15/)).toBeVisible();
  await page.getByRole("button", { name: "Reiniciar datos demo" }).click();
  await expect(page.getByText(/Puntos demo: 0/)).toBeVisible();
});

test("los amigos simulados se pueden aceptar y restaurar sin cambiar amigos reales", async ({ page }) => {
  await enterPilot(page, "/amigos");
  const demos = page.getByRole("region", { name: "Amigos simulados" });
  await demos.getByRole("button", { name: "Aceptar solicitud demo" }).click();
  await expect(demos.getByText("Amistad simulada")).toHaveCount(2);
  await page.reload();
  await expect(demos.getByText("Amistad simulada")).toHaveCount(2);
  expect(mockFriends).toEqual([]);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reiniciar datos demo" }).click();
  await page.goto("/amigos");
  await expect(demos.getByRole("button", { name: "Aceptar solicitud demo" })).toBeVisible();
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
