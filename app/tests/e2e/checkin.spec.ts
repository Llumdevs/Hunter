import { expect, test } from "@playwright/test";
import { arriveAsNewAdult, CHECKED_IN, createProfile, DEMO_QR, FAR_FROM_DEMO_BAR, logIn, NEAR_DEMO_BAR, slideToRedeem, uniqueEmail } from "./helpers";

test.describe("check-in y canje en el bar de demostración", () => {
  test("cerca del local: check-in, canje y pantalla de canje", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation(NEAR_DEMO_BAR);
    await arriveAsNewAdult(page);

    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.getByRole("heading", { name: CHECKED_IN })).toBeVisible();
    await expect(page.getByText("Sin ubicación")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Tapa de bienvenida" })).toBeVisible();

    await slideToRedeem(page, "Tapa de bienvenida");

    await expect(page).toHaveURL(/\/canje\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Tapa de bienvenida" })).toBeVisible();
    await expect(page.getByText(/^Válido 1[45]:\d{2}$/)).toBeVisible();
    await expect(page.getByText(/^[0-9A-F]{3}-[0-9A-F]{3}$/)).toBeVisible();
    await expect(page.getByLabel("Hora actual")).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
    await page.screenshot({ path: "test-results/pantalla-canje.png" });

    // Volver al QR después de canjear lleva directamente a la pantalla de canje.
    const redemptionUrl = page.url();
    await page.goto(DEMO_QR);
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page).toHaveURL(redemptionUrl);
  });

  test("un toque sin arrastrar no canjea; con teclado sí se puede canjear", async ({ page }) => {
    await arriveAsNewAdult(page);
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    const slider = page.getByRole("button", { name: "Desliza para canjear: Tapa de bienvenida" });
    await slider.click();
    await expect(page).not.toHaveURL(/\/canje\//);
    await slider.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/canje\//);
  });

  test("sin permiso de ubicación: entra igualmente y se avisa", async ({ page }) => {
    await arriveAsNewAdult(page);
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.getByRole("heading", { name: CHECKED_IN })).toBeVisible();
    await expect(page.getByText("Sin ubicación: puedes canjear igualmente.")).toBeVisible();
  });

  test("lejos del local: se rechaza el check-in", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation(FAR_FROM_DEMO_BAR);
    await arriveAsNewAdult(page);
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Parece que no estás en el local. Acércate y vuelve a escanear.");
  });

  test("recargar tras el check-in permite seguir y canjear", async ({ page }) => {
    await arriveAsNewAdult(page);
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.getByRole("heading", { name: CHECKED_IN })).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.getByRole("heading", { name: CHECKED_IN })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desliza para canjear: Tapa de bienvenida" })).toBeVisible();
  });
});

test.describe("accesos no válidos", () => {
  test("un menor no puede crear su perfil", async ({ page }) => {
    await page.goto(DEMO_QR);
    await logIn(page, uniqueEmail());
    await createProfile(page, "2012-05-05");
    await expect(page.locator("main").getByRole("alert")).toHaveText("Hunter es solo para mayores de 18 años.");
    await expect(page).toHaveURL(/\/perfil\/nuevo/);
  });

  test("un QR con token manipulado se rechaza", async ({ page }) => {
    await arriveAsNewAdult(page);
    await page.goto(DEMO_QR.replace("demo-token", "fake-token"));
    await page.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Este QR no es válido. Pide al personal el QR actual del local.");
  });

  test("un enlace de QR mal formado muestra aviso sin pedir sesión", async ({ page }) => {
    await page.goto("/c/no-es-un-local?k=x");
    await expect(page.getByRole("heading", { name: "QR no válido" })).toBeVisible();
  });

  test("el login no redirige fuera de Hunter", async ({ page }) => {
    await page.goto("/login?next=https://evil.example");
    await logIn(page, uniqueEmail());
    await createProfile(page, "2000-01-01");
    await page.getByRole("link", { name: "Saltar por ahora" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3000/");
  });
});
