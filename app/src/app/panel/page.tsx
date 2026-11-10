import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { requireUserWithProfile } from "@/lib/auth/session";
import { applicationSchema, APPLICATION_STATUS, managementContextSchema } from "@/lib/venue/onboarding";
import { VenueDemoButton } from "@/components/venue/venue-demo-button";
import { ApplicationCancel } from "@/components/venue/application-cancel";

export default async function PanelHomePage() {
  const { supabase, userId } = await requireUserWithProfile("/panel");
  const [membershipResult, applicationResult, contextResult] = await Promise.all([
    supabase.from("organizer_members").select("organizer_id"),
    supabase.from("venue_applications").select("id, details, status, created_at, decision_note, place_id").eq("applicant_id", userId).order("created_at", { ascending: false }),
    supabase.rpc("venue_management_context"),
  ]);
  const context = managementContextSchema.safeParse(contextResult.data);
  const organizerIds = (membershipResult.data ?? []).map((m) => m.organizer_id);
  const { data: places, error: placesError } = organizerIds.length
    ? await supabase.from("places").select("id, name, zone, is_active, is_demo").in("organizer_id", organizerIds).order("name")
    : { data: [], error: null };
  const applications = applicationSchema.array().safeParse(applicationResult.data ?? []);

  return <section className="flex flex-col gap-5">
    <header><p className="text-sm font-bold tracking-widest text-orange uppercase">Hunter para locales</p><h1 className="text-3xl font-extrabold">Tu espacio de gestión</h1></header>
    {(membershipResult.error || placesError) && <p role="alert" className="text-sm text-rose">No hemos podido cargar tus locales. Vuelve a intentarlo.</p>}
    {(places ?? []).map((place) => <Link key={place.id} href={`/panel/${place.id}`} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-day-card p-4 shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tile-sand"><Store aria-hidden className="h-6 w-6" /></span>
      <span className="flex-1"><span className="block text-lg font-bold">{place.name}</span><span className="text-sm text-muted">{place.zone} · {place.is_demo ? "Demo personal · no publicado" : place.is_active ? "Publicado" : "Inactivo"}</span></span><ChevronRight aria-hidden className="h-5 w-5 text-muted" />
    </Link>)}
    {!places?.length && !membershipResult.error && <p className="text-muted">Todavía no gestionas ningún local. Puedes empezar con tu demo o solicitar un alta.</p>}
    {context.success && !context.data.demo_place_id && <div className="flex flex-col gap-3 rounded-3xl bg-tile-sand p-5"><h2 className="text-lg font-bold">Prueba tu propio local demo</h2><p className="text-sm text-muted">Incluye dos ofertas de ejemplo, QR y acceso de gestión. No aparece en el mapa público y no necesita aprobación.</p><VenueDemoButton /></div>}
    <Link href="/panel/solicitar-alta" className="flex min-h-14 items-center justify-center rounded-full bg-orange px-5 font-bold text-white">Solicitar alta de un local</Link>
    <p className="text-xs text-muted">{context.success && context.data.approvals_enabled ? "Las solicitudes se revisan antes de publicar el local y conceder acceso de gestión." : "En este entorno de pruebas no hay administradores asignados. Las solicitudes quedan pendientes; crear una solicitud no publica el local."}</p>
    {context.success && context.data.is_admin && <Link href="/panel/admin" className="min-h-11 font-bold text-orange underline">Revisar solicitudes de locales</Link>}
    <section className="flex flex-col gap-3"><h2 className="text-lg font-bold">Mis solicitudes de alta</h2>
      {applicationResult.error || !applications.success ? <p role="alert" className="text-sm text-rose">No hemos podido cargar tus solicitudes. Puede faltar activar la configuración de locales.</p> : applications.data.length === 0 ? <p className="text-sm text-muted">Todavía no has enviado ninguna solicitud.</p> : applications.data.map((application) => <article key={application.id} className="flex flex-col gap-2 rounded-3xl bg-day-card p-4">
        <h3 className="font-bold">{application.details.name}</h3><p className="text-sm font-semibold text-orange">{APPLICATION_STATUS[application.status]}</p><p className="text-xs text-muted">{application.details.address} · {new Date(application.created_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}</p>
        {application.decision_note && <p className="text-sm text-muted">{application.decision_note}</p>}
        {application.status === "approved" && application.place_id && <Link href={`/panel/${application.place_id}`} className="min-h-11 text-sm font-bold text-orange underline">Abrir panel del local aprobado</Link>}
        {application.status === "pending" && <ApplicationCancel id={application.id} />}
      </article>)}
    </section>
    {!context.success && <p role="alert" className="text-sm text-rose">Las funciones nuevas de locales todavía no están disponibles. Falta aplicar la migración o revisar la conexión.</p>}
  </section>;
}
