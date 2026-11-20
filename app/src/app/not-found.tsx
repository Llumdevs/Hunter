import Link from "next/link";
export default function NotFound() {
  return <section className="flex min-h-[65dvh] flex-col items-center justify-center gap-4 text-center"><p className="text-xs text-violet-soft">404 / Spotea</p><h1 className="text-2xl font-bold">No encontramos esta página</h1><p className="text-sm text-muted">Puede que el enlace no exista o que el local todavía no esté publicado.</p><Link href="/" className="min-h-11 content-center rounded-full bg-lime px-5 text-sm font-bold text-night-950">Explorar Valencia</Link></section>;
}
