import { requireUserWithProfile } from "@/lib/auth/session";
import { visitsSchema } from "@/lib/pilot/data";
import { TabBar } from "@/components/tab-bar";
import { Notice } from "@/components/ui";
import { ReviewsView } from "./reviews-view";

export default async function ReviewsPage() {
  const { supabase } = await requireUserWithProfile("/valoraciones");
  const { data, error } = await supabase.rpc("my_reviewable_visits");
  const visits = visitsSchema.safeParse(data);
  if (error || !visits.success) return <Notice title="No hemos podido cargar tus visitas">Vuelve a intentarlo más tarde.</Notice>;
  return <><ReviewsView visits={visits.data} /><TabBar /></>;
}
