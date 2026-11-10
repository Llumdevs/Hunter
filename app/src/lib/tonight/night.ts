import { currentNight } from "@/lib/venue/stats";

// MVP de una sola ciudad: la noche en curso se calcula con la zona horaria de Valencia.
export const CITY_TIME_ZONE = "Europe/Madrid";
export const tonightDate = (now = new Date()) => currentNight(now, CITY_TIME_ZONE);
