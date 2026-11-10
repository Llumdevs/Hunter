import { PreferencesForm } from "./preferences-form";
import { requireUserWithProfile } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/navigation/redirect";

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ next?: string; inicio?: string }> }) {
  const { next, inicio } = await searchParams;
  const { supabase, userId } = await requireUserWithProfile("/perfil/gustos");
  const { data } = await supabase.from("user_preferences").select("music, vibe, price, age_bands").eq("user_id", userId).maybeSingle();
  return (
    <PreferencesForm
      initial={data ?? { music: [], vibe: [], price: [], age_bands: [] }}
      next={safeRedirectPath(next ?? "/")}
      onboarding={inicio === "1"}
    />
  );
}
