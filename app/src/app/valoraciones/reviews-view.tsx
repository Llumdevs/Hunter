"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { pilotResult, type Visit } from "@/lib/pilot/data";

export function ReviewsView({ visits }: { visits: Visit[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function review(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(null); setNotice(null);
    try {
      const { data, error: apiError } = await createSupabaseBrowserClient().rpc("review_visit", {
        p_checkin: id, p_rating: Number(form.get("rating")), p_comment: String(form.get("comment") ?? ""),
      });
      const message = pilotResult(data, !!apiError);
      if (message) return setError(message);
      setNotice("Valoración guardada. Has ganado 5 puntos.");
      router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <section className="flex flex-col gap-5">
    <h1 className="text-3xl font-extrabold">Valora tus visitas</h1>
    <p className="text-sm text-muted">Solo puedes valorar visitas con check-in verificado, una vez por visita. Cada valoración suma 5 puntos del piloto. Tu comentario no es público.</p>
    {notice && <p role="status" className="text-sm text-lime">{notice}</p>}
    {error && <ErrorText>{error}</ErrorText>}
    {visits.length === 0 && <p className="glass rounded-3xl p-5 text-muted">Aún no tienes visitas verificadas. Haz check-in en un local para poder valorarlo.</p>}
    {visits.map((visit) => <article key={visit.id} className="glass flex flex-col gap-3 rounded-3xl p-5">
      <h2 className="text-lg font-bold">{visit.place_name}</h2><p className="text-sm text-muted">Noche del {visit.night_date}</p>
      {visit.rating !== null ? <p className="font-bold text-lime">Tu valoración: {visit.rating} de 5 ★</p> : <form onSubmit={(event) => review(event, visit.id)} className="flex flex-col gap-3">
        <Field label={`Puntuación de ${visit.place_name}`}><select name="rating" defaultValue="5" className="rounded-xl border border-white/20 bg-night-900 p-3">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} de 5 ★</option>)}</select></Field>
        <Field label="Comentario (opcional)"><textarea name="comment" maxLength={500} rows={3} className="glass rounded-2xl p-4" /></Field>
        <PrimaryButton disabled={busy}>Guardar valoración</PrimaryButton>
      </form>}
    </article>)}
  </section>;
}
