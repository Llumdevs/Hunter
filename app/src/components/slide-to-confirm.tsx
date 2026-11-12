"use client";

import { ArrowRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { isSlideComplete, slideProgress } from "@/lib/ui/slide";

// `label` es el texto visible; `accessibleLabel` lo amplía (p. ej. con la oferta) y debe contenerlo.
type Props = { label: string; accessibleLabel?: string; disabled?: boolean; onConfirm: () => void };

const KNOB_PX = 52;
const INSET_PX = 6;
type Drag = { startX: number; trackWidth: number };

// Arrastrar hasta el final confirma. Con teclado, Enter o Espacio confirman (no hay arrastre posible).
export function SlideToConfirm({ label, accessibleLabel = label, disabled = false, onConfirm }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [progress, setProgress] = useState(0);
  const [travelPx, setTravelPx] = useState(0);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || !track.current) return;
    const trackWidth = track.current.getBoundingClientRect().width - 2 * INSET_PX;
    drag.current = { startX: event.clientX, trackWidth };
    setTravelPx(trackWidth - KNOB_PX);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    setProgress(slideProgress(event.clientX - drag.current.startX, drag.current.trackWidth, KNOB_PX));
  }

  function onPointerUp() {
    drag.current = null;
    if (isSlideComplete(progress)) onConfirm();
    else setProgress(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onConfirm();
  }

  return (
    <div ref={track} className="glass relative flex h-16 items-center justify-center rounded-full pl-12 select-none">
      <span aria-hidden className="text-sm font-bold text-muted">{label}</span>
      <button
        type="button"
        aria-label={accessibleLabel}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setProgress(0)}
        onKeyDown={onKeyDown}
        className="absolute top-1.5 left-1.5 grid h-[52px] w-[52px] touch-none place-items-center rounded-full bg-violet text-white disabled:opacity-50"
        style={{ transform: `translateX(${progress * travelPx}px)` }}
      >
        <ArrowRight aria-hidden className="h-6 w-6" />
      </button>
    </div>
  );
}
