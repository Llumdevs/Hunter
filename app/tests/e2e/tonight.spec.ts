import { expect, test } from "@playwright/test";
import { createProfile, logIn, uniqueEmail } from "./helpers";

async function signUpFromHome(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Empezar" }).click();
  await logIn(page, uniqueEmail());
  await createProfile(page, "2000-01-01");
  await expect(page).toHaveURL(/\/perfil\/gustos\?inicio=1/);
}

const pick = (page: import("@playwright/test").Page, label: string) =>
  page.locator("label", { has: page.getByText(label, { exact: true }) }).click();

test.describe("Esta noche", () => {
  test("con gustos de house para bailar, Sala Neón sale en «Para ti» con su motivo", async ({ page }) => {
    await signUpFromHome(page);
    await pick(page, "House");
    await pick(page, "Para bailar");
    await page.getByRole("button", { name: "Guardar mis gustos" }).click();

    await expect(page.getByRole("heading", { name: /Esta noche/ })).toBeVisible();
    const forYou = page.getByRole("region", { name: "Para ti" });
    const neon = forYou.getByRole("link", { name: /Sala Neón/ });
    await expect(neon).toContainText("Encaja con tu música y con el ambiente que buscas");
    await expect(forYou.getByRole("link", { name: /Jazz Cellar/ })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  });

  test("sin gustos se ven todos los locales y una invitación a elegirlos", async ({ page }) => {
    await signUpFromHome(page);
    await page.getByRole("link", { name: "Saltar por ahora" }).click();
    await expect(page.getByRole("heading", { name: "Abiertos esta noche" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Dinos qué te gusta/ })).toBeVisible();
    for (const name of ["Bar Demo", "El Patio", "Jazz Cellar", "La Terraza", "Sala Neón"]) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test("ficha → apuntarse → Mis planes → cancelar", async ({ page }) => {
    await signUpFromHome(page);
    await page.getByRole("link", { name: "Saltar por ahora" }).click();
    await page.getByRole("link", { name: /Jazz Cellar/ }).first().click();

    await expect(page.getByRole("heading", { name: "Jazz Cellar" })).toBeVisible();
    await expect(page.getByText("Edad del público según el local")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mesa garantizada" })).toBeVisible();
    await page.getByRole("button", { name: "Apuntarme a la prelista" }).click();
    await page.getByRole("link", { name: "✓ Apuntado · ver en Mis planes" }).click();

    await expect(page).toHaveURL(/\/planes$/);
    const plan = page.locator("article", { has: page.getByRole("link", { name: "Jazz Cellar" }) });
    await expect(plan.getByText("Apuntado", { exact: true })).toBeVisible();
    await plan.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Aún no te has apuntado a ningún sitio esta noche.")).toBeVisible();
  });

  test("el mapa lista todos los locales abiertos", async ({ page }) => {
    await signUpFromHome(page);
    await page.getByRole("link", { name: "Saltar por ahora" }).click();
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Mapa" }).click();
    await expect(page.getByRole("heading", { name: "Mapa" })).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveCount(5);
  });

  test("borrar la cuenta vuelve a la portada sin sesión", async ({ page }) => {
    await signUpFromHome(page);
    await page.getByRole("link", { name: "Saltar por ahora" }).click();
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Perfil" }).click();
    await page.getByRole("button", { name: "Borrar mi cuenta" }).click();
    await page.getByRole("button", { name: "Sí, borrar mi cuenta" }).click();
    await expect(page.getByRole("link", { name: "Empezar" })).toBeVisible();
    await page.goto("/planes");
    await expect(page).toHaveURL(/\/login/);
  });
});
