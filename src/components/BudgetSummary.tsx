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
    <aside className="border-t border-[var(--rail-rule)] pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ticket-brass)]">Trip economics</p>
          <h2 className="font-signage mt-2 text-2xl text-[var(--rail-blue)]">Budget pulse</h2>
        </div>
        <span className="rounded-sm border border-[#9cbaaa] bg-[#e5efe9] px-3 py-1 text-xs font-semibold text-[#245b46]">
          {remaining >= 0 ? "On track" : "Over budget"}
        </span>
      </div>

      <div className="border-t-[5px] border-[var(--ticket-brass)] bg-[var(--rail-blue)] p-5 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[#d8e3e6]">Total estimate</p>
            <p className="font-board mt-2 text-3xl font-semibold">{currency.format(total)}</p>
          </div>
          <p className="font-board text-right text-xs text-[#d8e3e6]">of {currency.format(trip.budget)} budget</p>
        </div>
        <div className="mt-5 h-4 border border-[#d8e3e6] bg-[#274965] p-0.5">
          <div className="h-full bg-[var(--platform-yellow)]" style={{ width: `${percentUsed}%` }} />
        </div>
        <p className="font-board mt-3 text-sm text-[#d8e3e6]">
          {remaining >= 0
            ? `${currency.format(remaining)} remaining`
            : `${currency.format(Math.abs(remaining))} over your limit`}
        </p>
      </div>

      <div className="mt-6 border-b border-[var(--rail-rule)] pb-5">
        <p className="text-sm text-[#52656f]">
          {day ? `Selected day: ${day.date}` : "Selected day"}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <span className="font-signage text-lg text-[var(--rail-blue)]">Daily estimate</span>
          <span className="font-board text-2xl text-[var(--rail-blue)]">{currency.format(dailyTotal)}</span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {categoryTotals.map(({ category, amount }) => (
          <div key={category} className="flex items-center justify-between gap-4 text-sm">
            <span className="capitalize text-[#52656f]">{category}</span>
            <span className="font-board font-semibold text-[var(--rail-blue)]">{currency.format(amount)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
