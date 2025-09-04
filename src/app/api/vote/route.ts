// app/api/vote/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { z } from "zod";

const voteSchema = z.object({
  poll_id: z.string().uuid(),
  option: z.string().min(1).max(150)
});

/**
 * Submits a vote for a specific poll option.
 * 
 * This endpoint handles vote submission with authentication, validation, and duplicate
 * vote prevention. It ensures each user can only vote once per poll and maintains
 * an audit trail of all voting activity. The endpoint validates the poll ID format
 * and option text before processing the vote.
 * 
 * @param req - Request object containing vote data and authorization header
 * @returns Promise<NextResponse> - JSON response with success status and vote data or error details
 * 
 * @throws {401} Unauthorized - When authorization header is missing or token is invalid
 * @throws {400} Invalid input - When poll_id or option fails validation
 * @throws {409} User already voted - When user attempts to vote multiple times on same poll
 * @throws {500} Internal server error - When database operations fail or unexpected errors occur
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/vote', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <jwt-token>'
 *   },
 *   body: JSON.stringify({
 *     poll_id: '123e4567-e89b-12d3-a456-426614174000',
 *     option: 'JavaScript'
 *   })
 * });
 * ```
 * 
 * @security
 * - Requires valid JWT token in Authorization header
 * - Enforces unique vote constraint (one vote per user per poll)
 * - Validates poll_id as UUID format
 * - Sanitizes option text (1-150 characters)
 * - Logs all voting activity for audit trail
 * 
 * @since 1.0.0
 */
export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRes, error: userErr } = await supabaseServerClient.auth.getUser(token);
    if (userErr || !userRes?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = userRes.user;

    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { poll_id, option } = parsed.data;

    const { data, error } = await supabaseServerClient
      .from("votes")
      .insert([{ poll_id, option, user_id: user.id }])
      .select();

    if (error) {
      // Postgres unique violation code 23505 -> user already voted
      if ((error as any).code === "23505" || /(duplicate|unique)/i.test(String((error as any).message || ""))) {
        return NextResponse.json({ error: "User already voted" }, { status: 409 });
      }
      console.error("vote insert error:", error);
      return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
    }

    await supabaseServerClient.from("audit_logs").insert({
      user_id: user.id,
      action: "vote",
      target_id: poll_id,
      details: { option }
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("vote POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
