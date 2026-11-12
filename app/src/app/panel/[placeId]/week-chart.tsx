import { nightBars } from "@/lib/venue/bars";
import type { NightStats } from "@/lib/venue/stats";

// Gráfica visual + tabla accesible con los mismos datos para lectores de pantalla.
export function WeekChart({ nights }: { nights: NightStats[] }) {
  return (
    <>
      <div aria-hidden className="flex h-24 items-end gap-2">
        {nightBars(nights).map((bar) => (
          <div key={bar.nightDate} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end gap-0.5">
              <span className="flex-1 rounded-t-md bg-[#e6dfd8]" style={{ height: `${bar.signupsPct}%` }} />
              <span className="flex-1 rounded-t-md bg-violet" style={{ height: `${bar.checkinsPct}%` }} />
            </div>
            <span className="text-[11px] text-muted">{bar.day}</span>
          </div>
        ))}
      </div>
      <div aria-hidden className="flex gap-4 text-[11px] text-muted">
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#e6dfd8]" />Apuntados</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-violet" />Check-ins</span>
      </div>
      <table className="sr-only">
        <caption>Actividad por noche</caption>
        <thead><tr><th>Noche</th><th>Apuntados</th><th>Check-ins</th><th>Canjes</th><th>Se cobrarían</th></tr></thead>
        <tbody>
          {nights.map((night) => (
            <tr key={night.night_date}>
              <td>{night.night_date}</td><td>{night.signups}</td><td>{night.checkins}</td><td>{night.redemptions}</td><td>{night.billable}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
