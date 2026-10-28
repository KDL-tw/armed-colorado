"use client";

import { useEffect, useState } from "react";
import type { CommitteeCatalog } from "@/lib/committee/types";
import CommitteeList from "./CommitteeList";

export type TabId = "find" | "house" | "senate";

const TABS: { id: TabId; label: string }[] = [
  { id: "find", label: "Find My Legislator" },
  { id: "house", label: "House Committees" },
  { id: "senate", label: "Senate Committees" },
];

function isTabId(v: string | null): v is TabId {
  return v === "find" || v === "house" || v === "senate";
}

interface LegislatorsTabsProps {
  catalog: CommitteeCatalog;
  initialTab: TabId;
}

export default function LegislatorsTabs({ catalog, initialTab }: LegislatorsTabsProps) {
  const [tab, setTab] = useState<TabId>(initialTab);

  // Deep-link: ?tab=house|senate|find. Keep the URL in sync so a reload or
  // share lands on the same tab. history.replaceState avoids history spam.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (tab === "find") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    window.history.replaceState(null, "", url.toString());
  }, [tab]);

  const house = catalog.committees.filter((c) => c.chamber === "house");
  const senate = catalog.committees.filter((c) => c.chamber === "senate");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber " +
                (active
                  ? "bg-oxblood text-white"
                  : "bg-white text-navy hover:bg-slate-100 border border-slate-300")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "find" ? (
        <div className="prose-guide">
          <p>
            The official lookup on the Colorado General Assembly (coleg) site:
          </p>
          <p>
            <a
              href="https://leg.colorado.gov/find-my-legislator"
              target="_blank"
              rel="noopener noreferrer"
            >
              Find my legislator →
            </a>
          </p>
          <ul>
            <li>Enter your address to see your State Representative and State Senator.</li>
            <li>
              From each legislator profile you can find committee assignments, sponsored
              bills, and contact information.
            </li>
            <li>
              Session calendars and hearing schedules live on{" "}
              <a href="https://leg.colorado.gov/" target="_blank" rel="noopener noreferrer">
                leg.colorado.gov
              </a>
              .
            </li>
          </ul>
          <p>
            Tip: when contacting your members about a gun bill, cite the bill number
            (e.g. SB25-003) and how it affects you personally.
          </p>
          <p className="mt-6 text-sm text-muted">
            For the full roster of every committee member — names, photos, emails, and
            phones — use the <strong>House Committees</strong> and{" "}
            <strong>Senate Committees</strong> tabs above.
          </p>
        </div>
      ) : (
        <CommitteeList committees={tab === "house" ? house : senate} />
      )}
    </div>
  );
}
