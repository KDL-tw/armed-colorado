import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CATALOG_FILE = "gun-bill-catalog-20260828_013008.json";
const CATALOG_PATH = path.join(process.cwd(), "data", CATALOG_FILE);

export async function GET() {
  try {
    const content = fs.readFileSync(CATALOG_PATH, "utf8");
    const catalog = JSON.parse(content);

    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Error loading catalog:", error);
    return NextResponse.json({ error: "Failed to load catalog" }, { status: 500 });
  }
}
