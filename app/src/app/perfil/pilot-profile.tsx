"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { pilotResult, type PilotProfile } from "@/lib/pilot/data";

export function PilotProfileDetails({ profile }: { profile: PilotProfile }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>, kind: "city" | "feedback") {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError(null); setNotice(null);
    try {
      const client = createSupabaseBrowserClient();
      const { data, error: apiError } = kind === "city"
        ? await client.rpc("update_my_city", { p_city: String(values.get("city") ?? "") })
        : await client.rpc("send_pilot_feedback", { p_message: String(values.get("message") ?? "") });
      const message = pilotResult(data, !!apiError);
      if (message) return setError(message);
      setNotice(kind === "city" ? "Procedencia guardada." : "Gracias. Hemos guardado tu opinión.");
      if (kind === "feedback") form.reset();
      router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }

  return <div className="flex flex-col gap-5">
    <dl className="glass grid grid-cols-2 gap-3 rounded-3xl p-5 text-sm">
      {[["Contacto", profile.contact || "Invitado"], ["Edad", `${profile.age} años`], ["De", profile.home_city || "Sin indicar"], ["Puntos", profile.points], ["Planes apuntados", profile.signups], ["Check-ins", profile.checkins], ["Valoraciones", profile.reviews]].map(([label, value]) => <div key={label} className="contents"><dt className="text-muted">{label}</dt><dd className="break-words text-right font-semibold">{value}</dd></div>)}
    </dl>
    <p className="text-xs text-muted">Puntos por compras validadas e invitaciones cualificadas, con límites. Los check-ins y las valoraciones no suman puntos nuevos. Consulta las reglas en Ranking mensual.</p>
    {profile.legacy_points > 0 && <p className="text-xs text-muted">Histórico anterior: {profile.legacy_points} puntos. Se conservan como referencia y no cuentan para el ranking.</p>}
    <form onSubmit={(event) => save(event, "city")} className="glass flex flex-col gap-3 rounded-3xl p-5">
      <Field label="¿De dónde eres? (opcional)"><input name="city" defaultValue={profile.home_city ?? ""} maxLength={80} autoComplete="address-level2" className={INPUT_CLASS} /></Field>
      <PrimaryButton disabled={busy}>Guardar procedencia</PrimaryButton>
    </form>
    <form onSubmit={(event) => save(event, "feedback")} className="glass flex flex-col gap-3 rounded-3xl p-5">
      <h2 className="text-lg font-bold">Tu opinión sobre el piloto</h2>
      <Field label="¿Qué cambiarías o qué echas en falta?"><textarea name="message" required minLength={10} maxLength={2000} rows={4} className="glass rounded-2xl p-4" /></Field>
      <PrimaryButton disabled={busy}>Enviar opinión</PrimaryButton>
    </form>
    {notice && <p role="status" className="text-sm text-lime">{notice}</p>}
    {error && <ErrorText>{error}</ErrorText>}
  </div>;
}
