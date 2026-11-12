"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AGE_BANDS, MUSIC, PRICES, VIBES, type Option } from "@/lib/tonight/catalog";
import type { Preferences } from "@/lib/tonight/recommend";

type Props = { initial: Preferences; next: string; onboarding: boolean };

const GROUPS: { name: keyof Preferences; legend: string; options: Option[] }[] = [
  { name: "music", legend: "Música", options: MUSIC },
  { name: "vibe", legend: "Ambiente", options: VIBES },
  { name: "price", legend: "Presupuesto", options: PRICES },
  { name: "age_bands", legend: "Gente de", options: AGE_BANDS },
];

export function PreferencesForm({ initial, next, onboarding }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(GROUPS.map((g) => [g.name, form.getAll(g.name).map(String)])) as Preferences;
    setBusy(true);
    const { error } = await createSupabaseBrowserClient()
      .from("user_preferences")
      .upsert({ ...values, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setFailed(true);
    router.replace(next);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-extrabold uppercase">¿Qué te gusta<br /><span className="text-muted">cuando sales?</span></h1>
        <p className="text-sm text-muted">Elige todo lo que quieras. Lo usamos para decirte qué sitios encajan contigo; puedes cambiarlo cuando quieras.</p>
      </header>
      <form onSubmit={save} className="flex flex-col gap-6">
        {GROUPS.map((group) => (
          <fieldset key={group.name} className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-bold text-muted uppercase">{group.legend}</legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <label key={option.value}>
                  <input type="checkbox" name={group.name} value={option.value} className="peer sr-only"
                    defaultChecked={initial[group.name].includes(option.value)} />
                  <span className="glass inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <PrimaryButton disabled={busy}>Guardar mis gustos</PrimaryButton>
        {onboarding && <Link href={next} className="text-center text-sm text-muted underline">Saltar por ahora</Link>}
      </form>
      {failed && <ErrorText>No hemos podido guardar tus gustos. Inténtalo de nuevo.</ErrorText>}
    </section>
  );
}
