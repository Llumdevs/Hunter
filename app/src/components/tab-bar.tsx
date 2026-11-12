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
      className={`flex w-16 flex-col items-center gap-1 rounded-full py-2 text-[10px] font-semibold transition-colors ${active ? "text-orange" : "text-muted"}`}>
      <Icon aria-hidden className={`h-5 w-5 ${active ? "text-orange" : ""}`} />
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
        className="bottom-dock fixed inset-x-0 bottom-4 z-20 mx-auto flex h-[64px] w-[calc(100%-2rem)] max-w-md items-center justify-around rounded-[32px] border border-white/10 bg-night-800/80 px-2 shadow-[0_12px_40px_#0008] backdrop-blur-2xl">
        {left.map((tab) => <Tab key={tab.href} {...tab} active={pathname === tab.href} />)}
        <Link href="/escanear" aria-label="Escanear QR"
          className="grid h-12 w-12 place-items-center rounded-full border border-orange/30 bg-orange/15 text-orange">
          <ScanLine aria-hidden className="h-5 w-5" />
        </Link>
        {right.map((tab) => <Tab key={tab.href} {...tab} active={pathname === tab.href} />)}
      </nav>
    </>
  );
}
