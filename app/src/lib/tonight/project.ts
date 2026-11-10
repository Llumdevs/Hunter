// Proyecta coordenadas a un recuadro (mapa esquemático, sin teselas): norte arriba, este a la derecha,
// misma escala en los dos ejes y corrección de la longitud por la latitud.
type Point = { lat: number; lng: number };
type Box = { width: number; height: number; padding: number };

const toRad = (degrees: number) => (degrees * Math.PI) / 180;

export function projectPoints(points: Point[], box: Box): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const lngScale = Math.cos(toRad(points.reduce((sum, p) => sum + p.lat, 0) / points.length));
  const xs = points.map((p) => p.lng * lngScale);
  const ys = points.map((p) => p.lat);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const usableW = box.width - 2 * box.padding;
  const usableH = box.height - 2 * box.padding;
  const scale = Math.min(spanX ? usableW / spanX : Infinity, spanY ? usableH / spanY : Infinity);
  const k = Number.isFinite(scale) ? scale : 0;
  const offsetX = box.width / 2 - ((minX + maxX) / 2) * k;
  const offsetY = box.height / 2 + ((minY + maxY) / 2) * k;
  return points.map((_, i) => ({ x: offsetX + xs[i] * k, y: offsetY - ys[i] * k }));
}
