import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SideMenu } from "./side-menu";
import { TabBar } from "./tab-bar";

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  const membership = userId ? await supabase.from("organizer_members").select("organizer_id").eq("user_id", userId).limit(1) : null;
  const canManageVenue = !membership?.error && (membership?.data?.length ?? 0) > 0;
  return <><SideMenu canManageVenue={canManageVenue} />{children}<TabBar /></>;
}
