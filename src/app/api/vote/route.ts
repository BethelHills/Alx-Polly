// app/api/vote/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServerClient";
import { z } from "zod";

const voteSchema = z.object({
  poll_id: z.string().uuid(),
  option: z.string().min(1).max(150)
});

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRes, error: userErr } = await supabaseServer.auth.getUser(token);
    if (userErr || !userRes?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = userRes.user;

    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const { poll_id, option } = parsed.data;

    const { data, error } = await supabaseServer
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

    await supabaseServer.from("audit_logs").insert({
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
