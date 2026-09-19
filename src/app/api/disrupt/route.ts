import { z } from "zod";
import { rebuildDay } from "../../../lib/scheduler";
import { TripSchema } from "../../../lib/types";

const DisruptionRequestSchema = z.object({
  tripState: TripSchema,
  itemId: z.string().min(1),
  reason: z.string().trim().min(1).max(200),
});

export interface DisruptionSummary {
  message: string;
  dayDate: string;
  cancelledItemName: string;
  replacementName?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = DisruptionRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid disruption request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { tripState, itemId, reason } = parsed.data;
    const dayIndex = tripState.days.findIndex((day) =>
      day.items.some((item) => item.id === itemId),
    );
    if (dayIndex === -1) {
      return Response.json({ error: `No itinerary item found for ${itemId}` }, { status: 404 });
    }

    const day = tripState.days[dayIndex];
    const changedItem = day.items.find((item) => item.id === itemId);
    if (!changedItem) {
      return Response.json({ error: `No itinerary item found for ${itemId}` }, { status: 404 });
    }

    const updatedDay = rebuildDay(day, itemId, reason, tripState.backups);
    const replacement = updatedDay.items.find(
      (item) => item.id !== itemId && !day.items.some((existingItem) => existingItem.id === item.id),
    );
    const updatedTrip = TripSchema.parse({
      ...tripState,
      days: tripState.days.map((candidate, index) =>
        index === dayIndex ? updatedDay : candidate,
      ),
    });
    const replacementText = replacement
      ? `added ${replacement.name} as replacement`
      : "no compatible replacement was found";
    const summary: DisruptionSummary = {
      message: `${changedItem.name} cancelled -> rebuilt Day ${dayIndex + 1}, ${replacementText}.`,
      dayDate: day.date,
      cancelledItemName: changedItem.name,
      ...(replacement ? { replacementName: replacement.name } : {}),
    };

    return Response.json({ trip: updatedTrip, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to simulate disruption";
    return Response.json({ error: message }, { status: 500 });
  }
}
