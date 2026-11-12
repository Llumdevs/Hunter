"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { validateOfferInput, type OfferError, type OfferRow } from "@/lib/venue/offer-input";
import { WEEKDAY_LABELS } from "@/lib/venue/weekdays";

const OFFER_ERROR_MESSAGES: Record<OfferError, string> = {
  title_required: "Escribe un título.",
  title_too_long: "El título puede tener como máximo 80 caracteres.",
  description_too_long: "La descripción puede tener como máximo 200 caracteres.",
  days_required: "Elige al menos un día.",
  days_invalid: "Hay un día no válido.",
  valid_until_invalid: "La hora límite no es válida.",
};

type Props = { placeId: string; offerId?: string; initial?: OfferRow };

const DAY_INPUT = "h-14 rounded-2xl border border-[#ece6e0] bg-day-card px-4 text-base focus:outline-2 focus:outline-violet";

export function OfferForm({ placeId, offerId, initial }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const validation = validateOfferInput({
      title: String(form.get("title")),
      description: String(form.get("description")),
      includesAlcohol: form.get("includesAlcohol") === "on",
      daysOfWeek: form.getAll("days").map(Number),
      validUntil: String(form.get("validUntil")),
    });
    if (validation.kind === "invalid") return setErrors(validation.errors.map((code) => OFFER_ERROR_MESSAGES[code]));

    setBusy(true);
    const offers = createSupabaseBrowserClient().from("offers");
    const { error } = offerId
      ? await offers.update(validation.offer).eq("id", offerId)
      : await offers.insert({ ...validation.offer, place_id: placeId });
    setBusy(false);
    if (error) return setErrors(["No se ha podido guardar la oferta."]);
    router.replace(`/panel/${placeId}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Título">
        <input name="title" required maxLength={80} defaultValue={initial?.title} className={DAY_INPUT} />
      </Field>
      <Field label="Descripción (opcional)">
        <textarea name="description" maxLength={200} defaultValue={initial?.description ?? ""} className={`${DAY_INPUT} h-24 py-3`} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-muted">Días</legend>
        <div className="flex gap-2">
          {WEEKDAY_LABELS.map((label, index) => (
            <label key={label} className="flex-1">
              <input type="checkbox" name="days" value={index + 1} aria-label={`Día ${label}`} className="peer sr-only"
                defaultChecked={initial?.days_of_week.includes(index + 1) ?? true} />
              <span className="grid h-11 place-items-center rounded-full bg-day-card font-bold peer-checked:bg-violet peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Válida hasta (opcional, p. ej. 01:00)">
        <input name="validUntil" type="time" defaultValue={initial?.valid_until_time?.slice(0, 5) ?? ""} className={DAY_INPUT} />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl bg-day-card p-4">
        <input name="includesAlcohol" type="checkbox" defaultChecked={initial?.includes_alcohol ?? false} className="h-5 w-5 accent-violet" />
        <span className="text-sm">Incluye bebida alcohólica (se mostrará un aviso de salud)</span>
      </label>
      <p className="rounded-2xl bg-tile-lime p-3 text-sm">Consejo: las ofertas que no son solo alcohol (tapa, entrada, sin cola) funcionan igual de bien.</p>
      <PrimaryButton disabled={busy}>Guardar oferta</PrimaryButton>
      {errors.map((message) => <ErrorText key={message}>{message}</ErrorText>)}
    </form>
  );
}
