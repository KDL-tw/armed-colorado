import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "How to testify" };

export default function TestifyPage() {
  return (
    <GuideLayout
      title="How to testify at the Colorado Capitol"
      lede="Committee hearings are open to the public. Show up prepared and concise."
    >
      <ul>
        <li>
          Find hearing times on{" "}
          <a
            href="https://leg.colorado.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            leg.colorado.gov
          </a>{" "}
          calendars and committee pages.
        </li>
        <li>
          Sign in to testify (in person or remote when offered) before the
          hearing starts — follow the committee’s posted instructions.
        </li>
        <li>
          Keep remarks short: who you are, the bill number, your position
          (support/oppose/amend), and one personal impact.
        </li>
        <li>
          Written testimony can often be submitted to the committee — check the
          chair’s / staff instructions.
        </li>
        <li>
          Pair testimony with outreach to{" "}
          <a href="/legislators">your legislators</a>.
        </li>
      </ul>
      <p>
        Track moving bills via <a href="/alerts">Alerts</a> once Umbrella-powered
        notifications are live.
      </p>
    </GuideLayout>
  );
}
