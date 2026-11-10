import { ScanLine } from "lucide-react";
import Link from "next/link";
import { TonightView } from "./tonight-view";
import { HunterLogo } from "@/components/logo";
import { TabBar } from "@/components/tab-bar";
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
    <>
      <TonightView {...tonight} displayName={displayName} />
      <TabBar />
    </>
  );
}

function Welcome() {
  return (
    <section className="relative -mx-5 -my-6 flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-10">
      {/* Marcador: aquí irá una foto de ambiente con derechos de uso. */}
      <div aria-hidden className="photo-placeholder absolute inset-0" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-night-950/60 to-night-950" />
      <HunterLogo className="absolute top-8 left-6 h-8 text-fg" />
      <div aria-hidden className="absolute top-24 right-8 grid h-20 w-20 -rotate-12 place-items-center rounded-full border-2 border-lime bg-night-950/40 text-lg font-black text-lime">
        +18
      </div>
      <div className="relative flex flex-col gap-5">
        <h1 className="text-[40px] leading-none font-black tracking-tight">
          Sabe dónde vas<br /><span className="text-orange">antes de ir.</span>
        </h1>
        <p className="text-muted">
          Qué música suena, qué gente va y cómo de lleno está esta noche. Apúntate, escanea al llegar y llévate la oferta.
        </p>
        <LinkButton href="/login?next=%2F">Empezar</LinkButton>
        <Link href="/escanear" className="flex items-center justify-center gap-2 text-sm font-semibold">
          <ScanLine aria-hidden className="h-4 w-4" />Ya estoy en el local: escanear el QR
        </Link>
        <Link href="/panel" className="text-center text-sm text-muted underline">¿Tienes un local? Entra en tu panel</Link>
      </div>
    </section>
  );
}
