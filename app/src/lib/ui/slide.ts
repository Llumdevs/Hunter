// Deslizador para confirmar el canje: evita canjes por un toque accidental.
export const SLIDE_CONFIRM_THRESHOLD = 0.9;

export function slideProgress(offsetPx: number, trackWidth: number, knobWidth: number): number {
  const travel = trackWidth - knobWidth;
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, offsetPx / travel));
}

export const isSlideComplete = (progress: number): boolean => progress >= SLIDE_CONFIRM_THRESHOLD;
