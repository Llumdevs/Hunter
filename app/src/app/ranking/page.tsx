import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";
import { requireUserWithProfile } from "@/lib/auth/session";
import { rankingMonths, rankingSchema } from "@/lib/rewards/data";
import { RankingView } from "./ranking-view";

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { supabase } = await requireUserWithProfile("/ranking");
  const months = rankingMonths(); const requested = (await searchParams).mes; const month = requested && months.includes(requested) ? requested : months[0];
  const { data, error } = await supabase.rpc("monthly_ranking", { p_month: month });
  const parsed = rankingSchema.safeParse(data);
  return <AppShell>{!error && parsed.success ? <><RankingView ranking={parsed.data} /><nav aria-label="Meses del ranking" className="flex flex-wrap gap-3">{months.slice(0, 6).map((date) => <Link key={date} href={`/ranking?mes=${date}`} aria-current={date === month ? "page" : undefined} className="rounded-full border border-white/20 px-3 py-2 text-xs">{new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`))}</Link>)}</nav></> : <Notice title="No hemos podido cargar el ranking">Puede faltar aplicar la actualización de compras y puntos.</Notice>}</AppShell>;
}
