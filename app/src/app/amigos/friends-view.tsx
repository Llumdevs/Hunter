"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorText, Field, INPUT_CLASS, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { pilotResult, type Friend } from "@/lib/pilot/data";
import { DemoFriends } from "@/components/demo/demo-panels";

export function FriendsView({ friends, code }: { friends: Friend[]; code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function change(action: "request" | "accept" | "remove", value: string) {
    setBusy(true); setError(null); setNotice(null);
    try {
      const client = createSupabaseBrowserClient();
      const { data, error: apiError } = action === "request"
        ? await client.rpc("request_friend", { p_code: value.trim() })
        : await client.rpc("respond_friend", { p_request: value, p_accept: action === "accept" });
      const message = pilotResult(data, !!apiError);
      if (message) return setError(message);
      setNotice(action === "request" ? "Solicitud enviada." : action === "accept" ? "Solicitud aceptada." : "Solicitud o amistad eliminada.");
      router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void change("request", String(new FormData(event.currentTarget).get("code") ?? ""));
  }
  const incoming = friends.filter((friend) => friend.status === "pending" && friend.incoming).length;
  return <section className="flex flex-col gap-5">
    <h1 className="text-3xl font-extrabold">Amigos{incoming ? ` · ${incoming} solicitud${incoming === 1 ? "" : "es"}` : ""}</h1>
    <div className="glass flex flex-col gap-2 rounded-3xl p-5">
      <p className="font-bold">Tu código de amigo</p><code className="select-all break-all text-lg text-lime">{code}</code>
      <p className="text-xs text-muted">Compártelo con quien quieras añadir. Solo veréis vuestros nombres y la relación de amistad; no se comparte ubicación, email ni planes.</p>
    </div>
    <form onSubmit={request} className="flex flex-col gap-3">
      <Field label="Código de tu amigo"><input name="code" required minLength={16} maxLength={16} pattern="[a-fA-F0-9]{16}" autoComplete="off" className={INPUT_CLASS} /></Field>
      <PrimaryButton disabled={busy}>Enviar solicitud</PrimaryButton>
    </form>
    {notice && <p role="status" className="text-sm text-lime">{notice}</p>}
    {error && <ErrorText>{error}</ErrorText>}
    {friends.length === 0 && <p className="text-muted">Todavía no tienes amigos ni solicitudes. Intercambiad vuestros códigos para empezar.</p>}
    <ul className="flex flex-col gap-3">
      {friends.map((friend) => <li key={friend.id} className="glass flex flex-col gap-3 rounded-3xl p-4">
        <h2 className="font-bold">{friend.name}</h2>
        <p className="text-sm text-muted">{friend.status === "accepted" ? "Amistad aceptada" : friend.incoming ? "Te ha enviado una solicitud" : "Solicitud enviada · pendiente"}</p>
        <div className="flex gap-4 text-sm">
          {friend.status === "pending" && friend.incoming && <button disabled={busy} onClick={() => change("accept", friend.id)} className="min-h-11 font-bold text-lime">Aceptar</button>}
          <button disabled={busy} onClick={() => change("remove", friend.id)} className="min-h-11 text-muted underline">{friend.status === "accepted" ? "Eliminar amistad" : friend.incoming ? "Rechazar" : "Cancelar solicitud"}</button>
        </div>
      </li>)}
    </ul>
    <DemoFriends />
  </section>;
}
