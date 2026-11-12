import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { SignupButton } from "./signup-button";
import { PlacePhoto } from "@/components/place-photo";
import { IconLink, Notice } from "@/components/ui";
import { optionalUser } from "@/lib/auth/optional-session";
import { offersForNight } from "@/lib/checkin/offers";
import { AGE_BANDS, labelFor, MUSIC, VIBES } from "@/lib/tonight/catalog";
import { crowdLabel } from "@/lib/tonight/format";
import { loadTonight } from "@/lib/tonight/load";
import { tonightDate } from "@/lib/tonight/night";
import { ratingSummarySchema } from "@/lib/pilot/data";
import Link from "next/link";
import { DEMO_PLACES, DEMO_OFFERS } from "@/lib/demo/catalog";
import { DemoBanner, DemoSignup } from "@/components/demo/demo-panels";

const TILE = "glass rounded-[var(--radius-tile)] p-3 text-center text-fg";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function PlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  if (!UUID.test(placeId)) return <Notice title="Local no encontrado" />;
  const { supabase, userId } = await optionalUser();
  const { places } = await loadTonight(supabase, userId);
  const demoPlace = DEMO_PLACES.find((p) => p.id === placeId);
  const place = demoPlace ?? places.find((p) => p.id === placeId);
  if (!place) return <Notice title="Este local no abre esta noche">Vuelve a mirar mañana.</Notice>;

  const night = tonightDate();
  const [{ data: offers }, { data: signup }, { data: ratings }] = await Promise.all([
    demoPlace ? Promise.resolve({ data: [] }) : supabase.from("offers").select("id, title, description, includes_alcohol, days_of_week").eq("place_id", placeId).eq("is_active", true),
    userId && !demoPlace
      ? supabase.from("signups").select("id").eq("place_id", placeId).eq("night_date", night).is("cancelled_at", null).maybeSingle()
      : Promise.resolve({ data: null }),
    userId && !demoPlace ? supabase.rpc("place_rating_summary", { p_place: placeId }) : Promise.resolve({ data: null }),
  ]);
  const rating = ratingSummarySchema.safeParse(ratings);
  const tonightOffers = offersForNight(
    (offers ?? []).map((o) => ({ id: o.id, title: o.title, description: o.description, includesAlcohol: o.includes_alcohol, daysOfWeek: o.days_of_week })),
    night,
  );
  const crowd = crowdLabel(place.signups_visible, place.signups_any);

  return (
    <section className="-mx-5 -mt-6 flex flex-col">
      <div className="relative h-[440px] overflow-hidden rounded-b-[48px]">
        <PlacePhoto path={place.cover_path} alt={place.name} eager demo={Boolean(demoPlace)} variant={place.music === "jazz" || place.music === "indie" ? "live" : "night"} className="absolute inset-0" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-transparent to-night-950/20" />
        <div className="absolute top-6 left-5"><IconLink href="/" label="Volver a Esta noche"><ArrowLeft aria-hidden className="h-5 w-5" /></IconLink></div>
      </div>
      <div className="relative -mt-20 flex flex-col gap-5 px-5 pt-7 pb-32">
        <header className="relative"><p className="eyebrow mb-3 text-lime">Tu próxima parada / Valencia</p>
          <h1 className="text-[42px] leading-none font-black tracking-tight">{place.name}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-1 text-sm text-muted">
            <MapPin aria-hidden className="h-4 w-4" />{place.zone}
            <Clock aria-hidden className="ml-2 h-4 w-4" />{place.opens_at.slice(0, 5)}–{place.closes_at.slice(0, 5)}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-2">
          <div className={`${TILE}`}><small className="block text-[11px] text-muted">Público</small><b>{labelFor(AGE_BANDS, place.age_band) ?? "—"}</b></div>
          <div className={`${TILE}`}><small className="block text-[11px] text-muted">Música</small><b className="text-sm">{labelFor(MUSIC, place.music) ?? "—"}</b></div>
          <div className={`${TILE}`}><small className="block text-[11px] text-muted">Precio</small><b>{place.price_level}</b></div>
          <div className={`${TILE}`}><small className="block text-[11px] text-muted">Ambiente</small><b className="text-sm">{labelFor(VIBES, place.vibe)?.replace("Para ", "") ?? "—"}</b></div>
        </div>
        {demoPlace && <DemoBanner />}
        {place.age_source === "venue" && place.age_band && <p className="text-center text-xs text-muted">Edad del público según el local</p>}
        {crowd && <p className="glass rounded-2xl px-4 py-3 text-center text-sm font-semibold">{crowd} esta noche</p>}
        {rating.success && <div className="glass flex flex-col gap-2 rounded-2xl p-4 text-sm">
          <h2 className="font-bold">Valoraciones de visitas verificadas</h2>
          <p className="text-muted">{rating.data.average !== null ? `${rating.data.average} de 5 ★ · ${rating.data.count} valoraciones` : "Aún no hay suficientes valoraciones para mostrar una media (mínimo 3)."}</p>
          <Link href="/valoraciones" className="text-orange-soft underline">Valorar mis visitas</Link>
        </div>}
        {tonightOffers.map((offer) => (
          <article key={offer.id} className="rounded-[22px] border border-dashed border-orange-soft/70 bg-gradient-to-br from-orange/20 to-rose/10 p-4">
            <p className="text-[11px] font-bold tracking-wider text-orange-soft uppercase">Oferta por apuntarte</p>
            <h2 className="text-lg font-bold">{offer.title}</h2>
            {offer.description && <p className="text-sm text-muted">{offer.description}</p>}
            {offer.includesAlcohol && <p className="mt-1 text-xs text-muted">El consumo de alcohol perjudica la salud. Bebe con moderación.</p>}
            <p className="mt-1 text-xs text-muted">Se activa al hacer check-in en el local.</p>
          </article>
        ))}
        {demoPlace ? <>
          <article className="rounded-3xl border border-dashed border-orange-soft/70 p-4"><h2 className="font-bold">{DEMO_OFFERS[placeId]}</h2><p className="text-xs text-muted">Oferta ficticia para probar el flujo. No canjeable en ningún local.</p></article>
          <DemoSignup placeId={placeId} />
        </> : <SignupButton placeId={placeId} signedUp={Boolean(signup)} loggedIn={Boolean(userId)} />}
      </div>
    </section>
  );
}
