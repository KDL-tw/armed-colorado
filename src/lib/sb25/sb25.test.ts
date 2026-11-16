import { describe, test } from "node:test";
import assert from "node:assert";
import { parseSsfText } from "./ssf-parser";
import { parseInstructorsCsv } from "./instructor-parser";

const FF = String.fromCharCode(12); // form-feed (PDF page-break char)

const SAMPLE = [
  "Some intro prose line that should be discarded.",
  "SEMIAUTOMATIC RIFLES WITH DETACHABLE MAGAZINES",
  "",
  "AERO PRECISION - AC-15 SERIES",
  "",
  "3",
  FF + "Photographs are examples only and do not represent all variations of the listed firearms in",
  "the series.",
  "",
  "ALEXANDER ARMS - .17 HMR STANDARD",
  "RIFLE",
  "",
  "SEMIAUTOMATIC SHOTGUNS WITH DETACHABLE MAGAZINES",
  "",
  "AKDAL - MKA 1919",
  "",
  "Photographs are examples only and do not represent all variations of the listed firearms",
  "in the series.",
  "",
  "ADDENDUM",
  "",
  "SEMIAUTOMATIC GAS-OPERATED PISTOLS WITH DETACHABLE MAGAZINES",
  "",
  "ACME RIFLES - PROXIMAL AM-15 SERIES",
].join("\n");

describe("parseSsfText", () => {
  test("groups wrapped lines, tags category, flags addendum, drops noise", () => {
    const data = parseSsfText(SAMPLE, "https://example.pdf", "07/30/2026");
    assert.equal(data.counts.total, 4);
    assert.equal(data.counts.rifle, 2);
    assert.equal(data.counts.shotgun, 1);
    assert.equal(data.counts.handgun, 1);
    assert.equal(data.firearms[0].name, "AERO PRECISION - AC-15 SERIES");
    assert.equal(data.firearms[1].name, "ALEXANDER ARMS - .17 HMR STANDARD RIFLE");
    assert.equal(data.firearms[2].name, "AKDAL - MKA 1919");
    assert.equal(data.firearms[2].category, "shotgun");
    assert.equal(data.firearms[3].name, "ACME RIFLES - PROXIMAL AM-15 SERIES");
    assert.equal(data.firearms[3].category, "handgun");
    assert.equal(data.firearms[3].inAddendum, true);
    // no footer / page-number leakage
    assert.ok(!data.firearms.some((f) => /^\d+$/.test(f.name)));
    assert.ok(!data.firearms.some((f) => /photographs are examples/i.test(f.name)));
    assert.ok(!data.firearms.some((f) => /in the series/i.test(f.name)));
    assert.equal(data.version, "07/30/2026");
    assert.equal(data.sourceUrl, "https://example.pdf");
  });

  test("drops prose, known notes, and same-category duplicates", () => {
    const DUP_SAMPLE = [
      "SEMIAUTOMATIC RIFLES WITH DETACHABLE MAGAZINES",
      "",
      "B&T FIREARMS - SPC SERIES",
      "",
      "SEMIAUTOMATIC MODELS ONLY",
      "",
      "The following rifles were added based on public feedback previously",
      "unidentified manufacturers.",
      "",
      "BEAR CREEK ARSENAL - BC-15 SERIES",
      "",
      "BEAR CREEK ARSENAL - BC-15 SERIES",
      "",
      "SEMIAUTOMATIC SHOTGUNS WITH DETACHABLE MAGAZINES",
      "",
      "AKDAL - MKA 1919",
    ].join("\n");
    const data = parseSsfText(DUP_SAMPLE, "https://example.pdf", "07/30/2026");
    assert.equal(data.counts.total, 3);
    assert.equal(data.counts.rifle, 2);
    assert.equal(data.counts.shotgun, 1);
    assert.equal(data.counts.handgun, 0);
    // known note dropped
    assert.ok(!data.firearms.some((f) => /models only/i.test(f.name)));
    // prose sentence dropped (wrapped across two lines)
    assert.ok(!data.firearms.some((f) => /following rifles were added/i.test(f.name)));
    // same-name+category duplicate deduped to one
    assert.equal(
      data.firearms.filter((f) => f.name === "BEAR CREEK ARSENAL - BC-15 SERIES").length,
      1,
    );
  });
});

const CSV = [
  "Name,Organization,County,City,Phone,Email,URL,Course,Notes",
  '"Doe, Jane","ABC Range","Boulder","Boulder","(303) 555-0100","j@abc.co","https://abc.co","Basic / Extended","Verified 2026"',
  '"Smith, Ray",,Denver,,,ray@x.co,,Extended,  ',
].join("\n");

describe("parseInstructorsCsv", () => {
  test("maps headers, handles quoted commas, skips name-less rows", () => {
    const data = parseInstructorsCsv(CSV, "test");
    assert.equal(data.instructors.length, 2);
    assert.equal(data.instructors[0].name, "Doe, Jane");
    assert.equal(data.instructors[0].organization, "ABC Range");
    assert.equal(data.instructors[0].city, "Boulder");
    assert.equal(data.instructors[1].name, "Smith, Ray");
    assert.equal(data.instructors[1].county, "Denver");
    assert.equal(data.instructors[1].course, "Extended");
  });
});
