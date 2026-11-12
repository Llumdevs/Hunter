"use client";

import Link from "next/link";
import { QrCode, ArrowUpRight, Ticket } from "lucide-react";
import type { ReactNode } from "react";
import { useDemo } from "@/components/demo/provider";
import { DemoPlans } from "@/components/demo/demo-panels";

export function PlansOverview({ count, children, failed = false }: { count: number; children: ReactNode; failed?: boolean }) {
  const { state, ready } = useDemo();
  const total = count + state.plans.length;
  return <section className="flex flex-col gap-5">
    <header><p className="text-[10px] font-semibold tracking-widest text-violet-soft uppercase">Tu ruta de esta noche</p><h1 className="mt-2 text-3xl font-extrabold">Mis planes</h1><p className="mt-2 text-xs text-muted">{failed ? "No hemos podido actualizar tus prelistas." : ready ? total ? `${total} ${total === 1 ? "plan guardado" : "planes guardados"}. Todo a mano para salir.` : "Tu próxima noche empieza con un plan." : "Cargando tus planes…"}</p></header>
    <Link href="/compras" className="flex min-h-16 items-center gap-3 rounded-3xl border border-violet/20 bg-violet/10 px-4 py-3"><QrCode aria-hidden className="h-6 w-6 text-violet-soft" /><span className="flex-1"><b className="block text-sm">Mi QR de compra</b><span className="text-[10px] text-muted">Muéstralo al personal después de pagar.</span></span><ArrowUpRight aria-hidden className="h-4 w-4" /></Link>
    {failed && <p role="alert" className="text-xs text-rose">No hemos podido cargar tus planes reales. Recarga la página para reintentarlo.</p>}
    {count > 0 && !failed && children}
    <DemoPlans />
    {ready && !failed && !total && <div className="flex flex-col items-center gap-4 rounded-[32px] border border-white/10 bg-white/[.025] p-8 text-center"><Ticket aria-hidden className="h-10 w-10 text-violet-soft" /><h2 className="text-lg font-bold">Todavía no tienes planes</h2><p className="text-xs leading-relaxed text-muted">Descubre un local, abre su ficha y apúntate. Aquí tendrás cómo llegar, compartirlo y escanear al entrar.</p><Link href="/" className="flex min-h-11 items-center gap-2 rounded-full bg-lime px-5 text-xs font-bold text-night-950">Explorar esta noche<ArrowUpRight aria-hidden className="h-4 w-4" /></Link></div>}
  </section>;
}
