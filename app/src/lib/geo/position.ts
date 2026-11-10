// Pide la ubicación una sola vez. Nunca rechaza: la falta de ubicación es un resultado válido
// (el check-in se acepta igualmente, marcado y sin cobrar).

export type PositionResult =
  | { kind: "granted"; lat: number; lng: number }
  | { kind: "unavailable"; reason: "denied" | "timeout" | "error" | "unsupported" };

export type GeolocationLike = Pick<Geolocation, "getCurrentPosition">;

const POSITION_TIMEOUT_MS = 10_000;
const PERMISSION_DENIED = 1;
const TIMEOUT = 3;

function reasonFor(error: GeolocationPositionError): "denied" | "timeout" | "error" {
  if (error.code === PERMISSION_DENIED) return "denied";
  if (error.code === TIMEOUT) return "timeout";
  return "error";
}

export function requestPosition(geolocation: GeolocationLike | undefined): Promise<PositionResult> {
  if (!geolocation) return Promise.resolve({ kind: "unavailable", reason: "unsupported" });
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ kind: "granted", lat: coords.latitude, lng: coords.longitude }),
      (error) => resolve({ kind: "unavailable", reason: reasonFor(error) }),
      { enableHighAccuracy: true, timeout: POSITION_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}
