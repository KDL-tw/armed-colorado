import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Restore rights" };

export default function RestoreRightsPage() {
  return (
    <GuideLayout
      title="Restoring firearm rights after a felony"
      lede="Process overview with official starting points. Outcomes depend on conviction type, jurisdiction, and current law."
    >
      <p>
        Federal and Colorado law generally prohibit firearm possession by people
        convicted of qualifying felonies. Restoration pathways — if any — may
        involve pardons, expungement/sealing where allowed, or other relief.
        This is not a guarantee of eligibility.
      </p>
      <ul>
        <li>
          Colorado Governor’s Office clemency / pardon information (start with
          official state pages for current forms).
        </li>
        <li>
          Courts and criminal defense counsel for Colorado-specific sealing /
          restoration motions where authorized.
        </li>
        <li>
          Federal prohibitions (18 U.S.C. § 922(g) and related) may remain even
          after some state relief — federal counsel may be required.
        </li>
      </ul>
      <p>
        Always verify with a licensed attorney and official agency guidance
        before possessing firearms.
      </p>
    </GuideLayout>
  );
}
