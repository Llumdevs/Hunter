"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText, SecondaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AccountActions() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function logOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return setFailed(true);
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <SecondaryButton onClick={logOut}>Cerrar sesión</SecondaryButton>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose/40 bg-rose/10 p-4">
          <p className="text-sm">Se borrarán tu cuenta, tus gustos, tus prelistas y tu historial. No se puede deshacer.</p>
          <button type="button" onClick={deleteAccount} className="h-12 rounded-full bg-rose font-bold text-night-950">Sí, borrar mi cuenta</button>
          <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted underline">Cancelar</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-sm text-muted underline">Borrar mi cuenta</button>
      )}
      {failed && <ErrorText>No hemos podido borrar la cuenta. Inténtalo de nuevo.</ErrorText>}
    </div>
  );
}
