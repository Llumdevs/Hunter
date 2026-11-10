import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

export const DEMO_QR = "/c/30000000-0000-0000-0000-0000000000d1?k=demo-token-0123456789abcdef";
export const NEAR_DEMO_BAR = { latitude: 39.46215, longitude: -0.3731 };
export const FAR_FROM_DEMO_BAR = { latitude: 39.4815, longitude: -0.3591 };

const MAILPIT = "http://127.0.0.1:54324/api/v1";
const OTP = /\b(\d{6})\b/;

export const uniqueEmail = () => `e2e-${crypto.randomUUID()}@test.local`;

type MailpitSearch = { messages: { ID: string }[] };
type MailpitMessage = { Text: string };

// Espera al correo con el código y lo devuelve.
export async function readOtpCode(email: string): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(async () => {
      const search = (await (await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`to:"${email}"`)}`)).json()) as MailpitSearch;
      const id = search.messages[0]?.ID;
      if (!id) return undefined;
      const message = (await (await fetch(`${MAILPIT}/message/${id}`)).json()) as MailpitMessage;
      code = OTP.exec(message.Text)?.[1];
      return code;
    }, { timeout: 15_000 })
    .toBeDefined();
  return code!;
}

export async function logIn(page: Page, email: string) {
  await page.getByLabel("Tu email").fill(email);
  await page.getByRole("button", { name: "Enviarme un código" }).click();
  await page.getByLabel("Código").fill(await readOtpCode(email));
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function createProfile(page: Page, birthdate: string) {
  await expect(page).toHaveURL(/\/perfil\/nuevo/);
  await page.getByLabel("Nombre").fill("Prueba E2E");
  await page.getByLabel(/Fecha de nacimiento/).fill(birthdate);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
}

// Desde el QR del bar de demostración hasta tener sesión y perfil de adulto.
export async function arriveAsNewAdult(page: Page) {
  await page.goto(DEMO_QR);
  await expect(page).toHaveURL(/\/login\?next=/);
  await logIn(page, uniqueEmail());
  await createProfile(page, "2000-01-01");
  await expect(page.getByRole("heading", { name: "Bar Demo" })).toBeVisible();
}

export const DEMO_PLACE_ID = "30000000-0000-0000-0000-0000000000d1";

// Alta completa empezando en cualquier ruta protegida; vuelve a esa ruta al terminar.
export async function signUpVia(page: Page, path: string, email = uniqueEmail()) {
  await page.goto(path);
  await logIn(page, email);
  await createProfile(page, "2000-01-01");
  return email;
}

// Da acceso al panel del bar de demostración (script solo de desarrollo).
export function grantDemoStaff(email: string) {
  execFileSync("scripts/grant-place-access.sh", [email], { stdio: "pipe" });
}

export const CHECKED_IN = "¡Ya estás dentro!";

// Arrastra el deslizador de canje hasta el final, como lo haría un dedo.
export async function slideToRedeem(page: Page, offerTitle: string) {
  const knob = page.getByRole("button", { name: `Desliza para canjear: ${offerTitle}` });
  const box = (await knob.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 400, y, { steps: 12 });
  await page.mouse.up();
}
