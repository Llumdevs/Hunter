import { requireUserWithProfile } from "@/lib/auth/session";
import { visitsSchema } from "@/lib/pilot/data";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";
import { ReviewsView } from "./reviews-view";

export default async function ReviewsPage() {
  const { supabase } = await requireUserWithProfile("/valoraciones");
  const { data, error } = await supabase.rpc("my_reviewable_visits");
  const visits = visitsSchema.safeParse(data);
  if (error || !visits.success) return <Notice title="No hemos podido cargar tus visitas">Vuelve a intentarlo más tarde.</Notice>;
  return <AppShell><ReviewsView visits={visits.data} /></AppShell>;
}
