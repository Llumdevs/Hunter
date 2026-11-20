import { cache } from "react";
import type { Metadata } from "next";
import { absoluteUrl, indexingEnabled } from "@/lib/public/seo";
import { MapView } from "./map-view";
import { AppShell } from "@/components/app-shell";
import { optionalUser } from "@/lib/auth/optional-session";
import { loadTonight } from "@/lib/tonight/load";

const discovery = cache(async () => {
  const session = await optionalUser();
  return { ...session, tonight: await loadTonight(session.supabase, session.userId) };
});
export async function generateMetadata(): Promise<Metadata> {
  const { tonight } = await discovery();
  const index = indexingEnabled && !tonight.demoMode && !tonight.loadError;
  return { title: 'Mapa de locales en Valencia · Spotea', description: 'Explora locales de Valencia y consulta su música, ubicación y disponibilidad.',
    alternates: { canonical: absoluteUrl('/mapa') }, robots: { index, follow: index },
    openGraph: { title: 'Mapa de locales en Valencia · Spotea', description: 'Explora locales de Valencia y consulta su música, ubicación y disponibilidad.', url: absoluteUrl('/mapa'), type: "website" } };
}

export default async function MapPage() {
  const { tonight } = await discovery();
  return (
    <AppShell>
      <MapView {...tonight} />

    </AppShell>
  );
}
