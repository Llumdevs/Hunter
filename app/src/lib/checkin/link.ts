// Interpreta el enlace de un QR de check-in: https://<dominio>/c/<placeId>?k=<token> o ?t=<código>.

export type CheckInCredential = { type: "static"; token: string } | { type: "screen"; code: string };

export type CheckInLink =
  | { kind: "valid"; placeId: string; credential: CheckInCredential }
  | { kind: "invalid"; reason: "malformed" | "foreign_origin" | "missing_credential" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STATIC_TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const SCREEN_CODE = /^[0-9a-f]{8}$/;
const CHECKIN_PATH = /^\/c\/([^/]+)$/;

const MALFORMED: CheckInLink = { kind: "invalid", reason: "malformed" };

export function parseCheckInLink(raw: string, appOrigin: string): CheckInLink {
  const url = URL.canParse(raw) ? new URL(raw) : null;
  if (!url) return MALFORMED;
  if (url.origin !== appOrigin) return { kind: "invalid", reason: "foreign_origin" };
  const placeId = CHECKIN_PATH.exec(url.pathname)?.[1];
  return placeId ? parseCheckInParams(placeId, url.searchParams) : MALFORMED;
}

export function parseCheckInParams(placeId: string, params: URLSearchParams): CheckInLink {
  if (!UUID.test(placeId)) return MALFORMED;
  const token = params.get("k");
  const code = params.get("t");
  if (token === null && code === null) return { kind: "invalid", reason: "missing_credential" };
  if (token !== null && code !== null) return MALFORMED;
  if (token !== null) {
    return STATIC_TOKEN.test(token) ? { kind: "valid", placeId, credential: { type: "static", token } } : MALFORMED;
  }
  return SCREEN_CODE.test(code!) ? { kind: "valid", placeId, credential: { type: "screen", code: code! } } : MALFORMED;
}

export function checkInPath(link: { placeId: string; credential: CheckInCredential }): string {
  const query =
    link.credential.type === "static"
      ? new URLSearchParams({ k: link.credential.token })
      : new URLSearchParams({ t: link.credential.code });
  return `/c/${link.placeId}?${query}`;
}
