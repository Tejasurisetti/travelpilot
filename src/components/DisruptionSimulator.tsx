"use client";

import { useRef, useState } from "react";
import type { Trip } from "../lib/types";

export interface DisruptionSummary {
  message: string;
  dayDate: string;
  cancelledItemName: string;
  replacementName?: string;
}

interface DisruptionSimulatorProps {
  trip: Trip;
  itemId: string;
  onUpdated: (trip: Trip, summary: DisruptionSummary) => void;
}

const reasons = ["venue closed", "weather", "booking cancelled"];

export default function DisruptionSimulator({ trip, itemId, onUpdated }: DisruptionSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  async function simulate(reason: string) {
    setIsSending(true);
    setError(null);
    const requestTripState = trip;
    try {
      const response = await fetch("/api/disrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripState: trip, itemId, reason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The disruption could not be simulated.");
      }
      if (tripRef.current !== requestTripState) {
        throw new Error("The itinerary changed before this disruption finished. Please try again.");
      }
      onUpdated(payload.trip as Trip, payload.summary as DisruptionSummary);
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--rail-rule)] pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isSending}
        className="inline-flex items-center gap-2 rounded-sm border border-[var(--cancel-red)] px-3 py-1.5 text-xs font-bold text-[var(--cancel-red)] transition hover:bg-[#f7d9d5] disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden="true">!</span>
        {isSending ? "Rebuilding..." : "Simulate disruption"}
      </button>
      {isOpen && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Disruption reason">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => void simulate(reason)}
              disabled={isSending}
              className="rounded-sm border border-[#d6b15d] bg-[#fff5d8] px-3 py-1.5 text-xs font-semibold capitalize text-[#78551d] transition hover:bg-[var(--platform-yellow)] disabled:opacity-50"
            >
              {reason}
            </button>
          ))}
        </div>
      )}
      {error && <p className="basis-full text-xs text-[#9b3f2d]">{error}</p>}
    </div>
  );
}
