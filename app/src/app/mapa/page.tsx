import { MapView } from "./map-view";
import { AppShell } from "@/components/app-shell";
import { requireUserWithProfile } from "@/lib/auth/session";
import { loadTonight } from "@/lib/tonight/load";

export default async function MapPage() {
  const { supabase, userId } = await requireUserWithProfile("/mapa");
  const tonight = await loadTonight(supabase, userId);
  return (
    <AppShell>
      <MapView {...tonight} />

    </AppShell>
  );
}
