type Point = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;

// Distancia en línea recta (haversine). Es una orientación, no una ruta a pie.
export function distanceMeters(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const HERE_M = 50;
const KM = 1000;
const ROUND_M = 10;
const ONE_DECIMAL_BELOW_KM = 10;

export function formatDistance(meters: number): string {
  if (meters < HERE_M) return "aquí mismo";
  const rounded = Math.round(meters / ROUND_M) * ROUND_M;
  if (rounded < KM) return `${rounded} m`;
  const km = meters / KM;
  const digits = km < ONE_DECIMAL_BELOW_KM ? 1 : 0;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits }).format(km)} km`;
}

// Regla del brief: la cifra solo se muestra desde el umbral; por debajo, un texto que no espante.
export function crowdLabel(signupsVisible: number | null, signupsAny: boolean): string | null {
  if (signupsVisible !== null) return `${signupsVisible} apuntados`;
  return signupsAny ? "Se está animando" : null;
}
