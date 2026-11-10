// El panel del local va en modo día: se usa en la barra o en el ordenador, no en la calle de noche.
import Link from "next/link";
import { HunterLogo } from "@/components/logo";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-day -mx-5 -my-6 flex min-h-dvh flex-col px-5 py-6"><header className="mb-6 flex items-center justify-between gap-3"><Link href="/locales" aria-label="Hunter para locales"><HunterLogo className="h-6 text-fg" /></Link><nav className="flex gap-4 text-sm text-muted"><Link href="/panel">Mi panel</Link><Link href="/">App</Link><Link href="/perfil">Mi cuenta</Link></nav></header>{children}</div>;
}
