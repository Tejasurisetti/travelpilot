import { z } from "zod";
import { generateTrip } from "../../../lib/planner";
import { TripSchema } from "../../../lib/types";

const ReplanRequestSchema = z.object({
  tripState: TripSchema,
  budget: z.number().nonnegative(),
  durationDays: z.number().int().min(1).max(30),
  interests: z.array(z.string()).default([]),
});

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = ReplanRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid replan request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { tripState, budget, durationDays, interests } = parsed.data;
    const updatedEndDate = addDays(tripState.startDate, durationDays - 1);
    const generatedTrip = generateTrip({
      destination: tripState.destination,
      startDate: tripState.startDate,
      endDate: updatedEndDate,
      budget,
      interests,
      preferences: tripState.preferences,
    });
    const confirmedItems = tripState.days
      .flatMap((day) => day.items)
      .filter((item) => item.status === "confirmed");
    const generatedDates = new Set(generatedTrip.days.map((day) => day.date));
    const preservedItems = confirmedItems.filter((item) =>
      generatedDates.has(item.startTime.slice(0, 10)),
    );
    const updatedDays = generatedTrip.days.map((day) => {
      const lockedItems = preservedItems.filter(
        (item) => item.startTime.slice(0, 10) === day.date,
      );
      const generatedIds = new Set(day.items.map((item) => item.id));
      const mergedItems = [
        ...day.items.filter((item) => !lockedItems.some((locked) => locked.id === item.id)),
        ...lockedItems.filter((item) => !generatedIds.has(item.id)),
      ].sort((first, second) => first.startTime.localeCompare(second.startTime));
      return { ...day, items: mergedItems };
    });
    const updatedTrip = TripSchema.parse({
      ...generatedTrip,
      id: tripState.id,
      days: updatedDays,
    });
    const droppedConfirmedCount = confirmedItems.length - preservedItems.length;
    const summary = {
      message: `Replanned ${durationDays} day(s) with a ₹${budget.toLocaleString("en-IN")} budget and updated interests. Preserved ${preservedItems.length} confirmed item(s).`,
      preservedConfirmedCount: preservedItems.length,
      droppedConfirmedCount,
    };

    return Response.json({ trip: updatedTrip, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to replan trip";
    return Response.json({ error: message }, { status: 500 });
  }
}
