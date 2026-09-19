import Anthropic from "@anthropic-ai/sdk";
import type { Message, MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import type { BackupOption, Day, Trip, TripItem } from "./types";
import {
  calculateBudget,
  detectConflicts,
  findAlternatives,
  rebuildDay,
} from "./scheduler";

const MAX_TOOL_ROUNDS = 8;
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";

export interface ToolCallLog {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface AgentTurnResult {
  text: string;
  toolCalls: ToolCallLog[];
}

export const travelPilotTools: Anthropic.Tool[] = [
  {
    name: "check_conflicts",
    description: "Check a day's itinerary for overlapping activities or insufficient travel time.",
    input_schema: {
      type: "object",
      properties: {
        dayDate: {
          type: "string",
          description: "The itinerary date to check in YYYY-MM-DD format.",
        },
      },
      required: ["dayDate"],
    },
  },
  {
    name: "rebuild_itinerary",
    description: "Flag a changed itinerary item, select a compatible backup, and reorder that day.",
    input_schema: {
      type: "object",
      properties: {
        dayDate: {
          type: "string",
          description: "The itinerary date containing the changed item.",
        },
        changedItemId: {
          type: "string",
          description: "The id of the cancelled or changed item.",
        },
        reason: {
          type: "string",
          description: "Why the item changed, such as cancellation or venue closure.",
        },
      },
      required: ["dayDate", "changedItemId", "reason"],
    },
  },
  {
    name: "find_alternatives",
    description: "Find deterministic backup options matching an itinerary item's category, location, and budget.",
    input_schema: {
      type: "object",
      properties: {
        dayDate: {
          type: "string",
          description: "The itinerary date containing the item.",
        },
        changedItemId: {
          type: "string",
          description: "The item id for which alternatives are needed.",
        },
      },
      required: ["dayDate", "changedItemId"],
    },
  },
  {
    name: "get_budget_summary",
    description: "Calculate daily and category-by-category trip costs, excluding cancelled items.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({ apiKey });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Tool input must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Tool input requires a non-empty ${key}`);
  }
  return value;
}

function findDay(tripState: Trip, dayDate: string): Day {
  const day = tripState.days.find((candidate) => candidate.date === dayDate);
  if (!day) {
    throw new Error(`No itinerary day found for ${dayDate}`);
  }
  return day;
}

function findItem(day: Day, changedItemId: string): TripItem {
  const item = day.items.find((candidate) => candidate.id === changedItemId);
  if (!item) {
    throw new Error(`No itinerary item found for ${changedItemId}`);
  }
  return item;
}

function callSchedulerTool(
  name: string,
  rawInput: unknown,
  tripState: Trip,
): unknown {
  const input = asRecord(rawInput);

  switch (name) {
    case "check_conflicts": {
      const day = findDay(tripState, requiredString(input, "dayDate"));
      return detectConflicts(day);
    }
    case "rebuild_itinerary": {
      const day = findDay(tripState, requiredString(input, "dayDate"));
      const changedItemId = requiredString(input, "changedItemId");
      const reason = requiredString(input, "reason");
      return rebuildDay(day, changedItemId, reason, tripState.backups);
    }
    case "find_alternatives": {
      const day = findDay(tripState, requiredString(input, "dayDate"));
      const item = findItem(day, requiredString(input, "changedItemId"));
      return findAlternatives(item, tripState.backups);
    }
    case "get_budget_summary":
      return calculateBudget(tripState);
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }
}

function textFromResponse(response: Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function toolUsesFromResponse(response: Message): Anthropic.ToolUseBlock[] {
  return response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
}

/** Runs one Claude turn and dispatches all business decisions to deterministic scheduler functions. */
export async function runAgentTurn(
  tripState: Trip,
  userMessage: string,
): Promise<AgentTurnResult> {
  const client = getClient();
  const messages: MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: [
            "Trip state (JSON):",
            JSON.stringify(tripState),
            "",
            "Traveler request:",
            userMessage,
          ].join("\n"),
        },
      ],
    },
  ];
  const toolCalls: ToolCallLog[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 1200,
      system:
        "You are TravelPilot. Answer clearly from the supplied trip state. Use tools for all conflict, replacement, and budget calculations. Treat tool results as authoritative.",
      messages,
      tools: travelPilotTools,
    });
    const toolUses = toolUsesFromResponse(response);

    if (toolUses.length === 0) {
      return { text: textFromResponse(response), toolCalls };
    }

    messages.push({ role: "assistant", content: response.content });
    const toolResults: ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      const input = asRecord(toolUse.input);
      toolCalls.push({ toolName: toolUse.name, arguments: input });

      try {
        const result = callSchedulerTool(toolUse.name, input, tripState);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      } catch (error) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          is_error: true,
          content: error instanceof Error ? error.message : "Unknown scheduler error",
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(`Claude exceeded the ${MAX_TOOL_ROUNDS}-round tool limit`);
}
