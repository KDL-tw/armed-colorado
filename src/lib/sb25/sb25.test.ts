import { describe, test } from "node:test";
import assert from "node:assert";
import { parseSsfText } from "./ssf-parser";

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
    assert.equal(data.version, "07/30/2026");
    assert.equal(data.sourceUrl, "https://example.pdf");
  });
});
