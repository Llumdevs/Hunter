"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText, LinkButton, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = { placeId: string; signedUp: boolean; loggedIn: boolean; price: string; available?: boolean };

const FLOATING = "fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md booking-bar px-6 pt-4 pb-6";

export function SignupButton({ placeId, signedUp, loggedIn, price, available = true }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!available && !signedUp) return <div className={FLOATING}><p className="text-center text-sm text-muted">Las prelistas no están disponibles en este momento.</p></div>;

  if (!loggedIn) {
    return <div className={FLOATING}><LinkButton href={`/login?next=${encodeURIComponent(`/local/${placeId}`)}`}>Entra para apuntarte</LinkButton></div>;
  }
  if (signedUp) {
    return (
      <div className={FLOATING}>
        <Link href="/planes" className="glass flex h-14 items-center justify-center rounded-full font-bold">
          ✓ Apuntado · ver en Mis planes
        </Link>
      </div>
    );
  }

  async function signUp() {
    setBusy(true);
    const { data, error } = await createSupabaseBrowserClient().rpc("sign_up", { p_place_id: placeId });
    setBusy(false);
    const ok = !error && (data as { ok?: boolean } | null)?.ok === true;
    setFailed(!ok);
    if (ok) router.refresh();
  }

  return (
    <div className={`${FLOATING} flex flex-col gap-2`}>
      <p className="text-xs text-muted">Presupuesto del local: <b className="text-fg">{price}</b> · Apuntarse no es una compra</p>
      {failed && <ErrorText>No hemos podido apuntarte. Inténtalo de nuevo.</ErrorText>}
      <PrimaryButton disabled={busy} onClick={signUp}>Apuntarme a la prelista</PrimaryButton>
    </div>
  );
}
