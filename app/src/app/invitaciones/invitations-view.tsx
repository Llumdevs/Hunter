"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { RewardsRules } from "@/components/rewards/rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { rewardsError, type Referrals } from "@/lib/rewards/data";

export function InvitationsView({ referrals }: { referrals: Referrals }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const code = String(new FormData(event.currentTarget).get("code") ?? "").trim().toLowerCase();
    setBusy(true); setError(null); setNotice(null);
    try { const response = await createSupabaseBrowserClient().rpc("claim_referral", { p_code: code }); const message = rewardsError(response.data, !!response.error); if (message) return setError(message); setNotice("Código asociado. La invitación se premiará tras tu primera compra validada."); router.refresh(); }
    catch { setError("No hemos podido conectar. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(referrals.code); setNotice("Código copiado. Puedes enviarlo a quien invites."); } catch { setNotice("Selecciona el código para copiarlo."); } }
  return <section className="flex flex-col gap-5"><h1 className="text-3xl font-extrabold">Invita con tu código</h1><p className="text-sm text-muted">Comparte tu código y suma puntos por invitaciones que terminan en una compra validada. No hay perfiles de amigos, solicitudes ni chat.</p><div className="glass flex flex-col gap-3 rounded-3xl p-5"><p className="font-bold">Tu código de invitación</p><code className="select-all break-all text-xl text-lime">{referrals.code}</code><button type="button" onClick={copy} className="min-h-11 text-left font-bold text-violet-soft">Copiar código</button></div><dl className="glass grid grid-cols-2 gap-3 rounded-3xl p-5"><dt>Invitaciones asociadas</dt><dd className="text-right font-bold">{referrals.invited_count}</dd><dt>Invitaciones premiadas</dt><dd className="text-right font-bold">{referrals.rewarded_count}</dd><dt>Puntos de invitación este mes</dt><dd className="text-right font-bold">{referrals.monthly_referral_points}</dd></dl>
    {referrals.can_claim ? <form onSubmit={claim} className="flex flex-col gap-3"><Field label="Código de quien te invitó"><input name="code" required pattern="[a-fA-F0-9]{16}" minLength={16} maxLength={16} autoComplete="off" className={INPUT_CLASS} /></Field><p className="text-xs text-muted">Asócialo antes de tu primera compra validada. Solo puedes asociar uno y no se puede cambiar.</p><PrimaryButton disabled={busy}>Asociar invitación</PrimaryButton></form> : <p className="text-sm text-muted">{referrals.has_inviter ? "Ya tienes una invitación asociada." : "Ya has realizado una compra validada y no puedes asociar un código retroactivamente."}</p>}
    {notice && <p role="status" className="text-sm text-lime">{notice}</p>}{error && <ErrorText>{error}</ErrorText>}<RewardsRules /></section>;
}
