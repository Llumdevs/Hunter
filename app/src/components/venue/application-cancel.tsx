"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { onboardingError, onboardingResultSchema } from "@/lib/venue/onboarding";

export function ApplicationCancel({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function cancel() {
    setBusy(true); setError(null);
    try {
      const { data, error: apiError } = await createSupabaseBrowserClient().rpc("cancel_venue_application", { p_id: id });
      const result = onboardingResultSchema.safeParse(data);
      if (apiError || !result.success || !result.data.ok) return setError(onboardingError(result.success ? result.data.error : undefined));
      router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <div><button disabled={busy} onClick={cancel} className="min-h-11 text-sm text-muted underline">Cancelar solicitud de alta</button>{error && <p role="alert" className="text-sm text-rose">{error}</p>}</div>;
}
