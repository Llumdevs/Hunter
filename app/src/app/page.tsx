import { cache } from "react";
import type { Metadata } from "next";
import { absoluteUrl, indexingEnabled } from "@/lib/public/seo";
import { TonightView } from "./tonight-view";
import { AppShell } from "@/components/app-shell";
import { optionalUser } from "@/lib/auth/optional-session";
import { loadTonight } from "@/lib/tonight/load";
import { redirect } from "next/navigation";

const discovery = cache(async () => {
  const session = await optionalUser();
  return { ...session, tonight: await loadTonight(session.supabase, session.userId) };
});
export async function generateMetadata(): Promise<Metadata> {
  const { tonight } = await discovery();
  const index = indexingEnabled && !tonight.demoMode && !tonight.loadError;
  return { title: 'Esta noche en Valencia · Hunter', description: 'Descubre locales, música y ambiente en Valencia antes de salir.',
    alternates: { canonical: absoluteUrl('/') }, robots: { index, follow: index },
    openGraph: { title: 'Esta noche en Valencia · Hunter', description: 'Descubre locales, música y ambiente en Valencia antes de salir.', url: absoluteUrl('/'), type: "website" } };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; error_code?: string }> }) {
  // Supabase vuelve al Site URL si aún no se ha autorizado el callback.
  const params = await searchParams;
  if (params.code) redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  if (params.error) redirect(`/login?error=${params.error_code === "otp_expired" ? "otp_expired" : "callback_failed"}`);
  const { tonight, displayName } = await discovery();
  return (
    <AppShell>
      <TonightView {...tonight} displayName={displayName} />

    </AppShell>
  );
}
