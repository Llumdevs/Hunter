import { CheckCircle2, ScanLine, MapPin } from "lucide-react";
import Link from "next/link";
import { CancelSignupButton } from "./cancel-signup-button";
import { AppShell } from "@/components/app-shell";
import { requireUserWithProfile } from "@/lib/auth/session";
import { tonightDate } from "@/lib/tonight/night";
import { ShareButton } from "@/components/share-button";
import { PlansOverview } from "./plans-overview";

export default async function PlansPage() {
  const { supabase } = await requireUserWithProfile("/planes");
  const night = tonightDate();
  const [{ data: signups, error: signupsError }, { data: checkins, error: checkinsError }] = await Promise.all([
    supabase.from("signups").select("place_id, places(name, zone, address, cities(name))").eq("night_date", night).is("cancelled_at", null),
    supabase.from("checkins").select("place_id, redemptions(id)").eq("night_date", night),
  ]);
  const checkinByPlace = new Map((checkins ?? []).map((c) => [c.place_id, c]));

  return (
    <AppShell>
      <PlansOverview count={(signups ?? []).length} failed={Boolean(signupsError || checkinsError)}>
        <h2 className="text-lg font-bold">Tus prelistas</h2>
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
              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([signup.places?.address || signup.places?.name, signup.places?.zone, signup.places?.cities?.name || "Valencia"].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 text-xs font-semibold text-violet-soft"><MapPin aria-hidden className="h-4 w-4" />Cómo llegar</a>
                <ShareButton title={signup.places?.name || "Plan en Hunter"} text="¿Te apuntas? Descubre este local en Hunter." path={`/local/${signup.place_id}`} label="Compartir plan" />
              </div>
              {redemption ? (
                <Link href={`/canje/${redemption.id}`} className="flex items-center gap-2 font-bold text-lime">
                  <CheckCircle2 aria-hidden className="h-5 w-5" />Ver mi canje
                </Link>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <Link href="/escanear" className="flex items-center gap-2 font-bold text-violet-soft">
                    <ScanLine aria-hidden className="h-5 w-5" />{checkin ? "Escanea de nuevo para canjear" : "Escanea el QR al llegar"}
                  </Link>
                  {!checkin && <CancelSignupButton placeId={signup.place_id} />}
                </div>
              )}
            </article>
          );
        })}
      </PlansOverview>
    </AppShell>
  );
}
