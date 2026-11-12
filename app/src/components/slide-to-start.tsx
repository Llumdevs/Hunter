"use client";

import { ArrowRight, ChevronsRight } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { isSlideComplete, slideProgress } from "@/lib/ui/slide";

const KNOB = 44;
const INSET = 6;
export function SlideToStart() {
  const router = useRouter();
  const drag = useRef<{ startX: number; width: number; moved: boolean; progress: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  function start() { if (!busy) { setBusy(true); router.push("/login?next=%2F"); } }
  function down(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || busy) return;
    drag.current = { startX: event.clientX, width: event.currentTarget.getBoundingClientRect().width - INSET * 2, moved: false, progress: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 6) drag.current.moved = true;
    drag.current.progress = slideProgress(delta, drag.current.width, KNOB);
    setOffset(drag.current.progress * Math.max(0, drag.current.width - KNOB));
  }
  function up() {
    if (!drag.current) return;
    const shouldStart = !drag.current.moved || isSlideComplete(drag.current.progress);
    drag.current = null;
    if (shouldStart) start(); else setOffset(0);
  }
  function cancel() { drag.current = null; setOffset(0); }
  return <button type="button" aria-label="Empezar" disabled={busy} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel} onClick={(event) => { if (event.detail === 0) start(); }} className="intro-start relative mt-4 flex h-14 w-full touch-pan-y items-center justify-center rounded-full border border-white/10 bg-white/10 pr-4 pl-14 select-none disabled:opacity-60"><span data-testid="start-knob" aria-hidden className="absolute top-1.5 left-1.5 grid h-11 w-11 place-items-center rounded-full bg-lime text-night-950" style={{ transform: `translateX(${offset}px)` }}><ArrowRight className="h-5 w-5" /></span><span className="flex-1 text-xs font-bold">{busy ? "Entrando…" : "Desliza o toca para empezar"}</span><ChevronsRight aria-hidden className="h-4 w-4 text-violet-soft" /></button>;
}
