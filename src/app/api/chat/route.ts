import { z } from "zod";
import { runAgentTurn } from "../../../lib/claude";
import { TripSchema } from "../../../lib/types";

const ChatRequestSchema = z.object({
  tripState: TripSchema,
  userMessage: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = ChatRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid chat request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await runAgentTurn(parsed.data.tripState, parsed.data.userMessage);
    return Response.json({ answer: result.text, toolLog: result.toolCalls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to answer chat request";
    return Response.json({ error: message }, { status: 500 });
  }
}
