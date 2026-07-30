import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";
import { getCcwOrgs } from "@/lib/data/queries";

export const metadata: Metadata = { title: "CCW renewal directory" };

export default async function CcwRenewalPage() {
  const orgs = await getCcwOrgs();

  return (
    <GuideLayout
      title="Concealed carry renewal organizations"
      lede="Referral directory for Colorado CCW training and renewal providers. Editable in admin."
    >
      <p>
        Confirm instructor credentials, curriculum, and sheriff acceptance
        before booking. Armed Colorado does not endorse providers.
      </p>
      {orgs.length === 0 ? (
        <p>
          No organizations listed yet. Add entries in{" "}
          <a href="/admin">Admin → Content</a>, or contact your county sheriff
          for approved instructors.
        </p>
      ) : (
        <ul>
          {orgs.map((org) => (
            <li key={org.id ?? org.name}>
              {org.url ? (
                <a href={org.url} target="_blank" rel="noopener noreferrer">
                  {org.name}
                </a>
              ) : (
                <strong>{org.name}</strong>
              )}
              {org.region ? ` — ${org.region}` : ""}
              {org.phone ? ` · ${org.phone}` : ""}
              {org.notes ? ` — ${org.notes}` : ""}
            </li>
          ))}
        </ul>
      )}
    </GuideLayout>
  );
}
