import "server-only";
import { publicEnv } from "@/lib/env";

// Opt-in doble: un despliegue de pruebas nunca se indexa por defecto.
export const indexingEnabled = process.env.HUNTER_INDEXING_ENABLED === "true"
  && process.env.HUNTER_ENV === "production"
  && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  && new URL(publicEnv.appOrigin).protocol === "https:";
export const absoluteUrl = (path: string) => new URL(path, `${publicEnv.appOrigin}/`).href;
export const privatePaths = ["/login", "/auth/", "/perfil", "/planes", "/compras", "/invitaciones", "/amigos", "/ranking", "/valoraciones", "/panel", "/demo", "/bienvenida", "/escanear", "/c/", "/canje/"];
