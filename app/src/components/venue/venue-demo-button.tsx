"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorText, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { onboardingError, onboardingResultSchema } from "@/lib/venue/onboarding";

export function VenueDemoButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function createDemo() {
    setBusy(true); setError(null);
    try {
      const { data, error: apiError } = await createSupabaseBrowserClient().rpc("create_my_demo_venue");
      const result = onboardingResultSchema.safeParse(data);
      if (apiError || !result.success || !result.data.ok || !result.data.place_id) return setError(onboardingError(result.success ? result.data.error : undefined));
      router.push(`/panel/${result.data.place_id}`); router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-3"><PrimaryButton disabled={busy} onClick={createDemo}>{busy ? "Preparando tu local…" : "Crear mi local demo"}</PrimaryButton>{error && <ErrorText>{error}</ErrorText>}</div>;
}
