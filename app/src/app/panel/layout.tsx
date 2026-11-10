// El panel del local va en modo día: se usa en la barra o en el ordenador, no en la calle de noche.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-day -mx-5 -my-6 flex min-h-dvh flex-col px-5 py-6">{children}</div>;
}
