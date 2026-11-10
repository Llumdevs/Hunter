import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { arriveAsNewAdult, CHECKED_IN, DEMO_PLACE_ID, grantDemoStaff, NEAR_DEMO_BAR, signUpVia, slideToRedeem } from "./helpers";

const PANEL = `/panel/${DEMO_PLACE_ID}`;

async function customerPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    ...devices["Pixel 7"], locale: "es-ES", timezoneId: "Europe/Madrid",
    permissions: ["geolocation"], geolocation: NEAR_DEMO_BAR,
  });
  return context.newPage();
}

async function openStaffPanel(page: Page) {
  const email = await signUpVia(page, "/panel");
  await expect(page.getByRole("heading", { name: "Aún no tienes locales" })).toBeVisible();
  grantDemoStaff(email);
  await page.goto(PANEL);
  await expect(page.getByRole("heading", { name: "Bar Demo" })).toBeVisible();
}

const tonight = (page: Page, label: string) => page.getByTestId(`tonight-${label}`);

test.describe("panel del local", () => {
  test("las cifras de esta noche suben cuando un cliente hace check-in y canjea", async ({ page, browser }) => {
    await openStaffPanel(page);
    const before = Number(await tonight(page, "Canjes").textContent());
    const billableBefore = Number(await page.getByTestId("week-billable").textContent());

    const customer = await customerPage(browser);
    await arriveAsNewAdult(customer);
    await customer.getByRole("button", { name: "Hacer check-in" }).click();
    await slideToRedeem(customer, "Tapa de bienvenida");
    await expect(customer).toHaveURL(/\/canje\//);

    await page.reload();
    await expect(tonight(page, "Canjes")).toHaveText(String(before + 1));
    await expect(page.getByTestId("week-billable")).toHaveText(String(billableBefore + 1));
  });

  test("crear, pausar y reactivar una oferta se refleja en lo que ve el cliente", async ({ page, browser }) => {
    await openStaffPanel(page);
    const title = `Oferta E2E ${Date.now()}`;
    await page.getByRole("link", { name: "Nueva oferta" }).click();
    await page.getByLabel("Título").fill(title);
    await page.getByRole("button", { name: "Guardar oferta" }).click();
    await expect(page).toHaveURL(new RegExp(`${PANEL}$`));

    const customer = await customerPage(browser);
    await arriveAsNewAdult(customer);
    await customer.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(customer.getByRole("heading", { name: title })).toBeVisible();

    await page.getByRole("switch", { name: `Oferta activa: ${title}` }).click();
    await expect(page.getByRole("switch", { name: `Oferta activa: ${title}` })).toHaveAttribute("aria-checked", "false");
    await customer.reload();
    await customer.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(customer.getByRole("heading", { name: CHECKED_IN })).toBeVisible();
    await expect(customer.getByRole("heading", { name: title })).toHaveCount(0);

    await page.getByRole("switch", { name: `Oferta activa: ${title}` }).click();
    await expect(page.getByRole("switch", { name: `Oferta activa: ${title}` })).toHaveAttribute("aria-checked", "true");
  });

  test("una oferta sin días no se guarda", async ({ page }) => {
    await openStaffPanel(page);
    await page.getByRole("link", { name: "Nueva oferta" }).click();
    await page.getByLabel("Título").fill("Sin días");
    for (const day of ["L", "M", "X", "J", "V", "S", "D"]) {
      await page.locator("label", { has: page.getByLabel(`Día ${day}`) }).click();
      await expect(page.getByLabel(`Día ${day}`)).not.toBeChecked();
    }
    await page.getByRole("button", { name: "Guardar oferta" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Elige al menos un día.");
  });

  test("el QR fijo apunta al check-in del local", async ({ page }) => {
    await openStaffPanel(page);
    await page.getByRole("link", { name: "Mi QR para imprimir" }).click();
    await expect(page.getByLabel("QR fijo del local")).toHaveAttribute(
      "data-qr-url", `http://127.0.0.1:3000/c/${DEMO_PLACE_ID}?k=demo-token-0123456789abcdef`,
    );
  });

  test("el QR de pantalla permite hacer check-in y cambia cada 30 s", async ({ page, browser }) => {
    await page.clock.install();
    await openStaffPanel(page);
    await page.goto(`${PANEL}/pantalla`);
    const qr = page.getByLabel("QR de pantalla del local");
    const firstUrl = await qr.getAttribute("data-qr-url");
    expect(firstUrl).toMatch(new RegExp(`/c/${DEMO_PLACE_ID}\\?t=[0-9a-f]{8}$`));

    await page.clock.runFor(30_000);
    await expect(qr).not.toHaveAttribute("data-qr-url", firstUrl!);

    const customer = await customerPage(browser);
    await arriveAsNewAdult(customer);
    await customer.goto((await qr.getAttribute("data-qr-url"))!.replace("http://127.0.0.1:3000", ""));
    await customer.getByRole("button", { name: "Hacer check-in" }).click();
    await expect(customer.getByRole("heading", { name: CHECKED_IN })).toBeVisible();
  });

  test("quien no es del local no puede ver su panel", async ({ page }) => {
    await signUpVia(page, PANEL);
    await expect(page.getByRole("heading", { name: "No tienes acceso a este local" })).toBeVisible();
    await page.goto(`${PANEL}/pantalla`);
    await expect(page.getByRole("heading", { name: "No tienes acceso a este local" })).toBeVisible();
  });
});
