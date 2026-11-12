"use client";

import Image from "next/image";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { useState } from "react";
import { SlideToStart } from "./slide-to-start";
import { HunterLogo } from "./logo";

const STEPS = [
  { image: "night", title: "Encuentra tu frecuencia", detail: "Descubre la música y el ambiente antes de salir." },
  { image: "live", title: "Haz que la noche sea tuya", detail: "Elige el plan que encaja contigo y apúntate." },
  { image: "terrace", title: "Nos vemos ahí fuera", detail: "Llega, escanea el QR y disfruta de tu plan." },
];

export function WelcomeExperience() {
  const [step, setStep] = useState(0);
  const selected = STEPS[step];
  return <section className="welcome-editorial -mx-5 -my-6 flex min-h-dvh flex-col px-7 pt-7 pb-7">
    <header className="flex items-center justify-between"><HunterLogo className="h-6" /><span className="text-[10px] font-bold tracking-widest text-muted">VALENCIA / +18</span></header>
    <h1 className="mt-7 text-[clamp(42px,12vw,54px)] leading-[1.04] font-extrabold tracking-[-.045em]">¿Listo para<br />esta <span className="outline-type">noche?</span></h1>
    <div className="relative mt-6 flex min-h-64 flex-1 items-center gap-6 py-2">
      <div role="tablist" aria-label="Descubre Hunter" aria-orientation="vertical" onKeyDown={(event) => { const keys = ["ArrowDown", "ArrowUp", "Home", "End"]; if (!keys.includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? STEPS.length - 1 : (step + (event.key === "ArrowDown" ? 1 : -1) + STEPS.length) % STEPS.length; setStep(next); document.getElementById(`intro-tab-${next}`)?.focus(); }} className="flex flex-col items-center gap-3">
        {STEPS.map((item, index) => <div key={item.title} className="flex flex-col items-center gap-3"><button type="button" role="tab" tabIndex={step === index ? 0 : -1} id={`intro-tab-${index}`} aria-controls="intro-panel" aria-selected={step === index} aria-label={`${index + 1}. ${item.title}`} onClick={() => setStep(index)} className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${step === index ? "border-white text-white" : "border-white/10 text-muted/40"}`}>{index + 1}</button>{index < 2 && <span aria-hidden className="h-4 w-px bg-white/15" />}</div>)}
      </div>
      <div className="intro-capsule relative mx-auto w-full max-w-48 overflow-hidden rounded-[130px]">
        <Image key={selected.image} src={`/images/${selected.image === "night" ? "night-blue" : selected.image === "live" ? "live-violet" : `${selected.image}-session`}.webp`} alt="" fill sizes="256px" loading="eager" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <span aria-hidden className="absolute top-1 left-10 -rotate-12 rounded-full border border-white/20 bg-night-950/70 px-3 py-2 text-[8px] font-bold tracking-[.15em] backdrop-blur-xl">HEAR IT. SEE IT. LIVE IT.</span>
    </div>
    <div role="tabpanel" id="intro-panel" aria-labelledby={`intro-tab-${step}`} className="mt-4 min-h-16"><p className="text-sm font-bold">{selected.title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{selected.detail}</p></div>
    <SlideToStart />
    <Link href="/escanear" className="mt-3 flex min-h-11 items-center justify-center gap-2 text-[11px] text-muted"><ScanLine aria-hidden className="h-3.5 w-3.5 text-violet" />Ya estoy en el local: escanear el QR</Link>
    <Link href="/locales" className="text-center text-[10px] text-muted underline underline-offset-4">¿Tienes un local? Entra en tu panel</Link>
  </section>;
}
