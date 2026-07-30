import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/clients";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      path?: string;
      referrer?: string | null;
    };
    if (!body.path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const client = createAnonClient();
    if (!client) {
      return NextResponse.json({ ok: true, stored: false });
    }
    await client.from("page_views").insert({
      path: body.path.slice(0, 500),
      referrer: body.referrer?.slice(0, 500) ?? null,
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
