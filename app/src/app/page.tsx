import { ArrowUpRight, ScanLine } from "lucide-react";
import Link from "next/link";
import { TonightView } from "./tonight-view";
import { HunterLogo } from "@/components/logo";
import { AppShell } from "@/components/app-shell";
import { LinkButton } from "@/components/ui";
import { optionalUser } from "@/lib/auth/optional-session";
import { loadTonight } from "@/lib/tonight/load";
import { redirect } from "next/navigation";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ code?: string; error?: string; error_code?: string }> }) {
  // Supabase vuelve al Site URL si aún no se ha autorizado el callback.
  const params = await searchParams;
  if (params.code) redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  if (params.error) redirect(`/login?error=${params.error_code === "otp_expired" ? "otp_expired" : "callback_failed"}`);
  const { supabase, userId, displayName } = await optionalUser();
  if (!userId || !displayName) return <Welcome />;
  const tonight = await loadTonight(supabase, userId);
  return (
    <AppShell>
      <TonightView {...tonight} displayName={displayName} />

    </AppShell>
  );
}

function Welcome() {
  return <section className="welcome-hero relative -mx-5 -my-6 flex min-h-dvh flex-col overflow-hidden px-6 pt-8 pb-8">
    <div aria-hidden className="welcome-photo" />
    <header className="flex items-center justify-between"><HunterLogo className="h-8 text-fg" /><span className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold">+18</span></header>
    <div className="mt-10 flex items-center gap-2" aria-hidden><span className="h-1 w-14 rounded-full bg-lime" /></div>
    <p className="eyebrow mt-5 text-white/80">Valencia / After dark</p>
    <div className="min-h-32 flex-1" />
    <div className="relative flex flex-col gap-5">
      <div><span className="night-label">Encuentra tu frecuencia</span><h1 className="mt-4 text-[clamp(44px,12vw,58px)] leading-[.97] font-black tracking-[-.065em]">Sabe dónde vas<br /><span className="outline-type">antes de ir.</span></h1></div>
      <p className="max-w-xs text-sm leading-relaxed text-muted">Tu música. Tu ambiente. Tu próxima gran noche. Descubre lo que encaja contigo y sal con un plan.</p>
      <div className="glass flex items-center justify-between rounded-3xl px-4 py-3"><span className="text-xs text-muted">Explora. Elige. Vívelo.</span><ArrowUpRight aria-hidden className="h-5 w-5 text-lime" /></div>
      <LinkButton href="/login?next=%2F">Empezar <ArrowUpRight aria-hidden className="ml-auto h-5 w-5" /></LinkButton>
      <Link href="/escanear" className="flex min-h-11 items-center justify-center gap-2 text-xs font-semibold"><ScanLine aria-hidden className="h-4 w-4 text-lime" />Ya estoy en el local: escanear el QR</Link>
      <Link href="/locales" className="text-center text-xs text-muted underline underline-offset-4">¿Tienes un local? Entra en tu panel</Link>
    </div>
  </section>;
}
