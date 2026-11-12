"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { HunterLogo } from "@/components/logo";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { loginErrorMessage } from "@/lib/auth/login-errors";

type Step = { name: "email" } | { name: "code"; email: string };

const CODE_LENGTH = 6;

export function LoginForm({ next, initialError = null }: { next: string; initialError?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "email" });
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  async function continueToProfile(supabase: ReturnType<typeof createSupabaseBrowserClient>, userId: string) {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (profileError) return setError(loginErrorMessage("profile_failed"));
    // Refresca el árbol del servidor para leer la sesión recién guardada en cookies.
    router.replace(profile ? next : `/perfil/nuevo?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  async function tryAsGuest() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      // Reutiliza la sesión si vuelve al login: no crea un invitado en cada visita.
      const { data: current } = await supabase.auth.getUser();
      if (current.user) return await continueToProfile(supabase, current.user.id);
      const { data, error: guestError } = await supabase.auth.signInAnonymously();
      if (guestError || !data.user) return setError(loginErrorMessage(guestError?.code));
      await continueToProfile(supabase, data.user.id);
    } catch {
      setError(loginErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      const { error: otpError } = await createSupabaseBrowserClient().auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: callback.toString() },
      });
      if (otpError) return setError(loginErrorMessage(otpError.code));
      setStep({ name: "code", email });
    } catch {
      setError(loginErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>, email: string) {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget).get("code")).trim();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (verifyError || !data.user) return setError("El código no es correcto o ha caducado.");
      await continueToProfile(supabase, data.user.id);
    } catch {
      setError(loginErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login-stage flex flex-1 flex-col justify-center gap-8 py-8">
      <header className="flex flex-col gap-2">
        <HunterLogo className="h-8 text-fg" />
        <p className="eyebrow mt-8 text-lime">Tu noche empieza aquí</p><h1 className="text-[42px] leading-none font-black tracking-tight">Entra en Hunter</h1>
        <p className="text-muted">Sin contraseñas: te enviamos un enlace para entrar.</p>
      </header>
      {step.name === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Field label="Tu email">
            <input name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
          </Field>
          <PrimaryButton disabled={busy}>Enviarme un enlace</PrimaryButton>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div role="status" className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Revisa tu correo</h2>
            <p className="text-muted">Te hemos enviado un enlace a <b className="text-fg">{step.email}</b>. Ábrelo para continuar.</p>
            <p className="text-sm text-muted">Usa el mismo navegador donde has pedido el enlace y revisa también la carpeta de spam. Si estás en la app del iPhone y el correo abre Safari, continúa allí.</p>
          </div>
          <details>
            <summary className="cursor-pointer text-sm underline">¿Has recibido un código en lugar de un enlace?</summary>
            <form onSubmit={(event) => verifyCode(event, step.email)} className="mt-4 flex flex-col gap-4">
              <p className="text-muted">Introduce el código de {CODE_LENGTH} cifras.</p>
              <input name="code" inputMode="numeric" autoComplete="one-time-code" required
                pattern={`\\d{${CODE_LENGTH}}`} maxLength={CODE_LENGTH} aria-label="Código"
                className={`${INPUT_CLASS} h-16 text-center text-3xl font-bold tracking-[0.5em]`} />
              <PrimaryButton disabled={busy}>Entrar</PrimaryButton>
            </form>
          </details>
          <button type="button" className="text-sm text-muted underline" disabled={busy} onClick={() => { setError(null); setStep({ name: "email" }); }}>
            Volver a intentarlo o usar otro email
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t border-white/15 pt-5">
        <button type="button" disabled={busy} onClick={tryAsGuest}
          className="glass min-h-12 rounded-full px-5 py-3 font-bold disabled:opacity-50">
          Probar sin correo
        </button>
        <p className="text-xs text-muted">Acceso de invitado para probar Hunter. La sesión queda en este navegador: si cierras sesión o borras sus datos, no podrás recuperarla.</p>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
