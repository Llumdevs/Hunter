import { requireUserWithProfile } from "@/lib/auth/session";
import { BackLink } from "@/components/venue/day";
import { VenueApplicationForm } from "./venue-application-form";

export default async function VenueApplicationPage() {
  await requireUserWithProfile("/panel/solicitar-alta");
  return <section className="flex flex-col gap-5"><BackLink href="/panel">Mi panel</BackLink><h1 className="text-3xl font-extrabold">Solicita el alta de tu local</h1><p className="text-sm text-muted">Empezamos en Valencia. Revisaremos la información antes de publicar el local y darte acceso de gestión. En pruebas, las solicitudes pueden quedar pendientes hasta que se configure un administrador.</p><VenueApplicationForm /></section>;
}
