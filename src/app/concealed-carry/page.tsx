import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Concealed carry" };

export default function ConcealedCarryPage() {
  return (
    <GuideLayout
      title="Colorado concealed carry laws"
      lede="Overview pointers only — statutes and sheriff policies change."
    >
      <p>
        Colorado issues permits to carry a concealed handgun through county
        sheriffs under state law. Always confirm current CRS sections and your
        county sheriff’s application process.
      </p>
      <ul>
        <li>
          Official statutes:{" "}
          <a
            href="https://leg.colorado.gov/colorado-revised-statutes"
            target="_blank"
            rel="noopener noreferrer"
          >
            Colorado Revised Statutes
          </a>
        </li>
        <li>
          Contact your county sheriff for permit applications, renewals, and
          local instructions.
        </li>
        <li>
          Federal law and other states’ reciprocity rules may affect travel —
          verify before carrying across state lines.
        </li>
        <li>
          Renewal training providers: see{" "}
          <a href="/ccw-renewal">CCW renewal directory</a>.
        </li>
      </ul>
    </GuideLayout>
  );
}
