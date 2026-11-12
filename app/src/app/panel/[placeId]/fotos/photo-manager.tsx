"use client";

import { Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PlacePhoto } from "@/components/place-photo";
import { ErrorText, PrimaryButton } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ACCEPTED_PHOTO_TYPES, PHOTO_BUCKET, photoStoragePath, validatePhotoFile } from "@/lib/venue/photo-file";

type Photo = { id: string; storage_path: string };
type Props = { placeId: string; placeName: string; photos: Photo[] };

const ERRORS = {
  type: "Ese formato no vale. Usa JPG, PNG o WebP (las fotos HEIC del iPhone, expórtalas como JPG).",
  size: "La foto pesa más de 5 MB o está vacía.",
  upload: "No se ha podido subir la foto. Inténtalo de nuevo.",
  remove: "No se ha podido borrar la foto.",
};

export function PhotoManager({ placeId, placeName, photos }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("photo");
    if (!(file instanceof File)) return;
    const validation = validatePhotoFile(file);
    if (validation.kind === "invalid") return setError(ERRORS[validation.error]);

    setBusy(true);
    setError(null);
    const path = photoStoragePath(placeId, validation.extension, crypto.randomUUID());
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
    const { error: rowError } = storageError
      ? { error: storageError }
      : await supabase.from("place_photos").insert({ place_id: placeId, storage_path: path, rights_confirmed: true });
    setBusy(false);
    if (rowError) return setError(ERRORS.upload);
    form.reset();
    router.refresh();
  }

  async function remove(photo: Photo) {
    setBusy(true);
    const { error: rowError } = await supabase.from("place_photos").delete().eq("id", photo.id);
    if (!rowError) await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    setBusy(false);
    if (rowError) return setError(ERRORS.remove);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="relative">
            <PlacePhoto path={photo.storage_path} alt={`${placeName}, foto ${index + 1}`} className="aspect-[4/3] rounded-2xl" />
            {index === 0 && <figcaption className="absolute top-2 left-2 rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-night-950">Portada</figcaption>}
            <button type="button" disabled={busy} onClick={() => remove(photo)} aria-label={`Borrar foto ${index + 1}`}
              className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-day-ink">
              <Trash2 aria-hidden className="h-4 w-4" />
            </button>
          </figure>
        ))}
      </div>
      {photos.length === 0 && <p className="text-sm text-muted">Todavía no hay fotos. Mientras tanto, la app muestra un degradado.</p>}

      <form onSubmit={upload} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-day-card p-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-muted">
          Nueva foto
          <input name="photo" type="file" accept={ACCEPTED_PHOTO_TYPES} required aria-label="Elegir foto"
            className="text-sm text-fg file:mr-3 file:rounded-full file:border-0 file:bg-tile-sand file:px-4 file:py-2 file:font-semibold" />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input name="rights" type="checkbox" required className="mt-0.5 h-5 w-5 accent-violet" />
          <span>Confirmo que el local tiene derechos para usar esta foto y que las personas que aparecen han dado su permiso.</span>
        </label>
        <PrimaryButton disabled={busy}><Upload aria-hidden className="h-5 w-5" />Subir foto</PrimaryButton>
      </form>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
