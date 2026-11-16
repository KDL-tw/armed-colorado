import type { Sb25Instructor, Sb25Instructors } from "./types";

/**
 * Convert the user-provided Google Sheet export (CSV) into instructor rows.
 * The Google sheet itself is not fetchable by the agent (owner policy blocks
 * Google); the user exports it to CSV and this maps the columns by header.
 */

/** Minimal RFC-4180-ish CSV parse (quoted fields, escaped quotes, commas/newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Maps the user's CSV header names (case-insensitive) onto Sb25Instructor fields. */
const HEADER_MAP: Record<string, keyof Sb25Instructor | undefined> = {
  name: "name", instructor: "name", "instructor name": "name",
  organization: "organization", org: "organization",
  county: "county", city: "city",
  phone: "phone", "phone number": "phone",
  email: "email", "email address": "email",
  url: "url", website: "url",
  course: "course", "courses offered": "course",
  notes: "notes",
};

export function parseInstructorsCsv(text: string, source: string): Sb25Instructors {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("instructors CSV needs a header row plus at least one data row");
  const map = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase()] ?? null);
  if (!map.includes("name")) {
    throw new Error("CSV header has no 'Name' column — expected headers: Name, Organization, County, City, Phone, Email, URL, Course, Notes");
  }
  const instructors: Sb25Instructor[] = [];
  for (const row of rows.slice(1)) {
    const rec: Record<string, string> = {};
    row.forEach((val, i) => { const k = map[i]; if (k) rec[k] = val.trim(); });
    if (!rec.name) continue; // skip blank / name-less rows
    instructors.push({
      name: rec.name,
      organization: rec.organization ?? null,
      county: rec.county ?? null,
      city: rec.city ?? null,
      phone: rec.phone ?? null,
      email: rec.email ?? null,
      url: rec.url ?? null,
      course: rec.course ?? null,
      notes: rec.notes ?? null,
    });
  }
  if (instructors.length === 0) throw new Error("no instructor rows parsed — check the CSV header names");
  return { fetchedAt: new Date().toISOString(), source, instructors };
}
