import { defineConfig, devices } from "@playwright/test";

// Contrato de autenticación: SDK y cookies reales contra un proveedor HTTP simulado.
// No envía correos ni necesita credenciales o una base de datos real.
export default defineConfig({
  testDir: "tests/auth",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: {
    command: "npm run dev -- -H 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100/login",
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54331",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public-key",
      NEXT_PUBLIC_APP_ORIGIN: "http://127.0.0.1:3100",
    },
  },
});
