import { isoWeekday } from "@/lib/time/weekday";

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  includesAlcohol: boolean;
  daysOfWeek: number[];
};

// Ofertas activas para la noche del check-in (night_date es la fecha en que empezó la apertura).
export function offersForNight(offers: Offer[], nightDate: string): Offer[] {
  const weekday = isoWeekday(nightDate);
  return offers.filter((offer) => offer.daysOfWeek.includes(weekday));
}
