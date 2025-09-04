// app/api/polls/route.ts (server)
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { createPollSchema } from "@/lib/schemas/poll";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verify user from token
    const { data: userRes, error: userErr } = await supabaseServerClient.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = userRes.user;

    // validate body
    const body = await req.json();
    const parse = createPollSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input", details: parse.error.flatten() }, { status: 400 });
    }

    const { title, options } = parse.data;

    // insert poll
    const { data, error } = await supabaseServerClient.from("polls").insert({
      title,
      options,
      owner: user.id,
    }).select();

    if (error) {
      console.error("supabase insert poll error:", error);
      return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
    }

    // create audit log
    await supabaseServerClient.from("audit_logs").insert({
      user_id: user.id,
      action: "create_poll",
      target_id: data?.[0]?.id ?? null,
      details: { titleLength: title.length },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error("polls POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
