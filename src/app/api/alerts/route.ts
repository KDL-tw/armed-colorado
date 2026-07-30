import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/clients";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      topics?: string[];
    };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400 },
      );
    }
    const topics = Array.isArray(body.topics) ? body.topics : [];
    const client = createAnonClient();
    if (!client) {
      return NextResponse.json({
        ok: true,
        stored: false,
        message:
          "Supabase not configured — email was not stored. Set env vars to enable.",
      });
    }
    const { error } = await client.from("alert_subscribers").upsert(
      { email, topics },
      { onConflict: "email" },
    );
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject: "Armed Colorado alerts confirmed",
          text: "You are signed up for Armed Colorado gun-bill alerts. Reply stop not supported yet — contact the site admin to unsubscribe.",
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
