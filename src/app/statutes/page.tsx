import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Colorado Revised Statutes" };

export default function StatutesPage() {
  return (
    <GuideLayout
      title="Colorado Revised Statutes"
      lede="The CRS is the codified body of Colorado state law."
    >
      <p>
        Browse or search the official Colorado Revised Statutes:
      </p>
      <p>
        <a
          href="https://leg.colorado.gov/colorado-revised-statutes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Colorado Revised Statutes →
        </a>
      </p>
      <ul>
        <li>
          Firearms-related provisions often appear in Title 18 (Criminal Code)
          and related titles — always verify the current section text.
        </li>
        <li>
          Bills that pass can amend, add, or repeal CRS sections; Billwatch will
          surface those links once Umbrella Civic is connected.
        </li>
      </ul>
    </GuideLayout>
  );
}
