import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Gun trusts" };

export default function GunTrustsPage() {
  return (
    <GuideLayout
      title="Gun trust resources"
      lede="Estate planning tools some owners use for firearms — not legal advice."
    >
      <p>
        A gun trust is a legal arrangement that can help with transfer and
        possession rules, especially for regulated items under federal NFA
        rules. Colorado and federal requirements interact; work with an attorney
        who understands both.
      </p>
      <ul>
        <li>Consult a Colorado estate / firearms attorney before forming a trust.</li>
        <li>
          ATF maintains NFA forms and guidance:{" "}
          <a
            href="https://www.atf.gov/firearms"
            target="_blank"
            rel="noopener noreferrer"
          >
            ATF Firearms
          </a>
          .
        </li>
        <li>
          State transfer and magazine / feature rules may still apply to
          trust-held firearms — verify current CRS and SB25-003 impacts.
        </li>
      </ul>
    </GuideLayout>
  );
}
