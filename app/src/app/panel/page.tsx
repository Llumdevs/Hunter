import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import { Notice } from "@/components/ui";
import { requireUserWithProfile } from "@/lib/auth/session";

export default async function PanelHomePage() {
  const { supabase } = await requireUserWithProfile("/panel");
  const { data: memberships } = await supabase.from("organizer_members").select("organizer_id");
  const organizerIds = (memberships ?? []).map((m) => m.organizer_id);
  const { data: places } = organizerIds.length
    ? await supabase.from("places").select("id, name, zone, is_active").in("organizer_id", organizerIds).order("name")
    : { data: [] };

  if (!places?.length) {
    return <Notice title="Aún no tienes locales">Si tienes un local, escríbenos para darlo de alta en Hunter.</Notice>;
  }
  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-sm font-bold tracking-widest text-orange uppercase">Hunter para locales</p>
        <h1 className="text-3xl font-extrabold">Tus locales</h1>
      </header>
      {places.map((place) => (
        <Link key={place.id} href={`/panel/${place.id}`}
          className="flex items-center gap-4 rounded-[var(--radius-card)] bg-day-card p-4 shadow-[0_10px_30px_-18px_rgb(60_40_30/0.35)]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tile-sand"><Store aria-hidden className="h-6 w-6" /></span>
          <span className="flex-1">
            <span className="block text-lg font-bold">{place.name}</span>
            <span className="text-sm text-muted">{place.zone}{place.is_active ? "" : " · inactivo"}</span>
          </span>
          <ChevronRight aria-hidden className="h-5 w-5 text-muted" />
        </Link>
      ))}
    </section>
  );
}
