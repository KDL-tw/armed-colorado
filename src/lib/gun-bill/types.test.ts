import {
  type GunBillPosition,
  type GunBillStatus,
  type GunBillCatalogEntry,
  type GunBillCatalogYear,
  type GunBillCatalog,
} from "./types";

// Type checks - these assignments verify type correctness at compile time

// GunBillPosition type checks
const supportPosition: GunBillPosition = "Support";
const opposePosition: GunBillPosition = "Oppose";
const amendPosition: GunBillPosition = "Amend";

// GunBillStatus type checks
const signedStatus: GunBillStatus = "Signed into law";
const killedStatus: GunBillStatus = "Killed in Committee";
const passedHouseStatus: GunBillStatus = "Passed House";
const passedSenateStatus: GunBillStatus = "Passed Senate";
const heldOverStatus: GunBillStatus = "Held-over";

// GunBillCatalogEntry type check with all required fields
const mockEntry: GunBillCatalogEntry = {
  position: "Support",
  status: "Passed House",
  billNumber: "HB26-1000",
  title: "Test Gun Bill Title",
  summary:
    "This is the first sentence of the summary. This is the second sentence. This is the third sentence. This is the fourth sentence.",
  sponsors: ["John Doe", "Jane Smith"],
  officialUrl: "https://leg.colorado.gov/bills/HB26-1000",
};

// GunBillCatalogYear type check
const mockYear: GunBillCatalogYear = {
  year: 2026,
  bills: [mockEntry],
};

// GunBillCatalog type check (array of years in reverse chronological order)
const mockCatalog: GunBillCatalog = [
  { year: 2026, bills: [mockEntry] },
  { year: 2025, bills: [mockEntry] },
];

// Verify array is ordered correctly (2026 first, then 2025)
const isReverseChronological =
  mockCatalog[0].year > mockCatalog[1].year ||
  (mockCatalog[0].year === mockCatalog[1].year && mockCatalog.length === 1);

// Test that entries can have multiple bills per year
const multiBillYear: GunBillCatalogYear = {
  year: 2026,
  bills: [
    {
      position: "Oppose",
      status: "Held-over",
      billNumber: "HB26-1001",
      title: "Another Test Bill",
      summary:
        "Summary sentence one. Summary sentence two. Summary sentence three. Summary sentence four.",
      sponsors: ["Bob Johnson"],
      officialUrl: "https://leg.colorado.gov/bills/HB26-1001",
    },
    {
      position: "Amend",
      status: "Killed in Committee",
      billNumber: "SB26-2000",
      title: "Senate Test Bill",
      summary:
        "First sentence of senate bill. Second sentence. Third sentence. Fourth sentence.",
      sponsors: ["Alice Williams", "Charlie Brown"],
      officialUrl: "https://leg.colorado.gov/bills/SB26-2000",
    },
  ],
};

// Verify type compatibility - assigning to more specific types should work
const _positionCheck: GunBillPosition = supportPosition;
const _statusCheck: GunBillStatus = signedStatus;
const _entryCheck: GunBillCatalogEntry = mockEntry;
const _yearCheck: GunBillCatalogYear = mockYear;
const _catalogCheck: GunBillCatalog = mockCatalog;

// Export for potential runtime testing
export {
  supportPosition,
  opposePosition,
  amendPosition,
  signedStatus,
  killedStatus,
  passedHouseStatus,
  passedSenateStatus,
  heldOverStatus,
  mockEntry,
  mockYear,
  mockCatalog,
  multiBillYear,
  isReverseChronological,
};
