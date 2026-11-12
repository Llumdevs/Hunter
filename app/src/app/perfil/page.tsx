import { ChevronRight, ShieldCheck, SlidersHorizontal, Store, Star, Gift, Trophy, QrCode } from "lucide-react";
import Link from "next/link";
import { AccountActions } from "./account-actions";
import { AppShell } from "@/components/app-shell";
import { requireUserWithProfile } from "@/lib/auth/session";
import { pilotProfileSchema } from "@/lib/pilot/data";
import { PilotProfileDetails } from "./pilot-profile";

export default async function ProfilePage() {
  const { supabase, userId } = await requireUserWithProfile("/perfil");
  const [{ data: profile }, { data: memberships }, { data: pilotData }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    supabase.from("organizer_members").select("organizer_id").limit(1),
    supabase.rpc("my_pilot_profile"),
  ]);
  const pilot = pilotProfileSchema.safeParse(pilotData);
  const links = [
    { href: "/perfil/gustos", label: "Mis gustos", Icon: SlidersHorizontal },
    { href: "/invitaciones", label: "Invitaciones por código", Icon: Gift },
    { href: "/compras", label: "Mi QR de compra", Icon: QrCode },
    { href: "/ranking", label: "Ranking mensual", Icon: Trophy },
    { href: "/valoraciones", label: "Valorar mis visitas", Icon: Star },
    ...((memberships ?? []).length ? [{ href: "/panel", label: "Panel de mi local", Icon: Store }] : []),
    { href: "/privacidad", label: "Privacidad", Icon: ShieldCheck },
  ];
  return (
    <AppShell>
      <section className="flex flex-col gap-6">
        <header className="flex items-center gap-4">
          <span aria-hidden className="h-16 w-16 rounded-full border-2 border-white/40 bg-gradient-to-br from-orange-soft to-[#b05cff]" />
          <div>
            <p className="text-sm text-muted">Tu perfil</p>
            <h1 className="text-2xl font-extrabold">{profile?.display_name}</h1>
          </div>
        </header>
        <nav className="flex flex-col gap-2">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="glass flex items-center gap-3 rounded-2xl p-4 font-semibold">
              <Icon aria-hidden className="h-5 w-5 text-orange-soft" /><span className="flex-1">{label}</span>
              <ChevronRight aria-hidden className="h-5 w-5 text-muted" />
            </Link>
          ))}
        </nav>
        {pilot.success ? <PilotProfileDetails profile={pilot.data} /> : <p role="alert" className="text-sm text-muted">No hemos podido cargar el resumen del piloto. Inténtalo de nuevo más tarde.</p>}
        <AccountActions />
      </section>

    </AppShell>
  );
}
