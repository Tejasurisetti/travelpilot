import type { Day, Trip, TripItem } from "../lib/types";
import DisruptionSimulator, { type DisruptionSummary } from "./DisruptionSimulator";

interface DayViewProps {
  day: Day;
  trip: Trip;
  onTripUpdated: (trip: Trip, summary: DisruptionSummary) => void;
}

const typeLabels: Record<TripItem["type"], string> = {
  activity: "Activity",
  transport: "Transport",
  accommodation: "Stay",
};

const typeStyles: Record<TripItem["type"], string> = {
  activity: "bg-[#e5eef2] text-[#12304a]",
  transport: "bg-[#dfe9ee] text-[#245979]",
  accommodation: "bg-[#f7edcf] text-[#7c551f]",
};

function formatTime(value: string): string {
  const [hoursValue, minutes] = value.slice(11, 16).split(":").map(Number);
  const period = hoursValue >= 12 ? "PM" : "AM";
  const hours = hoursValue % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatLocation(item: TripItem): string {
  return `${item.location.lat.toFixed(3)}, ${item.location.lng.toFixed(3)}`;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

function ItemMarker({ type }: { type: TripItem["type"] }) {
  const marker = type === "activity" ? "A" : type === "transport" ? "T" : "S";
  return (
    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[var(--chart-white)] bg-[var(--rail-blue)] text-xs font-bold text-white">
      {marker}
    </div>
  );
}

export default function DayView({ day, trip, onTripUpdated }: DayViewProps) {
  return (
    <section aria-labelledby={`day-${day.date}`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ticket-brass)]">Daily itinerary</p>
          <h2 id={`day-${day.date}`} className="font-signage mt-2 text-3xl text-[var(--rail-blue)]">
            {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
              new Date(`${day.date}T12:00:00`),
            )}
          </h2>
        </div>
        <span className="font-board text-sm text-[#52656f]">{day.items.length} stops</span>
      </div>

      {day.items.length === 0 ? (
        <div className="border border-dashed border-[var(--rail-rule)] px-6 py-12 text-center text-sm text-[#52656f]">
          No stops planned for this day yet.
        </div>
      ) : (
        <div className="relative space-y-5 before:absolute before:bottom-5 before:left-[18px] before:top-5 before:w-px before:bg-[var(--rail-rule)]">
          {day.items.map((item) => (
            <article key={item.id} className="relative flex gap-4">
              <ItemMarker type={item.type} />
              <div className={`ticket-stub min-w-0 flex-1 p-4 sm:p-5 ${item.type === "transport" ? "ticket-transport" : item.type === "accommodation" ? "ticket-stay" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-sm px-2.5 py-1 text-xs font-bold ${typeStyles[item.type]}`}>
                        {typeLabels[item.type]}
                      </span>
                      {item.status === "cancelled" && (
                        <span className="rounded-sm bg-[#f7d9d5] px-2.5 py-1 text-xs font-bold text-[var(--cancel-red)]">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <h3 className="font-signage mt-3 text-xl text-[var(--rail-blue)]">{item.name}</h3>
                  </div>
                  <p className="font-board whitespace-nowrap text-lg font-semibold text-[var(--rail-blue)]">
                    {item.cost === 0 ? "Free" : currency.format(item.cost)}
                  </p>
                </div>
                <div className="font-board mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#52656f]">
                  <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                  <span>Location {formatLocation(item)}</span>
                </div>
                {item.notes && <p className="mt-3 text-sm leading-6 text-[#52656f]">{item.notes}</p>}
                {item.type === "activity" && item.status !== "cancelled" && (
                  <DisruptionSimulator
                    trip={trip}
                    itemId={item.id}
                    onUpdated={onTripUpdated}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
