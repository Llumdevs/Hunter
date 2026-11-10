import { requireUserWithProfile } from "@/lib/auth/session";
import { applicationSchema, managementContextSchema } from "@/lib/venue/onboarding";
import { BackLink } from "@/components/venue/day";
import { Notice } from "@/components/ui";
import { ApplicationReview } from "./application-review";

export default async function VenueAdminPage() {
  const { supabase } = await requireUserWithProfile("/panel/admin");
  const context = await supabase.rpc("venue_management_context");
  const parsed = managementContextSchema.safeParse(context.data);
  if (context.error || !parsed.success || !parsed.data.is_admin) return <><BackLink href="/panel">Mi panel</BackLink><Notice title="Acceso reservado">{parsed.success && parsed.data.approvals_enabled ? "Tu cuenta no tiene permisos para revisar altas." : "El panel de revisión estará disponible cuando configuremos la administración. Durante estas pruebas no hemos asignado ninguna cuenta."}</Notice></>;
  const { data, error } = await supabase.from("venue_applications").select("id, details, status, created_at, decision_note, place_id").eq("status", "pending").order("created_at");
  const applications = applicationSchema.array().safeParse(data);
  if (error || !applications.success) return <Notice title="No hemos podido cargar las solicitudes" />;
  return <section className="flex flex-col gap-5"><BackLink href="/panel">Mi panel</BackLink><h1 className="text-3xl font-extrabold">Revisar altas de locales</h1><p className="text-sm text-muted">Aprobar publica el local, crea sus QR y concede acceso al solicitante. Revisa su autorización y los datos antes de confirmar.</p>{applications.data.length ? applications.data.map((application) => <ApplicationReview key={application.id} application={application} />) : <p className="text-muted">No hay solicitudes pendientes.</p>}</section>;
}
