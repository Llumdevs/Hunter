import Link from "next/link";
import type { ReactNode } from "react";

export function DayCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-3 rounded-[var(--radius-card)] bg-day-card p-4 shadow-[0_10px_30px_-18px_rgb(60_40_30/0.35)] ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 id={id} className="text-lg font-bold">{title}</h2>
      {action}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-sm font-semibold text-muted">← {children}</Link>;
}
