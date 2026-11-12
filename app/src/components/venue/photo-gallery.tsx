"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PlacePhoto } from "@/components/place-photo";

type Photo = { path: string | null; variant?: "night" | "live" | "terrace" | "electric" };
export function PhotoGallery({ photos, demo, name }: { photos: Photo[]; demo: boolean; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  if (!photos.length) return null;
  const selected = photos[index];
  return <section className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">{demo ? "Moodboard del plan" : "Fotos del local"}</h2><span className="text-[10px] text-muted">{photos.length} fotos</span></div>
    <div className="horizontal-carousel flex gap-2 overflow-x-auto">{photos.map((photo, i) => <button key={`${photo.path}-${photo.variant}`} type="button" aria-label={`Ampliar foto ${i + 1}`} onClick={() => { setIndex(i); dialog.current?.showModal(); }} className="w-[31%] flex-none overflow-hidden rounded-2xl"><PlacePhoto path={photo.path} alt={`${name}, foto ${i + 1}`} demo={demo} variant={photo.variant} className="aspect-square" /></button>)}</div>
    {demo && <p className="text-[10px] leading-relaxed text-muted">Imágenes de ambiente generadas con IA para este plan de prueba.</p>}
    <dialog ref={dialog} aria-label="Galería de fotos" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-night-950 p-3 text-fg backdrop:bg-black/90"><header className="mb-3 flex items-center justify-between px-2"><span className="text-xs">{index + 1} / {photos.length}</span><button type="button" aria-label="Cerrar galería" onClick={() => dialog.current?.close()} className="grid h-11 w-11 place-items-center"><X aria-hidden className="h-5 w-5" /></button></header><PlacePhoto path={selected.path} alt={`${name}, foto ${index + 1}`} demo={demo} variant={selected.variant} className="h-[55dvh] rounded-2xl" /><div className="mt-3 flex justify-between"><button type="button" aria-label="Foto anterior" onClick={() => setIndex((index + photos.length - 1) % photos.length)} className="grid h-11 w-11 place-items-center"><ChevronLeft aria-hidden /></button><button type="button" aria-label="Foto siguiente" onClick={() => setIndex((index + 1) % photos.length)} className="grid h-11 w-11 place-items-center"><ChevronRight aria-hidden /></button></div></dialog>
  </section>;
}
