import { z } from "zod";

export const VENUE_KINDS = [{ value: "bar", label: "Bar" }, { value: "club", label: "Discoteca / club" }, { value: "directo", label: "Música en directo" }, { value: "previa", label: "Previa" }];
export const venueApplicationDetailsSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del local.").max(80),
  zone: z.string().trim().min(2, "Indica el barrio.").max(60),
  address: z.string().trim().min(5, "Indica la dirección completa.").max(200),
  contact: z.string().trim().min(8, "Indica un email o teléfono de contacto.").max(120),
  kind: z.enum(["bar", "club", "directo", "previa"]),
  price: z.enum(["€", "€€", "€€€"]),
  lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  days: z.array(z.number().int().min(1).max(7)).min(1, "Selecciona algún día de apertura.").max(7),
  opens_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indica una hora de apertura válida."),
  closes_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indica una hora de cierre válida."),
});
export type VenueApplicationDetails = z.infer<typeof venueApplicationDetailsSchema>;
export const managementContextSchema = z.object({ is_admin: z.boolean(), approvals_enabled: z.boolean(), demo_place_id: z.string().nullable() });
export const applicationSchema = z.object({
  id: z.string(), details: venueApplicationDetailsSchema,
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  created_at: z.string(), decision_note: z.string(), place_id: z.string().nullable(),
});
export type VenueApplication = z.infer<typeof applicationSchema>;
export const APPLICATION_STATUS = { pending: "Pendiente de revisión", approved: "Aprobada", rejected: "Rechazada", cancelled: "Cancelada" };

export function onboardingError(error?: string): string {
  const messages: Record<string, string> = {
    forbidden: "Esta acción no está permitida para tu cuenta.",
    profile_required: "Completa primero tu perfil de mayor de edad.",
    invalid_application: "Revisa los datos del local, el horario y las coordenadas.",
    pending_limit: "Ya tienes tres solicitudes pendientes. Espera su revisión o cancela alguna.",
    rate_limited: "Has alcanzado el límite de cinco solicitudes de hoy. Inténtalo mañana.",
    application_unavailable: "La solicitud ya no está pendiente. Actualiza la página.",
    invalid_decision: "Para rechazar, escribe un motivo de 10 a 500 caracteres.",
  };
  return messages[error ?? ""] ?? "No hemos podido completar la operación. Vuelve a intentarlo.";
}
export const onboardingResultSchema = z.object({ ok: z.boolean(), error: z.string().optional(), place_id: z.string().nullable().optional(), application_id: z.string().optional() });
