import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicPlace } from "@/lib/public/place";
import { absoluteUrl, indexingEnabled } from "@/lib/public/seo";
import { placePhotoUrl } from "@/lib/venue/photo-file";
import { publicEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { ArrowLeft, Clock, MapPin, Music2, Wallet, Users, Waves } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { SignupButton } from "./signup-button";
import { PhotoGallery } from "@/components/venue/photo-gallery";
import { PlacePhoto } from "@/components/place-photo";
import { IconLink } from "@/components/ui";
import { optionalUser } from "@/lib/auth/optional-session";
import { offersForNight } from "@/lib/checkin/offers";
import { AGE_BANDS, labelFor, MUSIC, VIBES } from "@/lib/tonight/catalog";
import { crowdLabel } from "@/lib/tonight/format";
import { tonightDate } from "@/lib/tonight/night";
import { ratingSummarySchema } from "@/lib/pilot/data";
import Link from "next/link";
import { DEMO_PLACES, DEMO_OFFERS, DEMO_EVENTS } from "@/lib/demo/catalog";
import { DemoBanner, DemoSignup } from "@/components/demo/demo-panels";


export async function generateMetadata({ params }: { params: Promise<{ placeId: string }> }): Promise<Metadata> {
  const { placeId } = await params;
  const data = await loadPublicPlace(placeId);
  if (!data) notFound();
  const { place, demo } = data;
  const description = demo ? `${place.name}: demostración ficticia de Spotea en Valencia.` : `${place.name} en ${place.zone}, ${place.city}. Consulta horarios, música, ambiente y disponibilidad en Spotea.`;
  const url = absoluteUrl(`/local/${place.id}`);
  return { title: `${place.name} · Spotea`, description,
    alternates: demo ? undefined : { canonical: url }, robots: { index: indexingEnabled && !demo, follow: !demo },
    openGraph: { title: `${place.name} · Spotea`, description, url, type: "website", images: !demo && place.cover_path ? [{ url: placePhotoUrl(publicEnv.supabaseUrl,place.cover_path), alt: place.name }] : [] },
  };
}

export default async function PlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const data = await loadPublicPlace(placeId);
  if (!data) notFound();
  const { place, demo } = data;
  const demoPlace = demo ? DEMO_PLACES.find((item) => item.id === placeId) : undefined;
  const { supabase, userId } = await optionalUser();
  const publicClient = createSupabasePublicClient();

  const night = tonightDate();
  const [{ data: offers }, { data: signup }, { data: ratings }, { data: photos }] = await Promise.all([
    demoPlace ? Promise.resolve({ data: [] }) : publicClient.from("offers").select("id, title, description, includes_alcohol, days_of_week").eq("place_id", placeId).eq("is_active", true),
    userId && !demoPlace
      ? supabase.from("signups").select("id").eq("place_id", placeId).eq("night_date", night).is("cancelled_at", null).maybeSingle()
      : Promise.resolve({ data: null }),
    userId && !demoPlace ? supabase.rpc("place_rating_summary", { p_place: placeId }) : Promise.resolve({ data: null }),
    Promise.resolve({ data: place.photos }),
  ]);
  const rating = ratingSummarySchema.safeParse(ratings);
  const tonightOffers = offersForNight(
    (place.accepting_signups ? offers ?? [] : []).map((o) => ({ id: o.id, title: o.title, description: o.description, includesAlcohol: o.includes_alcohol, daysOfWeek: o.days_of_week })),
    night,
  );
  const crowd = crowdLabel(place.signups_visible, place.signups_any);

  return (
    <section className="public-place -mx-5 -mt-6 flex flex-col">
      <div className="relative h-[430px] overflow-hidden rounded-b-[54px]">
        <PlacePhoto path={place.cover_path} alt={place.name} eager demo={Boolean(demoPlace)} variant={place.music === "jazz" ? "live" : place.music === "indie" ? "terrace" : place.music === "pop" ? "electric" : "night"} className="absolute inset-0" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        <div className="absolute top-6 left-5"><IconLink href="/" label="Volver a Esta noche"><ArrowLeft aria-hidden className="h-5 w-5" /></IconLink></div>
        <div className="absolute top-6 right-5"><ShareButton compact title={place.name.replace(" · Demo", "")} text={demoPlace ? "Plan de prueba de Spotea · Evento simulado." : `¿Vamos a ${place.name}? Descubre el plan en Spotea.`} path={`/local/${placeId}`} label="Compartir local" /></div>
        <div className="detail-title absolute right-8 bottom-6 left-0 rounded-r-[48px] px-6 py-5"><p className="mb-2 text-[10px] font-semibold text-white/70">{demoPlace ? "Spotea presenta / Evento demo" : "Descubre el local"}</p><h1 className="max-w-72 text-[34px] leading-[1.05] font-extrabold tracking-tight text-white">{place.name}</h1>{demoPlace && <p className="mt-2 text-sm font-medium text-white/80">{DEMO_EVENTS.find((event) => event.placeId === placeId)?.title}</p>}</div>
      </div>
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-6 pb-36">
        <div className="flex flex-col gap-3 text-xs text-muted">
          <p className="flex items-center gap-3"><Clock aria-hidden className="h-4 w-4 text-violet" />{demo ? "Horario simulado" : place.is_open ? "Abierto ahora" : place.accepting_signups ? "Abre esta noche" : "Cerrado en este momento"}{place.opens_at && place.closes_at ? ` · ${place.opens_at.slice(0, 5)}–${place.closes_at.slice(0, 5)}` : ""}</p>
          <p className="flex items-center gap-3"><MapPin aria-hidden className="h-4 w-4 text-violet" />{place.zone}, {place.city}</p>
          <p className="flex items-center gap-3"><Music2 aria-hidden className="h-4 w-4 text-violet" />{labelFor(MUSIC, place.music) ?? "Música por confirmar"}<span aria-hidden className="text-white/20">/</span>{labelFor(VIBES, place.vibe) ?? "Ambiente por confirmar"}</p>
        </div>
        <section className="flex flex-col gap-3"><h2 className="text-lg font-extrabold">Así será tu noche</h2><p className="text-sm leading-relaxed text-muted">{demoPlace ? DEMO_EVENTS.find((event) => event.placeId === placeId)?.description : `Descubre ${place.name} en ${place.zone}. Consulta su programación, apúntate a la prelista y escanea el QR al llegar para activar las ofertas disponibles.`}</p></section>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted"><span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Wallet aria-hidden className="h-3.5 w-3.5 text-violet" />{place.price_level} · Presupuesto</span><span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Users aria-hidden className="h-3.5 w-3.5 text-violet" />{labelFor(AGE_BANDS, place.age_band) ?? "Público sin datos"}</span><span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><Waves aria-hidden className="h-3.5 w-3.5 text-violet" />{labelFor(VIBES, place.vibe) ?? "Sin datos"}</span></div>
        {!demo && <section className="flex flex-col gap-3"><h2 className="text-lg font-extrabold">Horarios del local</h2>{place.opening_hours.length ? <dl className="grid grid-cols-2 gap-2 text-xs">{place.opening_hours.map((hours) => <div key={hours.weekday} className="contents"><dt className="text-muted">{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][hours.weekday - 1]}</dt><dd className="text-right">{hours.opens_at.slice(0, 5)}–{hours.closes_at.slice(0, 5)}{hours.closes_at <= hours.opens_at ? " (+1 día)" : ""}</dd></div>)}</dl> : <p className="text-xs text-muted">El local todavía no ha publicado horarios.</p>}</section>}
        <PhotoGallery key={place.id} name={place.name} demo={Boolean(demoPlace)} photos={demoPlace ? (["night", "live", "terrace", "electric"] as const).map((variant) => ({ path: null, variant })) : (photos ?? []).map((photo) => ({ path: photo.storage_path }))} />
        {demoPlace && <DemoBanner />}
        {place.age_source === "venue" && place.age_band && <p className="text-center text-xs text-muted">Edad del público según el local</p>}
        {crowd && <p className="glass rounded-2xl px-4 py-3 text-center text-sm font-semibold">{crowd} esta noche</p>}
        {rating.success && <div className="glass flex flex-col gap-2 rounded-2xl p-4 text-sm">
          <h2 className="font-bold">Valoraciones de visitas verificadas</h2>
          <p className="text-muted">{rating.data.average !== null ? `${rating.data.average} de 5 ★ · ${rating.data.count} valoraciones` : "Aún no hay suficientes valoraciones para mostrar una media (mínimo 3)."}</p>
          <Link href="/valoraciones" className="text-violet-soft underline">Valorar mis visitas</Link>
        </div>}
        {tonightOffers.map((offer) => (
          <article key={offer.id} className="rounded-[22px] border border-dashed border-violet-soft/70 bg-gradient-to-br from-violet/20 to-rose/10 p-4">
            <p className="text-[11px] font-bold tracking-wider text-violet-soft uppercase">Oferta por apuntarte</p>
            <h2 className="text-lg font-bold">{offer.title}</h2>
            {offer.description && <p className="text-sm text-muted">{offer.description}</p>}
            {offer.includesAlcohol && <p className="mt-1 text-xs text-muted">El consumo de alcohol perjudica la salud. Bebe con moderación.</p>}
            <p className="mt-1 text-xs text-muted">Se activa al hacer check-in en el local.</p>
          </article>
        ))}
        {demoPlace ? <>
          <article className="rounded-3xl border border-dashed border-violet-soft/70 p-4"><h2 className="font-bold">{DEMO_OFFERS[placeId]}</h2><p className="text-xs text-muted">Oferta ficticia para probar el flujo. No canjeable en ningún local.</p></article>
          <DemoSignup placeId={placeId} price={place.price_level} loggedIn={Boolean(userId)} />
        </> : <SignupButton available={place.accepting_signups} price={place.price_level} placeId={placeId} signedUp={Boolean(signup)} loggedIn={Boolean(userId)} />}
      </div>
    </section>
  );
}
