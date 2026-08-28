# Task 1 Analysis: Current Billwatch Page Structure and Requirements

## Analysis Date
2026-08-28

---

## Current Implementation Summary

### File: `src/app/billwatch/page.tsx`
- **Line count:** 88 lines
- **Component type:** Async Server Component
- **Structure:**
  - Metadata export with title "Billwatch"
  - Fetches Umbrella Civic API health status
  - Fetches gun bills via `umbrellaClient.listGunBills()`
  - Renders inside `ContentShell` wrapper with width="5xl"
  - Displays API health status indicator
  - Shows "No bills loaded" state when API returns empty
  - Current bill display: Simple list with bill number and status

### Current Data Flow
```
Umbrella Civic API (getUmbrellaHealth + listGunBills)
    ↓
ContentShell wrapper (width="5xl")
    ↓
Render:
  - Header: "Billwatch"
  - API health status badge
  - Empty state or bill list
```

### Current Bill Display (lines 54-73)
- Uses unordered list with divide/border styling
- Each bill shows:
  - Bill number (linked to `/billwatch/${bill.id}`)
  - Status (uppercase, muted color)
  - Title (muted color)
- Links navigate to detail page at `/billwatch/${bill.id}`

---

## File: `src/lib/umbrella/types.ts`

### Current GunBill Type (lines 18-29)
```typescript
export type GunBill = {
  id: string;
  number: string;
  title: string;
  status: BillStatus;  // "proposed" | "passed" | "died" | "unknown"
  session?: string;
  summary: string | null;
  officialUrl: string | null;
  sponsors: BillSponsor[];
  fiscalCost: FiscalCost | null;
  lastAction?: string | null;
};
```

### Supporting Types
```typescript
export type BillStatus = "proposed" | "passed" | "died" | "unknown";

export type BillSponsor = {
  name: string;
  chamber?: string;
  party?: string;
  district?: string;
  role?: "prime" | "co" | string;
};

export type FiscalCost = {
  amountUsd: number | null;
  source: "smart_act" | "fiscal_note" | "unavailable";
  summary: string | null;
  hearingUrl?: string | null;
};
```

---

## File: `src/components/ContentShell.tsx`

### Component Structure
- **Line count:** 24 lines
- **Props:**
  - `children`: React.ReactNode
  - `width`: "xl" | "3xl" | "4xl" | "5xl" (default: "5xl")
- **Styling:**
  - Background: `bg-white`
  - Max width based on width prop
  - Padding: `px-4 pb-20 pt-12 md:pt-14`
  - Min height: `min-h-[70vh]`

---

## New Catalog Structure Design

### Requirement Summary (from plan)

**Fields required for each bill entry:**
1. **Position** - Support/Oppose/Amend indicator (color-coded)
2. **Status** - Legislative status (bold/red for special statuses)
3. **Bill Number** - e.g., "HB26-1000" (hyperlinked to official page)
4. **Title** - Bill title (hyperlinked to official page)
5. **Summary** - Exactly 4 sentences from 2A advocate perspective
6. **Sponsors** - Prime and co-sponsors listed

**Color Requirements:**
- **Position colors:**
  - Support: Green
  - Oppose: Red
  - Amend: Blue
- **Status colors:**
  - Bold for "Signed into law"
  - Red for "Killed in Committee"

**Layout Requirements:**
- Year-grouped tables
- Reverse chronological order (2026 first)
- Each year has its own table section
- Header text remains: "Legislation Billwatch"

### New Component Structure Sketch

```
ContentShell (width="5xl")
├── Header Section
│   ├── "Legislation" label
│   ├── "Billwatch" title
│   └── Description text
├── Year Groups (reverse chronological)
│   ├── 2026 Bills
│   │   ├── Table with header row
│   │   ├── Bill entries with all fields
│   │   └── Position/Status/Number/Title/Summary/Sponsors columns
│   ├── 2025 Bills
│   │   └── (same structure)
│   └── ...
└── Footer (optional: data source, last updated)
```

### Proposed Table Structure

```tsx
<section className="mt-12">
  <h2 className="font-display text-3xl text-navy mb-6">
    2026 Bills - Colorado General Assembly
  </h2>
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-navy/20">
        <th className="text-left py-3 text-sm font-semibold text-muted">Position</th>
        <th className="text-left py-3 text-sm font-semibold text-muted">Status</th>
        <th className="text-left py-3 text-sm font-semibold text-muted">Bill Number</th>
        <th className="text-left py-3 text-sm font-semibold text-muted">Title</th>
        <th className="text-left py-3 text-sm font-semibold text-muted">Summary</th>
        <th className="text-left py-3 text-sm font-semibold text-muted">Sponsors</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-navy/10">
      {bills.map((bill) => (
        <tr key={bill.billNumber}>
          <td className="py-4">
            {/* Position badge: green/red/blue based on value */}
            <span className="text-sm font-medium">
              {bill.position === "Support" && <span className="text-green-600">✓ Support</span>}
              {bill.position === "Oppose" && <span className="text-red-600">✕ Oppose</span>}
              {bill.position === "Amend" && <span className="text-blue-600">✎ Amend</span>}
            </span>
          </td>
          <td className="py-4">
            {/* Status with bold for special values */}
            <span className={`${bill.status === "Signed into law" ? "font-bold" : ""} ${bill.status === "Killed in Committee" ? "text-red-600" : ""}`}>
              {bill.status}
            </span>
          </td>
          <td className="py-4">
            <a href={bill.officialUrl} className="text-oxblood hover:underline font-medium">
              {bill.billNumber}
            </a>
          </td>
          <td className="py-4">
            <a href={bill.officialUrl} className="text-navy hover:underline font-medium">
              {bill.title}
            </a>
          </td>
          <td className="py-4 text-muted leading-relaxed">
            {bill.summary}
          </td>
          <td className="py-4 text-muted">
            {bill.sponsors.join(", ")}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
```

### Proposed New Types

```typescript
// New types for catalog structure
export type BillPosition = "Support" | "Oppose" | "Amend";
export type BillStatusCatalog = 
  | "Signed into law"
  | "Killed in Committee"
  | "Passed House"
  | "Passed Senate"
  | "Held-over"
  | "In Committee"
  | "Filed";

export type GunBillCatalogEntry = {
  position: BillPosition;
  status: BillStatusCatalog;
  billNumber: string;  // e.g., "HB26-1000"
  title: string;
  summary: string;  // Exactly 4 sentences
  sponsors: string[];
  officialUrl: string;  // Link to CO GA bill page
};

export type GunBillCatalogYear = {
  year: number;
  bills: GunBillCatalogEntry[];
};

export type GunBillCatalog = GunBillCatalogYear[];
```

---

## Key Differences from Current Implementation

| Aspect | Current | New Catalog |
|--------|---------|-------------|
| **Data Source** | Umbrella Civic API (stub) | RMGO scraping + CO GA pages |
| **Display Format** | Simple list | Year-grouped tables |
| **Bill Fields** | number, title, status, summary (partial) | position, status, number, title, summary (4 sentences), sponsors |
| **Position Indicator** | None | Green/Red/Blue badges |
| **Status Formatting** | Plain text | Bold/red based on value |
| **Linking** | Bill number only | Bill number AND title both linked |
| **Year Organization** | None | Reverse chronological tables |
| **Sponsors** | Not displayed | Comma-separated list |

---

## Files Referenced

1. `src/app/billwatch/page.tsx` - Current page implementation (88 lines)
2. `src/lib/umbrella/types.ts` - Current GunBill type definition
3. `src/lib/umbrella/client.ts` - Umbrella Civic API client
4. `src/components/ContentShell.tsx` - Page wrapper component

---

## Next Steps

Based on this analysis, Task 2 will:
1. Create `src/lib/gun-bill/types.ts` with new catalog types
2. Define `GunBillCatalogEntry`, `GunBillCatalogYear`, and `GunBillCatalog` types
3. Ensure type compatibility with required fields from the plan

---

*Analysis completed. Ready for Task 2: Create gun bill catalog data type and structure.*
