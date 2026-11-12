"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { RewardsRules } from "@/components/rewards/rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { rankingAliasSchema, rewardsError, type Ranking } from "@/lib/rewards/data";

export function RankingView({ ranking }: { ranking: Ranking }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null); const [example, setExample] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const participating = form.get("participate") === "on"; const alias = String(form.get("alias") ?? "").trim();
    if (participating && !rankingAliasSchema.safeParse(alias).success) return setError("Elige un alias de 3 a 24 letras, números, espacios, guiones o guiones bajos.");
    setBusy(true); setError(null); setNotice(null);
    try { const response = await createSupabaseBrowserClient().rpc("set_ranking_participation", { p_alias: alias, p_participating: participating }); const message = rewardsError(response.data, !!response.error); if (message) return setError(message); setNotice(participating ? "Participación guardada. Solo se muestra tu alias y tus puntos." : "Has salido del ranking. Tus puntos se conservan."); router.refresh(); }
    catch { setError("No hemos podido conectar. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  return <section className="flex flex-col gap-5"><header><p className="text-xs font-bold uppercase text-orange-soft">Ranking de prueba</p><h1 className="text-3xl font-extrabold">{new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", month: "long", year: "numeric" }).format(new Date(`${ranking.month}T12:00:00Z`))}</h1></header>
    <div className="glass rounded-3xl p-5"><p className="text-sm text-muted">Tus puntos del mes</p><p className="text-4xl font-extrabold text-lime">{ranking.me.points}</p><p className="mt-2 text-xs text-muted">Compras: {ranking.me.purchase_points} · Invitaciones: {ranking.me.referral_points}</p></div>
    <div className="rounded-3xl border border-orange/40 bg-orange/10 p-4"><h2 className="font-bold">{ranking.rules.prize.title}</h2><p className="mt-2 text-sm text-muted">{ranking.rules.prize.description}</p></div>
    <form key={`${ranking.me.alias}-${ranking.me.participating}`} onSubmit={save} className="glass flex flex-col gap-3 rounded-3xl p-4"><h2 className="font-bold">Tu participación es voluntaria</h2><Field label="Alias público del ranking"><input name="alias" defaultValue={ranking.me.alias ?? ""} minLength={3} maxLength={24} autoComplete="off" className={INPUT_CLASS} /></Field><label className="flex items-start gap-3 text-sm"><input name="participate" type="checkbox" defaultChecked={ranking.me.participating} className="mt-1 h-5 w-5" />Quiero aparecer con este alias y mis puntos en el ranking</label><p className="text-xs text-muted">No se muestra tu email, ubicación, compras ni lista de invitados. Salir oculta tu alias también en meses anteriores.</p><PrimaryButton disabled={busy}>Guardar participación</PrimaryButton></form>
    {notice && <p role="status" className="text-sm text-lime">{notice}</p>}{error && <ErrorText>{error}</ErrorText>}
    <section className="flex flex-col gap-3"><h2 className="text-xl font-bold">Clasificación mensual</h2>{ranking.entries.length ? <ol className="flex flex-col gap-2">{ranking.entries.map((entry) => <li key={entry.alias} className="glass flex items-center gap-3 rounded-2xl p-4"><b className="text-orange-soft">{entry.position}</b><span className="flex-1 break-words">{entry.alias}</span><b>{entry.points} pts</b></li>)}</ol> : <p className="text-sm text-muted">Todavía no hay participantes con puntos en este mes.</p>}<p className="text-xs text-muted">Los empates comparten posición. Las anulaciones pueden corregir puntuaciones de meses anteriores. No hay ganador ni premio real asignado automáticamente.</p></section>
    <button type="button" onClick={() => setExample(!example)} className="min-h-11 text-left text-sm text-orange-soft underline">{example ? "Ocultar ejemplo ficticio" : "Ver ejemplo ficticio del ranking"}</button>{example && <div className="rounded-3xl border border-dashed border-white/30 p-4 text-sm"><p className="mb-3 font-bold">Solo demo · No son usuarios ni puntos reales</p><ol className="flex flex-col gap-2"><li>1 · NocheNaranja · 80 pts</li><li>2 · RutaMusical · 60 pts</li><li>2 · TardeoLima · 60 pts</li></ol></div>}<RewardsRules />
  </section>;
}
