import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Find your legislators" };

export default function LegislatorsPage() {
  return (
    <GuideLayout
      title="Find your Colorado legislators"
      lede="Use the Colorado General Assembly tools to look up your House and Senate members."
    >
      <p>
        Official lookup on the Colorado General Assembly (coleg) site:
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
          From each legislator profile you can find committee assignments,
          sponsored bills, and contact information.
        </li>
        <li>
          Session calendars and hearing schedules live on{" "}
          <a
            href="https://leg.colorado.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            leg.colorado.gov
          </a>
          .
        </li>
      </ul>
      <p>
        Tip: when contacting your members about a gun bill, cite the bill number
        (e.g. SB25-003) and how it affects you personally.
      </p>
    </GuideLayout>
  );
}
