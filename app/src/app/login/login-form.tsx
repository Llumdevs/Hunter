"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { HunterLogo } from "@/components/logo";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Step = { name: "email" } | { name: "code"; email: string };

const CODE_LENGTH = 6;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "email" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    const { error: otpError } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (otpError) return setError("No hemos podido enviar el código. Revisa el email e inténtalo de nuevo.");
    setStep({ name: "code", email });
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>, email: string) {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget).get("code")).trim();
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (verifyError || !data.user) {
      setBusy(false);
      return setError("El código no es correcto o ha caducado.");
    }
    // Ir directamente al paso que toca: si falta el perfil, el alta; si no, el destino.
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    router.replace(profile ? next : `/perfil/nuevo?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <section className="flex flex-1 flex-col justify-center gap-8">
      <header className="flex flex-col gap-2">
        <HunterLogo className="h-8 text-fg" />
        <h1 className="text-[32px] leading-tight font-extrabold uppercase">Entra en Hunter</h1>
        <p className="text-muted">Sin contraseñas: te enviamos un código.</p>
      </header>
      {step.name === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Field label="Tu email">
            <input name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
          </Field>
          <PrimaryButton disabled={busy}>Enviarme un código</PrimaryButton>
        </form>
      ) : (
        <form onSubmit={(event) => verifyCode(event, step.email)} className="flex flex-col gap-4">
          <p className="text-muted">Te hemos enviado un código de {CODE_LENGTH} cifras a <b className="text-fg">{step.email}</b>.</p>
          <input name="code" inputMode="numeric" autoComplete="one-time-code" required
            pattern={`\\d{${CODE_LENGTH}}`} maxLength={CODE_LENGTH} aria-label="Código"
            className={`${INPUT_CLASS} h-16 text-center text-3xl font-bold tracking-[0.5em]`} />
          <PrimaryButton disabled={busy}>Entrar</PrimaryButton>
          <button type="button" className="text-sm text-muted underline" onClick={() => setStep({ name: "email" })}>
            Usar otro email
          </button>
        </form>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
