import type { CheckInError, RedeemError } from "./results";

// Textos en español. Cuando llegue el inglés, este fichero pasa a ser un diccionario por idioma.
const CHECK_IN_MESSAGES: Record<CheckInError, string> = {
  rate_limited: "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.",
  place_unavailable: "Este local no está disponible en Hunter ahora mismo.",
  not_adult: "Hunter es solo para mayores de 18 años.",
  qr_invalid: "Este QR no es válido. Pide al personal el QR actual del local.",
  invalid_location: "No hemos podido leer bien tu ubicación. Inténtalo de nuevo.",
  too_far: "Parece que no estás en el local. Acércate y vuelve a escanear.",
  place_closed: "El local está cerrado ahora mismo.",
  already_checked_in: "Ya has hecho check-in aquí esta noche.",
};

const REDEEM_MESSAGES: Record<RedeemError, string> = {
  rate_limited: "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.",
  checkin_not_found: "No encontramos tu check-in. Escanea de nuevo el QR del local.",
  checkin_expired: "Tu check-in era de otra noche. Escanea de nuevo el QR del local.",
  offer_unavailable: "Esta oferta no está activa hoy.",
  offer_expired: "La oferta ya ha terminado por esta noche.",
  already_redeemed: "Ya has canjeado esta oferta.",
};

export const checkInErrorMessage = (code: CheckInError): string => CHECK_IN_MESSAGES[code];
export const redeemErrorMessage = (code: RedeemError): string => REDEEM_MESSAGES[code];
export const UNEXPECTED_ERROR_MESSAGE = "Algo ha fallado. Inténtalo de nuevo en un momento.";
