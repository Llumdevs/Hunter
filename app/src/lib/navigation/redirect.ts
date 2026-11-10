const HOME = "/";

// Solo rutas internas: evita redirecciones abiertas tras el inicio de sesión.
export function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return HOME;
  return value;
}
