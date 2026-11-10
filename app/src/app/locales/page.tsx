import Link from "next/link";
import { Store, QrCode, ChartNoAxesCombined } from "lucide-react";
import { HunterLogo } from "@/components/logo";

export default function VenuesLandingPage() {
  return <section className="flex flex-1 flex-col gap-7">
    <header className="flex items-center justify-between gap-4"><HunterLogo className="h-7 text-fg" /><Link href="/" className="text-sm text-muted underline">App de usuarios</Link></header>
    <div className="flex flex-col gap-4 py-5"><p className="text-sm font-bold tracking-widest text-orange uppercase">Hunter para locales · Piloto</p><h1 className="text-4xl leading-tight font-extrabold">Tu local, en los planes de esta noche.</h1><p className="text-muted">Gestiona ofertas, prepara tus QR y consulta la actividad de tu local desde un panel propio.</p></div>
    <Link href="/panel" className="flex min-h-14 items-center justify-center rounded-full bg-orange px-5 font-bold text-white">Entrar en mi panel</Link>
    <Link href="/panel/solicitar-alta" className="flex min-h-14 items-center justify-center rounded-full border border-orange px-5 font-bold text-orange">Solicitar el alta de mi local</Link>
    <div className="rounded-3xl bg-tile-sand p-5"><h2 className="font-bold">¿Solo quieres probar?</h2><p className="mt-2 text-sm text-muted">Entra con tu cuenta o como invitado, completa tu perfil y crea tu local demo. Tendrás ofertas de ejemplo y acceso de gestión, sin publicarlo en el mapa.</p><Link href="/panel" className="mt-3 inline-flex min-h-11 items-center font-bold text-orange underline">Probar con mi local demo</Link></div>
    <ul className="flex flex-col gap-3 text-sm">{[{ Icon: Store, text: "Ofertas y fotos bajo tu control" }, { Icon: QrCode, text: "QR fijo y modo pantalla" }, { Icon: ChartNoAxesCombined, text: "Estadísticas agregadas, sin datos individuales de clientes" }].map(({ Icon, text }) => <li key={text} className="flex items-center gap-3"><Icon aria-hidden className="h-5 w-5 text-orange" />{text}</li>)}</ul>
    <p className="text-xs text-muted">Las solicitudes nuevas quedan pendientes de revisión. Crear un local demo no publica automáticamente ningún local ni te concede permisos para aprobar altas.</p>
  </section>;
}
