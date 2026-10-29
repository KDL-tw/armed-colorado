import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Self-Defense Resources" };

export default function SelfDefensePage() {
  return (
    <GuideLayout
      title="Legal Resources for Self-Defense"
      lede="Colorado self-defense and use-of-force law is nuanced. This is not legal advice."
    >
      <p>
        Start with the current Colorado Revised Statutes on use of force and
        related defenses, then consult a Colorado-licensed attorney for your
        situation.
      </p>
      <ul>
        <li>
          <a
            href="https://leg.colorado.gov/colorado-revised-statutes"
            target="_blank"
            rel="noopener noreferrer"
          >
            Search CRS for use of physical force / deadly force
          </a>
        </li>
        <li>
          Local criminal defense counsel and civil rights / 2A firms listed on{" "}
          <a href="/resources">Resources</a> (e.g. Mountain States Legal
          Foundation for certain constitutional matters).
        </li>
        <li>
          After any defensive incident, prioritize safety and medical aid; do
          not rely on website summaries in place of counsel.
        </li>
      </ul>
    </GuideLayout>
  );
}
