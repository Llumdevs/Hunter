import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";
import { requireUserWithProfile } from "@/lib/auth/session";
import { referralsSchema } from "@/lib/rewards/data";
import { InvitationsView } from "./invitations-view";

export default async function InvitationsPage() {
  const { supabase } = await requireUserWithProfile("/invitaciones");
  const { data, error } = await supabase.rpc("my_referrals");
  const parsed = referralsSchema.safeParse(data);
  return <AppShell>{!error && parsed.success ? <InvitationsView referrals={parsed.data} /> : <Notice title="No hemos podido cargar las invitaciones">Puede faltar aplicar la actualización de compras y puntos.</Notice>}</AppShell>;
}
