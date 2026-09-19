import { z } from "zod";
import { generateTrip } from "../../../lib/planner";
import { TripPreferencesSchema } from "../../../lib/types";

const PlanRequestSchema = z
  .object({
    destination: z.string().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    budget: z.number().nonnegative(),
    interests: z.array(z.string()).default([]),
    preferences: TripPreferencesSchema.optional(),
  })
  .refine((request) => request.endDate >= request.startDate, {
    message: "endDate must be the same as or after startDate",
    path: ["endDate"],
  });

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = PlanRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid planning request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    return Response.json(generateTrip(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build trip";
    const status = message.startsWith("Unsupported destination") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
