"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, User, SlidersHorizontal, Star, FlaskConical, ShieldCheck, LogOut, Store } from "lucide-react";
import { HunterLogo } from "@/components/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const LINKS = [
  { href: "/perfil", label: "Mi perfil", Icon: User },
  { href: "/perfil/gustos", label: "Mis gustos", Icon: SlidersHorizontal },
  { href: "/valoraciones", label: "Mis valoraciones", Icon: Star },
  { href: "/demo", label: "Pruebas y datos demo", Icon: FlaskConical },
  { href: "/panel", label: "Panel de locales", Icon: Store },
  { href: "/privacidad", label: "Privacidad", Icon: ShieldCheck },
];

export function SideMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => () => { document.body.style.overflow = previousOverflow.current; }, []);

  function open() {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
    document.body.style.overflow = previousOverflow.current;
    trigger.current?.focus();
  }
  async function logOut() {
    setBusy(true); setError(null);
    try {
      const { error: authError } = await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
      if (authError) return setError("No hemos podido cerrar sesión. Vuelve a intentarlo.");
      close(); router.replace("/"); router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }

  return <>
    <header className="mb-5 flex items-center justify-between gap-4">
      <Link href="/" aria-label="Hunter · inicio"><HunterLogo className="h-7 text-fg" /></Link>
      <button ref={trigger} type="button" aria-label="Abrir menú" aria-haspopup="dialog" onClick={open} className="glass grid h-11 w-11 place-items-center rounded-full">
        <Menu aria-hidden className="h-5 w-5" />
      </button>
    </header>
    <dialog ref={dialog} aria-labelledby="side-menu-title" onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => { document.body.style.overflow = previousOverflow.current; }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(86vw,360px)] max-w-none border-l border-white/15 bg-night-950 p-0 text-fg shadow-2xl backdrop:bg-black/65">
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
        <div className="flex items-center justify-between"><h2 id="side-menu-title" className="text-xl font-extrabold">Tu Hunter</h2><button type="button" onClick={close} aria-label="Cerrar menú" className="grid h-11 w-11 place-items-center rounded-full border border-white/15"><X aria-hidden className="h-5 w-5" /></button></div>
        <nav aria-label="Opciones de cuenta" className="flex flex-col gap-2">
          {LINKS.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={close} className="glass flex min-h-14 items-center gap-3 rounded-2xl px-4"><Icon aria-hidden className="h-5 w-5 text-orange-soft" />{label}</Link>)}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-white/15 pt-5">
          <p className="text-xs text-muted">Si estás probando como invitado, cerrar sesión te hará perder el acceso a esa cuenta.</p>
          <button type="button" disabled={busy} onClick={logOut} className="flex min-h-12 items-center gap-3 font-semibold text-orange-soft"><LogOut aria-hidden className="h-5 w-5" />{busy ? "Saliendo…" : "Salir"}</button>
          {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        </div>
      </div>
    </dialog>
  </>;
}
