"use client";

import { useRef, useState } from "react";
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
  destination: "",
  startDate: "",
  endDate: "",
  budget: "",
  interests: [],
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disruptionNotice, setDisruptionNotice] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(initialForm.budget);
  const [editDuration, setEditDuration] = useState("");
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
    <main className="min-h-screen bg-[var(--chart-white)] text-[var(--rail-ink)]">
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="relative overflow-hidden border-b-8 border-[var(--platform-yellow)] bg-[var(--rail-blue)] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14">
          <div className="absolute right-6 top-6 h-20 w-20 border-4 border-dashed border-[#7891a0] opacity-60" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[var(--platform-yellow)]">TravelPilot</p>
              <h1 className="font-signage mt-4 text-4xl leading-[0.98] sm:text-6xl">A better day is already mapped.</h1>
            </div>
          </div>
        </header>

        <section className="mt-6 border-y border-[var(--rail-rule)] py-6" aria-label="Trip preferences">
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.75fr_auto] lg:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--rail-blue)]">Destination</span>
              <select
                value={form.destination}
                onChange={(event) => updateField("destination", event.target.value)}
                className="mt-2 h-12 w-full border-b-2 border-[var(--rail-blue)] bg-transparent px-0 text-lg outline-none"
                required
              >
                <option value="" disabled>Select a city</option>
                {AVAILABLE_DESTINATIONS.map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--rail-blue)]">Start date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                className="font-board mt-2 h-12 w-full border-b-2 border-[var(--rail-blue)] bg-transparent px-0 text-base outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--rail-blue)]">End date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className="font-board mt-2 h-12 w-full border-b-2 border-[var(--rail-blue)] bg-transparent px-0 text-base outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--rail-blue)]">Budget</span>
              <div className="font-board mt-2 flex h-12 items-center border-b-2 border-[var(--rail-blue)] text-lg">
                <span className="mr-1 text-[var(--ticket-brass)]">₹</span>
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
            <fieldset className="flex flex-wrap gap-2 lg:col-span-5">
              <legend className="mr-2 self-center text-sm font-semibold text-[var(--rail-blue)]">Interests</legend>
              {interestOptions.map((interest) => {
                const selected = form.interests.includes(interest.value);
                return (
                  <label key={interest.value} className={`cursor-pointer border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[var(--rail-blue)] bg-[var(--rail-blue)] text-white" : "border-[var(--rail-rule)] text-[var(--rail-ink)] hover:border-[var(--ticket-brass)]"}`}>
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
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 justify-self-start rounded-sm bg-[var(--ticket-brass)] px-6 text-sm font-bold text-white transition hover:bg-[#965d21] disabled:cursor-wait disabled:opacity-60 lg:col-span-5"
            >
              {isLoading ? "Building..." : trip ? "Rebuild trip" : "Build itinerary"}
            </button>
          </form>
        </section>

        {error && (
          <div role="alert" className="mt-6 border border-[var(--cancel-red)] bg-[#f7d9d5] px-5 py-4 text-sm text-[#7f3325]">
            {error}
          </div>
        )}

        {disruptionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="departure-flip mt-6 flex items-start gap-3 border-2 border-[var(--platform-yellow)] bg-[var(--rail-blue)] px-5 py-4 text-sm font-semibold text-white"
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
                <p className="text-sm font-semibold text-[var(--ticket-brass)]">Your route</p>
                <h2 className="font-signage mt-2 text-3xl text-[var(--rail-blue)] sm:text-4xl">{trip.destination}</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-board hidden text-sm text-[#52656f] sm:block">{formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}</p>
                <button
                  type="button"
                  onClick={() => setIsEditOpen((current) => !current)}
                  className="rounded-sm border border-[var(--rail-blue)] px-4 py-2 text-xs font-bold text-[var(--rail-blue)] transition hover:bg-[var(--rail-blue)] hover:text-white"
                >
                  {isEditOpen ? "Close editor" : "Edit trip"}
                </button>
              </div>
            </div>

            {isEditOpen && (
              <form onSubmit={handleReplan} className="mt-6 border border-[var(--rail-rule)] bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ticket-brass)]">Constraint editor</p>
                    <h3 className="font-signage mt-2 text-2xl text-[var(--rail-blue)]">Change the shape of the trip</h3>
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-[#52656f]">Confirmed items stay locked when their dates remain inside the new plan.</p>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-[180px_180px_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="text-sm font-semibold text-[var(--rail-blue)]">Budget</span>
                    <div className="font-board mt-2 flex h-11 items-center border-b-2 border-[var(--rail-blue)] text-lg">
                      <span className="mr-1 text-[var(--ticket-brass)]">₹</span>
                      <input type="number" min="0" value={editBudget} onChange={(event) => setEditBudget(event.target.value)} className="w-full bg-transparent outline-none" required />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-[var(--rail-blue)]">Duration</span>
                    <div className="font-board mt-2 flex h-11 items-center border-b-2 border-[var(--rail-blue)] text-lg">
                      <input type="number" min="1" max="30" value={editDuration} onChange={(event) => setEditDuration(event.target.value)} className="w-full bg-transparent outline-none" required />
                      <span className="text-sm text-[#6d756e]">days</span>
                    </div>
                  </label>
                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="basis-full text-sm font-semibold text-[var(--rail-blue)]">Interests</legend>
                    {interestOptions.map((interest) => {
                      const selected = editInterests.includes(interest.value);
                      return (
                        <label key={interest.value} className={`cursor-pointer border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[var(--rail-blue)] bg-[var(--rail-blue)] text-white" : "border-[var(--rail-rule)] text-[var(--rail-ink)] hover:border-[var(--ticket-brass)]"}`}>
                          <input type="checkbox" checked={selected} onChange={() => toggleEditInterest(interest.value)} className="sr-only" />
                          {interest.label}
                        </label>
                      );
                    })}
                  </fieldset>
                  <button type="submit" disabled={isReplanning} className="h-11 rounded-sm bg-[var(--ticket-brass)] px-5 text-sm font-bold text-white transition hover:bg-[#965d21] disabled:cursor-wait disabled:opacity-60">
                    {isReplanning ? "Replanning..." : "Apply changes"}
                  </button>
                </div>
                {replanError && <p className="mt-4 text-sm text-[#9b3f2d]">{replanError}</p>}
              </form>
            )}

            <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--rail-rule)] pb-px" role="tablist" aria-label="Itinerary days">
              {trip.days.map((day, index) => (
                <button
                  key={day.date}
                  type="button"
                  role="tab"
                  aria-selected={activeDay === index}
                  onClick={() => setActiveDay(index)}
                  className={`shrink-0 border-2 border-b-0 px-4 py-3 text-left transition ${activeDay === index ? "border-[var(--ticket-brass)] bg-white text-[var(--rail-blue)]" : "border-transparent text-[#52656f] hover:border-[var(--rail-rule)]"}`}
                >
                  <span className="font-signage block text-base font-semibold">Day {index + 1}</span>
                  <span className="font-board mt-1 block text-sm">{formatShortDate(day.date)}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
              <DayView day={selectedDay} trip={trip} onTripUpdated={handleTripUpdated} />
              <BudgetSummary trip={trip} selectedDate={selectedDay.date} />
            </div>
            <ChatPanel trip={trip} />
          </section>
        ) : (
          <section className="mt-10 border-2 border-dashed border-[var(--rail-rule)] bg-white px-6 py-16 text-center sm:px-10">
            <p className="font-signage text-3xl text-[var(--rail-blue)]">Choose a destination to build your itinerary</p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#52656f]">
              Fill in your travel dates, budget, and interests above, then confirm your booking to see the route.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
