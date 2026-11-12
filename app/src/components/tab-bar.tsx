"use client";

import { Map, Moon, ScanLine, Ticket, Gift } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Esta noche", Icon: Moon },
  { href: "/mapa", label: "Mapa", Icon: Map },
  { href: "/planes", label: "Mis planes", Icon: Ticket },
  { href: "/invitaciones", label: "Invitar", Icon: Gift },
] as const;

function Tab({ href, label, Icon, active }: (typeof TABS)[number] & { active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={`flex w-16 flex-col items-center gap-1 rounded-full py-2 text-[10px] font-semibold transition-colors ${active ? "bg-lime/10 text-lime" : "text-muted"}`}>
      <Icon aria-hidden className={`h-5 w-5 ${active ? "text-lime" : ""}`} />
      {label}
    </Link>
  );
}

// Barra inferior flotante; el botón central siempre abre el escáner.
export function TabBar() {
  const pathname = usePathname();
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];
  return (
    <>
      <div aria-hidden className="h-28" />
      <nav aria-label="Navegación principal"
        className="bottom-dock fixed inset-x-0 bottom-4 z-20 mx-auto flex h-[72px] w-[calc(100%-2rem)] max-w-md items-center justify-around rounded-full border border-white/15 bg-night-950/85 px-2 shadow-[0_12px_40px_#0008] backdrop-blur-2xl">
        {left.map((tab) => <Tab key={tab.href} {...tab} active={pathname === tab.href} />)}
        <Link href="/escanear" aria-label="Escanear QR"
          className="-mt-9 grid h-16 w-16 place-items-center rounded-full border-[5px] border-night-900 bg-lime text-night-950 shadow-[0_0_28px_#d6ff3f33]">
          <ScanLine aria-hidden className="h-7 w-7" />
        </Link>
        {right.map((tab) => <Tab key={tab.href} {...tab} active={pathname === tab.href} />)}
      </nav>
    </>
  );
}
