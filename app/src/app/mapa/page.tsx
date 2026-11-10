import { MapView } from "./map-view";
import { TabBar } from "@/components/tab-bar";
import { requireUserWithProfile } from "@/lib/auth/session";
import { loadTonight } from "@/lib/tonight/load";

export default async function MapPage() {
  const { supabase, userId } = await requireUserWithProfile("/mapa");
  const tonight = await loadTonight(supabase, userId);
  return (
    <>
      <MapView {...tonight} />
      <TabBar />
    </>
  );
}
