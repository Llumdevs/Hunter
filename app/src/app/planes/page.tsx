import { CheckCircle2, ScanLine, Ticket } from "lucide-react";
import Link from "next/link";
import { CancelSignupButton } from "./cancel-signup-button";
import { TabBar } from "@/components/tab-bar";
import { requireUserWithProfile } from "@/lib/auth/session";
import { tonightDate } from "@/lib/tonight/night";

export default async function PlansPage() {
  const { supabase } = await requireUserWithProfile("/planes");
  const night = tonightDate();
  const [{ data: signups }, { data: checkins }] = await Promise.all([
    supabase.from("signups").select("place_id, places(name, zone)").eq("night_date", night).is("cancelled_at", null),
    supabase.from("checkins").select("place_id, redemptions(id)").eq("night_date", night),
  ]);
  const checkinByPlace = new Map((checkins ?? []).map((c) => [c.place_id, c]));

  return (
    <>
      <section className="flex flex-col gap-5">
        <h1 className="text-[28px] leading-tight font-extrabold uppercase">Mis planes<br /><span className="text-muted">esta noche</span></h1>
        {(signups ?? []).length === 0 && (
          <div className="glass flex flex-col items-center gap-3 rounded-[var(--radius-card)] p-6 text-center">
            <Ticket aria-hidden className="h-8 w-8 text-orange" />
            <p className="text-muted">Aún no te has apuntado a ningún sitio esta noche.</p>
            <Link href="/" className="font-bold text-orange-soft underline">Ver qué hay esta noche</Link>
          </div>
        )}
        {(signups ?? []).map((signup) => {
          const checkin = checkinByPlace.get(signup.place_id);
          const redemption = checkin?.redemptions;
          return (
            <article key={signup.place_id} className="glass flex flex-col gap-3 rounded-[var(--radius-card)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/local/${signup.place_id}`} className="text-lg font-bold">{signup.places?.name}</Link>
                  <p className="text-sm text-muted">{signup.places?.zone}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${checkin ? "bg-lime text-night-950" : "bg-white/10"}`}>
                  {redemption ? "Canjeado" : checkin ? "Check-in hecho" : "Apuntado"}
                </span>
              </div>
              {redemption ? (
                <Link href={`/canje/${redemption.id}`} className="flex items-center gap-2 font-bold text-lime">
                  <CheckCircle2 aria-hidden className="h-5 w-5" />Ver mi canje
                </Link>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <Link href="/escanear" className="flex items-center gap-2 font-bold text-orange-soft">
                    <ScanLine aria-hidden className="h-5 w-5" />{checkin ? "Escanea de nuevo para canjear" : "Escanea el QR al llegar"}
                  </Link>
                  {!checkin && <CancelSignupButton placeId={signup.place_id} />}
                </div>
              )}
            </article>
          );
        })}
      </section>
      <TabBar />
    </>
  );
}
