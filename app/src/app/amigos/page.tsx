import { requireUserWithProfile } from "@/lib/auth/session";
import { friendsSchema, pilotProfileSchema } from "@/lib/pilot/data";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";
import { FriendsView } from "./friends-view";

export default async function FriendsPage() {
  const { supabase } = await requireUserWithProfile("/amigos");
  const [friends, profile] = await Promise.all([supabase.rpc("my_friends"), supabase.rpc("my_pilot_profile")]);
  const list = friendsSchema.safeParse(friends.data);
  const me = pilotProfileSchema.safeParse(profile.data);
  if (friends.error || profile.error || !list.success || !me.success) return <Notice title="No hemos podido cargar tus amigos">Vuelve a intentarlo más tarde.</Notice>;
  return <AppShell><FriendsView friends={list.data} code={me.data.friend_code} /></AppShell>;
}
