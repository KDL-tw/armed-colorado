import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = { title: "Register to vote" };

export default function VotePage() {
  return (
    <GuideLayout
      title="How to register to vote in Colorado"
      lede="Colorado offers online, mail, and in-person voter registration."
    >
      <p>
        Use the official Colorado Secretary of State voter registration portal
        to register or update your record:
      </p>
      <p>
        <a
          href="https://www.sos.state.co.us/voter/pages/pub/olvr/verifyNewVoter.xhtml"
          target="_blank"
          rel="noopener noreferrer"
        >
          Colorado voter registration / status check →
        </a>
      </p>
      <ul>
        <li>You must be a U.S. citizen and Colorado resident.</li>
        <li>You must be at least 16 to preregister; 18 by Election Day to vote.</li>
        <li>Colorado primarily uses mail ballots; track deadlines on the SOS site.</li>
      </ul>
      <p>
        County clerk contact list:{" "}
        <a
          href="https://www.sos.state.co.us/pubs/elections/Resources/CountyClerkContact.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          County clerks
        </a>
        .
      </p>
    </GuideLayout>
  );
}
