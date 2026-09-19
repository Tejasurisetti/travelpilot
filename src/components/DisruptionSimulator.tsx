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
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#e4ded3] pt-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isSending}
        className="inline-flex items-center gap-2 rounded-full border border-[#c27763] px-3 py-1.5 text-xs font-bold text-[#9b3f2d] transition hover:bg-[#f4d8d2] disabled:cursor-wait disabled:opacity-60"
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
              className="rounded-full bg-[#f8e9d5] px-3 py-1.5 text-xs font-semibold capitalize text-[#8b572d] transition hover:bg-[#efb366] disabled:opacity-50"
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
