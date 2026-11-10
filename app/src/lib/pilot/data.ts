import { z } from "zod";

export const pilotProfileSchema = z.object({
  name: z.string(), home_city: z.string().nullable(), age: z.number(), contact: z.string(), friend_code: z.string(),
  signups: z.number(), checkins: z.number(), reviews: z.number(), points: z.number(),
});
export type PilotProfile = z.infer<typeof pilotProfileSchema>;
export const friendsSchema = z.array(z.object({ id: z.string(), name: z.string(), status: z.enum(["pending", "accepted"]), incoming: z.boolean() }));
export type Friend = z.infer<typeof friendsSchema>[number];
export const visitsSchema = z.array(z.object({ id: z.string(), place_name: z.string(), night_date: z.string(), rating: z.number().nullable() }));
export type Visit = z.infer<typeof visitsSchema>[number];
export const ratingSummarySchema = z.object({ count: z.number(), average: z.number().nullable() });

export function pilotResult(data: unknown, failed: boolean): string | null {
  if (failed) return "No hemos podido guardar el cambio. Inténtalo de nuevo.";
  const result = z.object({ ok: z.boolean(), error: z.string().optional() }).safeParse(data);
  if (!result.success) return "No hemos podido confirmar el cambio. Vuelve a intentarlo.";
  if (result.data.ok) return null;
  const messages: Record<string, string> = {
    rate_limited: "Has alcanzado el límite de hoy. Inténtalo más tarde.",
    invalid_feedback: "Escribe entre 10 y 2000 caracteres.",
    invalid_city: "La procedencia puede tener como máximo 80 caracteres.",
    invalid_friend_code: "Ese código no es válido o es el tuyo.",
    already_requested: "Ya existe una solicitud o amistad con esa persona.",
    request_not_found: "La solicitud ya no está disponible. Actualiza la página.",
    already_reviewed: "Ya has valorado esta visita.",
    verified_visit_required: "Solo puedes valorar tus propios check-ins verificados.",
    invalid_review: "Elige de 1 a 5 estrellas y escribe como máximo 500 caracteres.",
  };
  return messages[result.data.error ?? ""] ?? "No se ha podido guardar. Comprueba tu sesión e inténtalo de nuevo.";
}
