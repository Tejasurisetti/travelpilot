"use client";

import { useEffect, useRef, useState } from "react";
import { AVAILABLE_DESTINATIONS } from "../lib/indiaMockData";
import type { Trip } from "../lib/types";
import BudgetSummary from "./BudgetSummary";
import ChatPanel from "./ChatPanel";
import DayView from "./DayView";
import type { DisruptionSummary } from "./DisruptionSimulator";

const interestOptions = [
  { value: "sightseeing", label: "Landmarks" },
  { value: "museum", label: "Museums" },
  { value: "food", label: "Food" },
  { value: "outdoor", label: "Outdoors" },
  { value: "nightlife", label: "Nightlife" },
];

interface PlanForm {
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  interests: string[];
}

const initialForm: PlanForm = {
  destination: "Jaipur",
  startDate: "2026-09-19",
  endDate: "2026-09-21",
  budget: "900",
  interests: ["sightseeing", "museum", "food"],
};

async function requestTrip(form: PlanForm): Promise<Trip> {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget),
      interests: form.interests,
      preferences: {
        pace: "moderate",
        dietaryRestrictions: [],
        accessibilityNeeds: [],
        preferredTransportModes: ["walk", "metro"],
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "The itinerary could not be created.");
  }
  return payload as Trip;
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

export default function Dashboard() {
  const [form, setForm] = useState<PlanForm>(initialForm);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disruptionNotice, setDisruptionNotice] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(initialForm.budget);
  const [editDuration, setEditDuration] = useState("3");
  const [editInterests, setEditInterests] = useState(initialForm.interests);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanError, setReplanError] = useState<string | null>(null);
  const tripRef = useRef<Trip | null>(null);
  tripRef.current = trip;

  async function loadTrip(nextForm: PlanForm) {
    setIsLoading(true);
    setError(null);
    try {
      const nextTrip = await requestTrip(nextForm);
      setTrip(nextTrip);
      setActiveDay(0);
      setEditBudget(String(nextTrip.budget));
      setEditDuration(String(nextTrip.days.length));
      setEditInterests(nextTrip.interests);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTrip(initialForm);
  }, []);

  function updateField(field: keyof PlanForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleInterest(value: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((interest) => interest !== value)
        : [...current.interests, value],
    }));
  }

  function toggleEditInterest(value: string) {
    setEditInterests((current) =>
      current.includes(value)
        ? current.filter((interest) => interest !== value)
        : [...current, value],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTrip(form);
  }

  function handleTripUpdated(nextTrip: Trip, summary: DisruptionSummary) {
    setTrip(nextTrip);
    const updatedDayIndex = nextTrip.days.findIndex((day) => day.date === summary.dayDate);
    if (updatedDayIndex >= 0) {
      setActiveDay(updatedDayIndex);
    }
    setDisruptionNotice(summary.message);
  }

  async function handleReplan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trip) return;

    const requestTripState = trip;
    setIsReplanning(true);
    setReplanError(null);
    try {
      const response = await fetch("/api/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripState: trip,
          budget: Number(editBudget),
          durationDays: Number(editDuration),
          interests: editInterests,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The itinerary could not be replanned.");
      }
      if (tripRef.current !== requestTripState) {
        throw new Error("The itinerary changed while replanning. Please reopen Edit trip and try again.");
      }
      setTrip(payload.trip as Trip);
      setActiveDay(0);
      setForm((current) => ({
        ...current,
        budget: editBudget,
        endDate: (payload.trip as Trip).endDate,
        interests: editInterests,
      }));
      setDisruptionNotice(payload.summary.message);
      setIsEditOpen(false);
    } catch (requestError) {
      setReplanError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsReplanning(false);
    }
  }

  const selectedDay = trip?.days[activeDay] ?? trip?.days[0];

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17221d]">
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="relative overflow-hidden rounded-[2rem] bg-[#17221d] px-6 py-8 text-[#f9f4eb] sm:px-10 sm:py-10 lg:px-14">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[40px] border-[#b65f35]/30" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#efb366]">TravelPilot</p>
              <h1 className="mt-4 font-serif text-4xl leading-[0.98] sm:text-6xl">A better day is already mapped.</h1>
            </div>
          </div>
        </header>

        <section className="mt-6 border-y border-[#d7d0c2] py-6" aria-label="Trip preferences">
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.75fr_auto] lg:items-end">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Destination</span>
              <select
                value={form.destination}
                onChange={(event) => updateField("destination", event.target.value)}
                className="mt-2 h-12 w-full border-b-2 border-[#bdb5a7] bg-transparent px-0 text-lg outline-none transition focus:border-[#a05a2c]"
                required
              >
                {AVAILABLE_DESTINATIONS.map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Start date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                className="mt-2 h-12 w-full border-b-2 border-[#bdb5a7] bg-transparent px-0 text-base outline-none transition focus:border-[#a05a2c]"
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">End date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className="mt-2 h-12 w-full border-b-2 border-[#bdb5a7] bg-transparent px-0 text-base outline-none transition focus:border-[#a05a2c]"
                required
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Budget</span>
              <div className="mt-2 flex h-12 items-center border-b-2 border-[#bdb5a7] text-lg">
                <span className="mr-1 text-[#6d756e]">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(event) => updateField("budget", event.target.value)}
                  className="w-full bg-transparent outline-none"
                  required
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-full bg-[#b65f35] px-6 text-sm font-bold text-white transition hover:bg-[#994b28] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? "Mapping..." : "Rebuild trip"}
            </button>
            <fieldset className="flex flex-wrap gap-2 lg:col-span-5">
              <legend className="mr-2 self-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Interests</legend>
              {interestOptions.map((interest) => {
                const selected = form.interests.includes(interest.value);
                return (
                  <label key={interest.value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[#17221d] bg-[#17221d] text-white" : "border-[#c8c0b1] text-[#59625b] hover:border-[#17221d]"}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleInterest(interest.value)}
                      className="sr-only"
                    />
                    {interest.label}
                  </label>
                );
              })}
            </fieldset>
          </form>
        </section>

        {error && (
          <div role="alert" className="mt-6 border border-[#c27763] bg-[#f4d8d2] px-5 py-4 text-sm text-[#7f3325]">
            {error}
          </div>
        )}

        {disruptionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex items-start gap-3 border border-[#d49a55] bg-[#fff0d9] px-5 py-4 text-sm font-semibold text-[#75491e] shadow-[0_8px_24px_rgba(160,90,44,0.12)] animate-[pulse_1.4s_ease-out_1]"
          >
            <span aria-hidden="true" className="text-lg leading-5">!</span>
            <span>{disruptionNotice}</span>
          </div>
        )}

        {isLoading && !trip ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-[28rem] animate-pulse rounded-2xl bg-[#ebe4d8]" />
            <div className="h-[28rem] animate-pulse rounded-2xl bg-[#ebe4d8]" />
          </div>
        ) : trip && selectedDay ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a05a2c]">Your route</p>
                <h2 className="mt-2 font-serif text-3xl text-[#17221d] sm:text-4xl">{trip.destination}</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="hidden text-sm text-[#6d756e] sm:block">{formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}</p>
                <button
                  type="button"
                  onClick={() => setIsEditOpen((current) => !current)}
                  className="rounded-full border border-[#17221d] px-4 py-2 text-xs font-bold text-[#17221d] transition hover:bg-[#17221d] hover:text-white"
                >
                  {isEditOpen ? "Close editor" : "Edit trip"}
                </button>
              </div>
            </div>

            {isEditOpen && (
              <form onSubmit={handleReplan} className="mt-6 border border-[#c8c0b1] bg-[#ebe4d8] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a05a2c]">Constraint editor</p>
                    <h3 className="mt-2 font-serif text-2xl text-[#17221d]">Change the shape of the trip</h3>
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-[#6d756e]">Confirmed items stay locked when their dates remain inside the new plan.</p>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-[180px_180px_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Budget</span>
                    <div className="mt-2 flex h-11 items-center border-b-2 border-[#bdb5a7] text-lg">
                      <span className="mr-1 text-[#6d756e]">₹</span>
                      <input type="number" min="0" value={editBudget} onChange={(event) => setEditBudget(event.target.value)} className="w-full bg-transparent outline-none" required />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Duration</span>
                    <div className="mt-2 flex h-11 items-center border-b-2 border-[#bdb5a7] text-lg">
                      <input type="number" min="1" max="30" value={editDuration} onChange={(event) => setEditDuration(event.target.value)} className="w-full bg-transparent outline-none" required />
                      <span className="text-sm text-[#6d756e]">days</span>
                    </div>
                  </label>
                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="basis-full text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d756e]">Interests</legend>
                    {interestOptions.map((interest) => {
                      const selected = editInterests.includes(interest.value);
                      return (
                        <label key={interest.value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[#17221d] bg-[#17221d] text-white" : "border-[#c8c0b1] text-[#59625b] hover:border-[#17221d]"}`}>
                          <input type="checkbox" checked={selected} onChange={() => toggleEditInterest(interest.value)} className="sr-only" />
                          {interest.label}
                        </label>
                      );
                    })}
                  </fieldset>
                  <button type="submit" disabled={isReplanning} className="h-11 rounded-full bg-[#b65f35] px-5 text-sm font-bold text-white transition hover:bg-[#994b28] disabled:cursor-wait disabled:opacity-60">
                    {isReplanning ? "Replanning..." : "Apply changes"}
                  </button>
                </div>
                {replanError && <p className="mt-4 text-sm text-[#9b3f2d]">{replanError}</p>}
              </form>
            )}

            <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[#d7d0c2] pb-px" role="tablist" aria-label="Itinerary days">
              {trip.days.map((day, index) => (
                <button
                  key={day.date}
                  type="button"
                  role="tab"
                  aria-selected={activeDay === index}
                  onClick={() => setActiveDay(index)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-left transition ${activeDay === index ? "border-[#b65f35] text-[#17221d]" : "border-transparent text-[#777d76] hover:text-[#17221d]"}`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em]">Day {index + 1}</span>
                  <span className="mt-1 block text-sm font-semibold">{formatShortDate(day.date)}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
              <DayView day={selectedDay} trip={trip} onTripUpdated={handleTripUpdated} />
              <BudgetSummary trip={trip} selectedDate={selectedDay.date} />
            </div>
            <ChatPanel trip={trip} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
