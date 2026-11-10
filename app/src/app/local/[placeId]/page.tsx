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

const TILE = "rounded-[var(--radius-tile)] p-3 text-center text-day-ink";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function PlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  if (!UUID.test(placeId)) return <Notice title="Local no encontrado" />;
  const { supabase, userId } = await optionalUser();
  const { places } = await loadTonight(supabase, userId);
  const place = places.find((p) => p.id === placeId);
  if (!place) return <Notice title="Este local no abre esta noche">Vuelve a mirar mañana.</Notice>;

  const night = tonightDate();
  const [{ data: offers }, { data: signup }] = await Promise.all([
    supabase.from("offers").select("id, title, description, includes_alcohol, days_of_week").eq("place_id", placeId).eq("is_active", true),
    userId
      ? supabase.from("signups").select("id").eq("place_id", placeId).eq("night_date", night).is("cancelled_at", null).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const tonightOffers = offersForNight(
    (offers ?? []).map((o) => ({ id: o.id, title: o.title, description: o.description, includesAlcohol: o.includes_alcohol, daysOfWeek: o.days_of_week })),
    night,
  );
  const crowd = crowdLabel(place.signups_visible, place.signups_any);

  return (
    <section className="-mx-5 -mt-6 flex flex-col">
      <div className="relative h-64">
        <PlacePhoto path={place.cover_path} alt={place.name} className="absolute inset-0" />
        <div className="absolute top-6 left-5"><IconLink href="/" label="Volver a Esta noche"><ArrowLeft aria-hidden className="h-5 w-5" /></IconLink></div>
      </div>
      <div className="relative -mt-10 flex flex-col gap-4 rounded-t-[32px] bg-night-900 px-5 pt-7 pb-32">
        <header className="text-center">
          <h1 className="text-[28px] font-extrabold">{place.name}</h1>
          <p className="flex items-center justify-center gap-1 text-sm text-muted">
            <MapPin aria-hidden className="h-4 w-4" />{place.zone}
            <Clock aria-hidden className="ml-2 h-4 w-4" />{place.opens_at.slice(0, 5)}–{place.closes_at.slice(0, 5)}
          </p>
        </header>
        <div className="grid grid-cols-4 gap-2">
          <div className={`${TILE} bg-tile-lime`}><small className="block text-[11px] text-day-muted">Público</small><b>{labelFor(AGE_BANDS, place.age_band) ?? "—"}</b></div>
          <div className={`${TILE} bg-tile-sky`}><small className="block text-[11px] text-day-muted">Música</small><b className="text-sm">{labelFor(MUSIC, place.music) ?? "—"}</b></div>
          <div className={`${TILE} bg-tile-sand`}><small className="block text-[11px] text-day-muted">Precio</small><b>{place.price_level}</b></div>
          <div className={`${TILE} bg-tile-rose`}><small className="block text-[11px] text-day-muted">Ambiente</small><b className="text-sm">{labelFor(VIBES, place.vibe)?.replace("Para ", "") ?? "—"}</b></div>
        </div>
        {place.age_source === "venue" && place.age_band && <p className="text-center text-xs text-muted">Edad del público según el local</p>}
        {crowd && <p className="glass rounded-2xl px-4 py-3 text-center text-sm font-semibold">{crowd} esta noche</p>}
        {tonightOffers.map((offer) => (
          <article key={offer.id} className="rounded-[22px] border border-dashed border-orange-soft/70 bg-gradient-to-br from-orange/20 to-rose/10 p-4">
            <p className="text-[11px] font-bold tracking-wider text-orange-soft uppercase">Oferta por apuntarte</p>
            <h2 className="text-lg font-bold">{offer.title}</h2>
            {offer.description && <p className="text-sm text-muted">{offer.description}</p>}
            {offer.includesAlcohol && <p className="mt-1 text-xs text-muted">El consumo de alcohol perjudica la salud. Bebe con moderación.</p>}
            <p className="mt-1 text-xs text-muted">Se activa al hacer check-in en el local.</p>
          </article>
        ))}
        <SignupButton placeId={placeId} signedUp={Boolean(signup)} loggedIn={Boolean(userId)} />
      </div>
    </section>
  );
}
