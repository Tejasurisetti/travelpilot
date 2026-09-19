"use client";

import { useRef, useState } from "react";
import type { Trip } from "../lib/types";

interface ToolLogEntry {
  toolName: string;
  arguments: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolLog?: ToolLogEntry[];
}

interface ChatPanelProps {
  trip: Trip;
}

const sampleQuestions = [
  "What should I do tomorrow morning?",
  "Which activities are close to my hotel?",
  "Can I fit a museum visit into today?",
];

function toolTrace(entry: ToolLogEntry): string {
  const dayDate = typeof entry.arguments.dayDate === "string" ? entry.arguments.dayDate : "the trip";
  switch (entry.toolName) {
    case "check_conflicts":
      return `Checked conflicts for ${dayDate}`;
    case "rebuild_itinerary":
      return `Rebuilt the schedule for ${dayDate}`;
    case "find_alternatives":
      return `Searched backup options for ${dayDate}`;
    case "get_budget_summary":
      return "Calculated the trip budget";
    default:
      return `Ran ${entry.toolName}`;
  }
}

function formatArguments(argumentsValue: Record<string, unknown>): string {
  return Object.entries(argumentsValue)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

export default function ChatPanel({ trip }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  async function sendMessage(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmedQuestion,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setIsSending(true);
    const requestTripState = trip;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripState: trip, userMessage: trimmedQuestion }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The travel assistant could not respond.");
      }
      if (tripRef.current !== requestTripState) {
        throw new Error("The itinerary changed while TravelPilot was responding. Ask again for the latest plan.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: payload.answer,
          toolLog: payload.toolLog ?? [],
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <section className="mt-12 border-t border-[#d7d0c2] pt-8" aria-labelledby="chat-title">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a05a2c]">Ask TravelPilot</p>
          <h2 id="chat-title" className="mt-2 font-serif text-3xl text-[#17221d]">The itinerary can answer back.</h2>
          <div className="mt-6 min-h-40 space-y-4">
            {messages.length === 0 && (
              <p className="max-w-xl text-sm leading-6 text-[#6d756e]">
                Ask about timing, nearby activities, conflicts, or what changes when a plan moves.
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`max-w-2xl ${message.role === "user" ? "ml-auto" : "mr-auto"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[#17221d] text-[#f9f4eb]" : "border border-[#d7d0c2] bg-[#fbf8f2] text-[#303b33]"}`}>
                  {message.text}
                </div>
                {message.role === "assistant" && message.toolLog && message.toolLog.length > 0 && (
                  <details className="mt-2 text-xs text-[#6d756e]">
                    <summary className="cursor-pointer select-none font-semibold text-[#8b572d]">🔧 Agent reasoning trace</summary>
                    <div className="mt-2 border-l border-[#c8c0b1] pl-3">
                      {message.toolLog.map((entry, index) => (
                        <div key={`${entry.toolName}-${index}`} className="py-1">
                          <p>{toolTrace(entry)}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-[#8b918a]">{formatArguments(entry.arguments)}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
            {isSending && <p className="text-sm text-[#6d756e]">TravelPilot is checking the itinerary...</p>}
          </div>
          {error && <p className="mt-3 text-sm text-[#9b3f2d]">{error}</p>}
          <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your itinerary..."
              className="h-12 min-w-0 flex-1 rounded-full border border-[#c8c0b1] bg-[#fbf8f2] px-5 text-sm outline-none transition placeholder:text-[#9a9b92] focus:border-[#a05a2c]"
              aria-label="Ask TravelPilot a question"
            />
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="h-12 rounded-full bg-[#b65f35] px-5 text-sm font-bold text-white transition hover:bg-[#994b28] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </div>

        <aside className="border-t border-[#d7d0c2] pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d756e]">Try a question</p>
          <div className="mt-4 space-y-2">
            {sampleQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendMessage(question)}
                disabled={isSending}
                className="block w-full rounded-xl border border-[#d7d0c2] bg-[#fbf8f2] px-4 py-3 text-left text-sm text-[#4c584f] transition hover:border-[#a05a2c] hover:text-[#17221d] disabled:cursor-wait disabled:opacity-60"
              >
                {question}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
