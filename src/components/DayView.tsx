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
  activity: "bg-[#e6eee7] text-[#386044]",
  transport: "bg-[#e7edf3] text-[#3f5e7b]",
  accommodation: "bg-[#f8e9d5] text-[#8b572d]",
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
    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-[#f6f1e8] bg-[#17221d] text-xs font-bold text-[#f9f4eb]">
      {marker}
    </div>
  );
}

export default function DayView({ day, trip, onTripUpdated }: DayViewProps) {
  return (
    <section aria-labelledby={`day-${day.date}`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a05a2c]">Daily itinerary</p>
          <h2 id={`day-${day.date}`} className="mt-2 font-serif text-3xl text-[#17221d]">
            {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
              new Date(`${day.date}T12:00:00`),
            )}
          </h2>
        </div>
        <span className="text-sm text-[#6d756e]">{day.items.length} stops</span>
      </div>

      {day.items.length === 0 ? (
        <div className="border border-dashed border-[#c8c0b1] px-6 py-12 text-center text-sm text-[#6d756e]">
          No stops planned for this day yet.
        </div>
      ) : (
        <div className="relative space-y-5 before:absolute before:bottom-5 before:left-[18px] before:top-5 before:w-px before:bg-[#c8c0b1]">
          {day.items.map((item) => (
            <article key={item.id} className="relative flex gap-4">
              <ItemMarker type={item.type} />
              <div className="min-w-0 flex-1 rounded-2xl border border-[#d7d0c2] bg-[#fbf8f2] p-4 shadow-[0_6px_18px_rgba(44,45,36,0.04)] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${typeStyles[item.type]}`}>
                        {typeLabels[item.type]}
                      </span>
                      {item.status === "cancelled" && (
                        <span className="rounded-full bg-[#f4d8d2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b3f2d]">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[#17221d]">{item.name}</h3>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-[#17221d]">
                    {item.cost === 0 ? "Free" : currency.format(item.cost)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6d756e]">
                  <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                  <span>Location {formatLocation(item)}</span>
                </div>
                {item.notes && <p className="mt-3 text-sm leading-6 text-[#737970]">{item.notes}</p>}
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
