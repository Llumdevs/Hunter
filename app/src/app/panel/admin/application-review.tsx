"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { onboardingError, onboardingResultSchema, type VenueApplication } from "@/lib/venue/onboarding";

export function ApplicationReview({ application }: { application: VenueApplication }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const approve = form.get("decision") === "approve";
    const note = String(form.get("note") ?? "").trim();
    if (approve && form.get("confirmed") !== "on") return setError("Confirma que has revisado el local antes de publicarlo.");
    if (!approve && note.length < 10) return setError("Escribe un motivo de rechazo de al menos 10 caracteres.");
    setBusy(true); setError(null);
    try {
      const { data, error: apiError } = await createSupabaseBrowserClient().rpc("review_venue_application", { p_id: application.id, p_approve: approve, p_note: note });
      const result = onboardingResultSchema.safeParse(data);
      if (apiError || !result.success || !result.data.ok) return setError(onboardingError(result.success ? result.data.error : undefined));
      router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  const details = application.details;
  return <article className="flex flex-col gap-3 rounded-3xl bg-day-card p-5"><h2 className="text-xl font-bold">{details.name}</h2><p className="text-sm">{details.address} · {details.zone} · {details.kind} · {details.price}</p><p className="text-sm text-muted">Contacto: {details.contact}</p><p className="text-sm text-muted">Coordenadas: {details.lat}, {details.lng} · {details.opens_at}–{details.closes_at} · Días ISO: {details.days.join(", ")}</p>
    <form onSubmit={decide} className="flex flex-col gap-3"><label className="flex flex-col gap-1 text-sm">Decisión<select name="decision" defaultValue="approve" className="min-h-12 rounded-xl border border-[#ece6e0] p-3"><option value="approve">Aprobar y publicar</option><option value="reject">Rechazar</option></select></label><label className="flex flex-col gap-1 text-sm">Mensaje al solicitante<textarea name="note" maxLength={500} rows={3} className="rounded-xl border border-[#ece6e0] p-3" /></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmed" className="mt-1" /><span>He revisado la información y autorizo la publicación si apruebo.</span></label><button disabled={busy} className="min-h-12 rounded-full bg-violet p-3 font-bold text-white">Confirmar decisión</button></form>
    {error && <ErrorText>{error}</ErrorText>}
  </article>;
}
