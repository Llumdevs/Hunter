"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { validateProfileInput, type ProfileError } from "@/lib/profile/validate";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const PROFILE_ERROR_MESSAGES: Record<ProfileError, string> = {
  name_required: "Escribe tu nombre.",
  name_too_long: "El nombre puede tener como máximo 60 caracteres.",
  birthdate_invalid: "La fecha de nacimiento no es válida.",
  underage: "Hunter es solo para mayores de 18 años.",
};

export function ProfileForm({ userId, next }: { userId: string; next: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const validation = validateProfileInput(
      { displayName: String(form.get("displayName")), birthdate: String(form.get("birthdate")) },
      new Date(),
    );
    if (validation.kind === "invalid") return setErrors(validation.errors.map((code) => PROFILE_ERROR_MESSAGES[code]));

    setBusy(true);
    const { error } = await createSupabaseBrowserClient().from("profiles").insert({
      id: userId,
      display_name: validation.profile.displayName,
      birthdate: validation.profile.birthdate,
      locale: "es",
    });
    setBusy(false);
    if (error) return setErrors(["No hemos podido guardar tu perfil. Inténtalo de nuevo."]);
    // Desde la portada, pedimos los gustos; si viene de escanear un QR en la barra, sin pasos de más.
    router.replace(next === "/" ? "/perfil/gustos?inicio=1&next=%2F" : next);
    router.refresh();
  }

  return (
    <section className="flex flex-1 flex-col justify-center gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-tight font-extrabold uppercase">Cuéntanos<br /><span className="text-muted">quién eres</span></h1>
        <p className="text-muted">Solo lo necesario. Tu edad nunca se muestra a nadie: los locales solo ven rangos agregados.</p>
      </header>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Field label="Nombre">
          <input name="displayName" required maxLength={60} autoComplete="given-name" className={INPUT_CLASS} />
        </Field>
        <Field label="Fecha de nacimiento (solo mayores de 18)">
          <input name="birthdate" type="date" required className={`${INPUT_CLASS} [color-scheme:dark]`} />
        </Field>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input name="privacy" type="checkbox" required className="mt-0.5 h-5 w-5 accent-violet" />
          <span>He leído la <Link href="/privacidad" className="text-fg underline">política de privacidad</Link>.</span>
        </label>
        <PrimaryButton disabled={busy}>Continuar</PrimaryButton>
      </form>
      {errors.map((message) => <ErrorText key={message}>{message}</ErrorText>)}
    </section>
  );
}
