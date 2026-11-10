import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, photoStoragePath, placePhotoUrl, validatePhotoFile } from "./photo-file";

const PLACE = "30000000-0000-0000-0000-0000000000d1";

describe("validatePhotoFile", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("acepta %s", (type) => {
    expect(validatePhotoFile({ type, size: 1000 })).toEqual({ kind: "valid", extension: type.split("/")[1].replace("jpeg", "jpg") });
  });

  it("rechaza otros tipos (p. ej. HEIC del iPhone)", () => {
    expect(validatePhotoFile({ type: "image/heic", size: 1000 })).toEqual({ kind: "invalid", error: "type" });
  });

  it("acepta justo 5 MB", () => {
    expect(validatePhotoFile({ type: "image/png", size: MAX_PHOTO_BYTES })).toMatchObject({ kind: "valid" });
  });

  it("rechaza más de 5 MB", () => {
    expect(validatePhotoFile({ type: "image/png", size: MAX_PHOTO_BYTES + 1 })).toEqual({ kind: "invalid", error: "size" });
  });

  it("rechaza ficheros vacíos", () => {
    expect(validatePhotoFile({ type: "image/png", size: 0 })).toEqual({ kind: "invalid", error: "size" });
  });
});

describe("photoStoragePath", () => {
  it("guarda en la carpeta del local con un nombre único", () => {
    expect(photoStoragePath(PLACE, "jpg", "abc")).toBe(`${PLACE}/abc.jpg`);
  });
});

describe("placePhotoUrl", () => {
  it("es la URL pública del bucket", () => {
    expect(placePhotoUrl("http://127.0.0.1:54321", `${PLACE}/abc.jpg`)).toBe(
      `http://127.0.0.1:54321/storage/v1/object/public/place-photos/${PLACE}/abc.jpg`,
    );
  });
});
