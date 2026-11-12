import { TonightView } from "./tonight-view";
import { WelcomeExperience } from "@/components/welcome-experience";
import { AppShell } from "@/components/app-shell";
import { optionalUser } from "@/lib/auth/optional-session";
import { loadTonight } from "@/lib/tonight/load";
import { redirect } from "next/navigation";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; error_code?: string }> }) {
  // Supabase vuelve al Site URL si aún no se ha autorizado el callback.
  const params = await searchParams;
  if (params.code) redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  if (params.error) redirect(`/login?error=${params.error_code === "otp_expired" ? "otp_expired" : "callback_failed"}`);
  const { supabase, userId, displayName } = await optionalUser();
  if (!userId || !displayName) return <WelcomeExperience />;
  const tonight = await loadTonight(supabase, userId);
  return (
    <AppShell>
      <TonightView {...tonight} displayName={displayName} />

    </AppShell>
  );
}
