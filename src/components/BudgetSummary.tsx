import type { Trip } from "../lib/types";

interface BudgetSummaryProps {
  trip: Trip;
  selectedDate?: string;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "INR",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export default function BudgetSummary({ trip, selectedDate }: BudgetSummaryProps) {
  const total = trip.days
    .flatMap((day) => day.items)
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.cost, 0);
  const day = trip.days.find((candidate) => candidate.date === selectedDate) ?? trip.days[0];
  const dailyTotal = day?.items
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.cost, 0) ?? 0;
  const percentUsed = trip.budget > 0 ? Math.min((total / trip.budget) * 100, 100) : 0;
  const remaining = trip.budget - total;
  const categories = ["activity", "transport", "accommodation"] as const;
  const categoryTotals = categories.map((category) => ({
    category,
    amount: trip.days
      .flatMap((itineraryDay) => itineraryDay.items)
      .filter((item) => item.type === category && item.status !== "cancelled")
      .reduce((sum, item) => sum + item.cost, 0),
  }));

  return (
    <aside className="border-t border-[#d7d0c2] pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a05a2c]">Trip economics</p>
          <h2 className="mt-2 font-serif text-2xl text-[#17221d]">Budget pulse</h2>
        </div>
        <span className="rounded-full bg-[#e8efe7] px-3 py-1 text-xs font-semibold text-[#386044]">
          {remaining >= 0 ? "On track" : "Over budget"}
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-[#17221d] p-5 text-[#f9f4eb]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#b9c9b7]">Total estimate</p>
            <p className="mt-2 text-3xl font-semibold">{currency.format(total)}</p>
          </div>
          <p className="text-right text-xs text-[#b9c9b7]">of {currency.format(trip.budget)} budget</p>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#3b4a40]">
          <div className="h-full rounded-full bg-[#efb366]" style={{ width: `${percentUsed}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#d7e1d5]">
          {remaining >= 0
            ? `${currency.format(remaining)} remaining`
            : `${currency.format(Math.abs(remaining))} over your limit`}
        </p>
      </div>

      <div className="mt-6 border-b border-[#d7d0c2] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6d756e]">
          {day ? `Selected day · ${day.date}` : "Selected day"}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-lg font-semibold text-[#17221d]">Daily estimate</span>
          <span className="font-serif text-2xl text-[#17221d]">{currency.format(dailyTotal)}</span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {categoryTotals.map(({ category, amount }) => (
          <div key={category} className="flex items-center justify-between gap-4 text-sm">
            <span className="capitalize text-[#6d756e]">{category}</span>
            <span className="font-semibold text-[#17221d]">{currency.format(amount)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
