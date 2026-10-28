import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Serves resized legislator photos from data/committee-photos/<slug>.jpg.
 * Slug is whitelisted to [a-z0-9-]+ (leg.colorado.gov slugs) — nothing else,
 * which also defeats path traversal.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = path.join(process.cwd(), "data", "committee-photos", `${slug}.jpg`);
  if (!fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(file);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
