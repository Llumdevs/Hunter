"use client";
import Link from "next/link";
export default function PlaceError({ reset }: { reset: () => void }) {
  return <section className="flex min-h-[60dvh] flex-col justify-center gap-4 text-center"><h1 className="text-2xl font-bold">No hemos podido cargar esta ficha</h1><p className="text-sm text-muted">Ha fallado la conexión con el catálogo. No significa que el local haya desaparecido.</p><button onClick={reset} className="min-h-11 rounded-full bg-lime px-4 font-bold text-night-950">Volver a intentar</button><Link href="/" className="min-h-11 content-center text-sm text-violet-soft">Explorar otros locales</Link></section>;
}
