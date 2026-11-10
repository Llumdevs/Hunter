import { ImageIcon, MonitorSmartphone, QrCode } from "lucide-react";
import Link from "next/link";
import { OfferToggle } from "./offer-toggle";
import { WeekChart } from "./week-chart";
import { Notice } from "@/components/ui";
import { BackLink, DayCard, SectionTitle } from "@/components/venue/day";
import { loadStaffPlace } from "@/lib/venue/place-access";
import { currentNight, lastNights, summarizeNights } from "@/lib/venue/stats";
import { WEEKDAY_LABELS } from "@/lib/venue/weekdays";

const NIGHTS_SHOWN = 7;
const percent = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)} %`);

const TONIGHT_TILES = [
  { label: "Apuntados", key: "signups", tile: "bg-tile-sand" },
  { label: "Check-ins", key: "checkins", tile: "bg-tile-lime" },
  { label: "Canjes", key: "redemptions", tile: "bg-tile-sky" },
] as const;

export default async function PlacePanelPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { supabase, place } = await loadStaffPlace(placeId, `/panel/${placeId}`);
  if (!place) return <Notice title="No tienes acceso a este local" />;

  const tonight = currentNight(new Date(), place.timeZone);
  const range = lastNights(tonight, NIGHTS_SHOWN);
  const [{ data: nights }, { data: offers }] = await Promise.all([
    supabase.rpc("place_nightly_stats", { p_place_id: placeId, p_from: range.from, p_to: range.to }),
    supabase.from("offers").select("id, title, days_of_week, valid_until_time, is_active").eq("place_id", placeId).order("created_at"),
  ]);
  const rows = nights ?? [];
  const today = rows.find((night) => night.night_date === tonight);
  const week = summarizeNights(rows);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <BackLink href="/panel">Tus locales</BackLink>
        <p className="text-sm text-muted">Tu local</p>
        <h1 className="text-3xl font-extrabold">{place.name}</h1>
      </header>

      <section aria-labelledby="tonight" className="flex flex-col gap-2">
        <h2 id="tonight" className="text-lg font-bold">Esta noche</h2>
        <div className="grid grid-cols-3 gap-2">
          {TONIGHT_TILES.map(({ label, key, tile }) => (
            <div key={label} className={`rounded-[var(--radius-tile)] p-3 text-center ${tile}`}>
              <p className="text-3xl font-extrabold" data-testid={`tonight-${label}`}>{today?.[key] ?? 0}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <DayCard>
        <SectionTitle id="week" title={`Últimas ${NIGHTS_SHOWN} noches`}
          action={<span className="text-sm text-muted">{percent(week.checkinRate)} check-in</span>} />
        <WeekChart nights={rows} />
        <p className="text-xs text-muted">
          Clientes nuevos que se cobrarían: <b className="text-fg" data-testid="week-billable">{week.billable}</b> · durante el piloto no se factura
        </p>
      </DayCard>

      <DayCard>
        <SectionTitle id="offers" title="Ofertas"
          action={<Link href={`/panel/${placeId}/ofertas/nueva`} className="text-sm font-bold text-orange">+ Nueva oferta</Link>} />
        {(offers ?? []).map((offer) => (
          <article key={offer.id} className="flex items-center justify-between gap-3 rounded-2xl bg-day-bg p-3">
            <div>
              <Link href={`/panel/${placeId}/ofertas/${offer.id}`} className="font-bold">{offer.title}</Link>
              <p className="text-xs text-muted">
                {offer.days_of_week.map((day) => WEEKDAY_LABELS[day - 1]).join(" ")}
                {offer.valid_until_time ? ` · hasta ${offer.valid_until_time.slice(0, 5)}` : ""}
              </p>
            </div>
            <OfferToggle key={`${offer.id}-${offer.is_active}`} offerId={offer.id} title={offer.title} active={offer.is_active} />
          </article>
        ))}
        {(offers ?? []).length === 0 && <p className="text-sm text-muted">Todavía no tienes ofertas.</p>}
      </DayCard>

      <Link href={`/panel/${placeId}/fotos`} className="flex items-center gap-3 rounded-[var(--radius-card)] bg-tile-sand p-4 font-bold">
        <ImageIcon aria-hidden className="h-6 w-6" />Fotos del local
      </Link>

      <nav className="grid grid-cols-2 gap-3">
        <Link href={`/panel/${placeId}/qr`} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-day-ink p-4 font-bold text-white">
          <QrCode aria-hidden className="h-6 w-6" />Mi QR para imprimir
        </Link>
        <Link href={`/panel/${placeId}/pantalla`} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-tile-lime p-4 font-bold">
          <MonitorSmartphone aria-hidden className="h-6 w-6" />Modo pantalla
        </Link>
      </nav>
    </section>
  );
}
