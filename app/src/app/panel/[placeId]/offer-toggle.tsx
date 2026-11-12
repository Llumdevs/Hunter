"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Estado propio y optimista: no depende de que termine router.refresh() para el siguiente toque.
// El padre lo monta con key={`${id}-${active}`}: cuando cambia el dato del servidor, se reinicia.
export function OfferToggle({ offerId, title, active }: { offerId: string; title: string; active: boolean }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(active);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);


  async function toggle() {
    const next = !isActive;
    setIsActive(next);
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().from("offers").update({ is_active: next }).eq("id", offerId);
    setBusy(false);
    setFailed(Boolean(error));
    if (error) return setIsActive(!next);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button" role="switch" aria-checked={isActive} aria-label={`Oferta activa: ${title}`} disabled={busy} onClick={toggle}
        className={`relative h-8 w-14 flex-none rounded-full transition ${isActive ? "bg-violet" : "bg-[#ddd5ce]"} disabled:opacity-60`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${isActive ? "right-1" : "left-1"}`} />
      </button>
      <span className="text-[11px] text-muted">{isActive ? "Activa" : "Pausada"}</span>
      {failed && <span role="alert" className="text-xs text-rose">No se ha podido cambiar</span>}
    </div>
  );
}
