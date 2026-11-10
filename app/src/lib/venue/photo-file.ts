// Mismos límites que el bucket place-photos (migración 20261110150000): la base de datos es la que manda.
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const ACCEPTED_PHOTO_TYPES = Object.keys(EXTENSIONS).join(",");

export type PhotoValidation = { kind: "valid"; extension: string } | { kind: "invalid"; error: "type" | "size" };

export function validatePhotoFile(file: { type: string; size: number }): PhotoValidation {
  const extension = EXTENSIONS[file.type];
  if (!extension) return { kind: "invalid", error: "type" };
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) return { kind: "invalid", error: "size" };
  return { kind: "valid", extension };
}

export const photoStoragePath = (placeId: string, extension: string, uniqueId: string): string =>
  `${placeId}/${uniqueId}.${extension}`;

export const PHOTO_BUCKET = "place-photos";

export const placePhotoUrl = (supabaseUrl: string, storagePath: string): string =>
  `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
