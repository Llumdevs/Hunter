import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const PRIMARY =
  "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-base font-extrabold text-night-950 " +
  "primary-action transition active:scale-[0.98] disabled:opacity-50";
const SECONDARY =
  "glass flex h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold disabled:opacity-50";

export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`${PRIMARY} ${className}`} />;
}

export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`${SECONDARY} ${className}`} />;
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className={PRIMARY}>{children}</Link>;
}

export function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="glass grid h-11 w-11 place-items-center rounded-full">
      {children}
    </Link>
  );
}

export function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`glass rounded-[var(--radius-card)] p-5 ${className}`}>{children}</div>;
}

export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-3 text-center">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children && <div className="text-muted">{children}</div>}
    </section>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
      {children}
    </p>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

export const INPUT_CLASS =
  "glass h-14 rounded-2xl px-4 text-base text-fg placeholder:text-muted focus:outline-2 focus:outline-orange";
