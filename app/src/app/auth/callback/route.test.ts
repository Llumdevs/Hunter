import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchange, profile, client } = vi.hoisted(() => {
  const exchange = vi.fn();
  const profile = vi.fn();
  const client = {
    auth: { exchangeCodeForSession: exchange },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) })),
  };
  return { exchange, profile, client };
});
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => client }));
vi.mock("@/lib/env", () => ({ publicEnv: { appOrigin: "https://hunter.example" } }));
import { GET } from "./route";

const request = (query: string) => new NextRequest(`https://hunter.example/auth/callback?${query}`);

describe("login por enlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchange.mockResolvedValue({ data: { user: { id: "tester" } }, error: null });
    profile.mockResolvedValue({ data: { id: "tester" }, error: null });
  });

  it("intercambia el código y devuelve al usuario existente a su destino", async () => {
    const response = await GET(request("code=valid&next=%2Fplanes"));
    expect(exchange).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe("https://hunter.example/planes");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("lleva al nuevo usuario al perfil y conserva el QR", async () => {
    profile.mockResolvedValue({ data: null, error: null });
    const response = await GET(request(`code=valid&next=${encodeURIComponent("/c/abc?k=demo")}`));
    const url = new URL(response.headers.get("location")!);
    expect(url.pathname).toBe("/perfil/nuevo");
    expect(url.searchParams.get("next")).toBe("/c/abc?k=demo");
  });

  it("rechaza redirecciones a otro dominio", async () => {
    const response = await GET(request("code=valid&next=https%3A%2F%2Fevil.example"));
    expect(response.headers.get("location")).toBe("https://hunter.example/");
  });

  it("explica los enlaces caducados sin intentar crear sesión", async () => {
    const response = await GET(request("error=access_denied&error_code=otp_expired"));
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("otp_expired");
    expect(exchange).not.toHaveBeenCalled();
  });

  it.each(["", "next=%2Fplanes"])("maneja un callback sin código (%s)", async (query) => {
    const response = await GET(request(query));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(exchange).not.toHaveBeenCalled();
  });

  it("no vuelve al inicio cuando el enlace se usó en otro navegador", async () => {
    exchange.mockResolvedValue({ data: { user: null }, error: { message: "Missing verifier" } });
    const response = await GET(request("code=used&next=%2Fplanes"));
    const url = new URL(response.headers.get("location")!);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("error")).toBe("callback_failed");
    expect(url.searchParams.get("next")).toBe("/planes");
    expect(profile).not.toHaveBeenCalled();
  });

  it("distingue un fallo de base de datos de un perfil inexistente", async () => {
    profile.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    const response = await GET(request("code=valid"));
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("profile_failed");
  });

  it("maneja un fallo de conexión sin mostrar secretos ni el código", async () => {
    exchange.mockRejectedValue(new Error("Network error"));
    const response = await GET(request("code=secret"));
    expect(response.headers.get("location")).not.toContain("secret");
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("callback_failed");
  });
});
