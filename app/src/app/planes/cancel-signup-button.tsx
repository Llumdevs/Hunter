"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function CancelSignupButton({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    setBusy(true);
    await createSupabaseBrowserClient().rpc("cancel_signup", { p_place_id: placeId });
    setBusy(false);
    router.refresh();
  }
  return (
    <button type="button" disabled={busy} onClick={cancel} className="text-sm text-muted underline">
      Cancelar
    </button>
  );
}
