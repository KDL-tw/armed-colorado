import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the assembled catalog JSON
const CATALOG_PATH = path.join(__dirname, "../../../data/gun-bill-catalog-20260828_013008.json");

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
