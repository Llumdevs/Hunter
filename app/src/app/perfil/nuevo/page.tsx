import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { safeRedirectPath } from "@/lib/navigation/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewProfilePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeRedirectPath((await searchParams).next ?? null);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  return <ProfileForm userId={userId} next={next} />;
}
