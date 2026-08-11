import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = {
  title: "Register to vote in Colorado",
};

export default function VotePage() {
  return (
    <GuideLayout
      title="Register to vote in Colorado"
      lede="All Colorado residents can register online, by mail, or in person. Learn eligibility, deadlines, and acceptable ID. All active registered voters receive mail ballots automatically."
    >
      <section>
        <h2 className="font-display text-2xl text-navy">How to Register</h2>
        <p className="mt-4 text-muted">
          Colorado offers three ways to register to vote or update your voter
          registration:
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Online Registration</h3>
        <p className="mt-2">
          Register or update your record online at{" "}
          <a
            href="https://www.coloradosos.gov/voter/pages/pub/olvr/verifyNewVoter.xhtml"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            GoVoteColorado.gov
          </a>
          .
        </p>
        <p className="mt-2">
          <strong>Eligibility:</strong> You must have a valid Colorado driver&apos;s
          license, state ID card issued by the Department of Revenue, or be
          able to provide the last four digits of your Social Security number.
        </p>
        <p className="mt-2">
          <strong>Deadline:</strong> Register online through the 8th day before
          Election Day to receive your ballot by mail.
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Mail Registration</h3>
        <p className="mt-2">
          Download and complete the{" "}
          <a
            href="https://www.coloradosos.gov/pubs/elections/vote/VoterRegFormEnglish.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            Colorado Voter Registration Form (PDF)
          </a>
          .
        </p>
        <p className="mt-2">
          Submit by mail, email, or fax to your county clerk and recorder.
        </p>
        <p className="mt-2">
          <strong>Deadline:</strong>
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>Mail/Fax/Email: 8 days before Election Day for mail ballot</li>
          <li>Voter Registration Drive: 22 days before Election Day</li>
        </ul>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">In-Person Registration</h3>
        <p className="mt-2">
          Register in person at any of the following locations:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>County Voter Service and Polling Center</li>
          <li>DMV when applying for or updating your driver&apos;s license</li>
          <li>Public assistance offices</li>
          <li>Armed forces recruitment offices</li>
          <li>Any federal, state, or local government office</li>
        </ul>
        <p className="mt-2">
          <strong>Deadline:</strong> Any day through Election Day.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">Eligibility Requirements</h2>
        <p className="mt-4">
          To register to vote in Colorado, you must:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>Be a U.S. citizen</li>
          <li>
            Be a Colorado resident for at least 22 days before the election you
            intend to vote in
          </li>
          <li>
            Be at least 16 years old to preregister (must be 18 by Election Day
            to vote)
          </li>
          <li>
            Not currently serving a term of imprisonment for a felony conviction
          </li>
        </ul>
        <p className="mt-4">
          <strong>Special cases:</strong>
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>You can vote if on probation for misdemeanor or felony</li>
          <li>You can vote if a pretrial detainee awaiting trial</li>
          <li>
            If previously incarcerated for felony, you must re-register to vote
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Registration Deadlines
        </h2>
        <div className="my-6 overflow-hidden rounded-md border border-silver">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">
                  Deadline for Mail Ballot
                </th>
                <th className="px-4 py-3 font-medium">
                  Deadline for In-Person Only
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver bg-white">
              <tr>
                <td className="px-4 py-3">Online</td>
                <td className="px-4 py-3">8 days before Election Day</td>
                <td className="px-4 py-3">
                  Any day through Election Day
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Mail/Fax/Email</td>
                <td className="px-4 py-3">8 days before Election Day</td>
                <td className="px-4 py-3">
                  Any day through Election Day
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Voter Registration Drive</td>
                <td className="px-4 py-3">22 days before Election Day</td>
                <td className="px-4 py-3">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-muted">
          You may register in-person at a Voter Service and Polling Center
          through Election Day regardless of registration method.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Acceptable Forms of ID for Voting
        </h2>
        <p className="mt-4">
          All voters must present ID when voting in person. Acceptable forms
          include:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>Valid Colorado driver&apos;s license or state ID card</li>
          <li>Valid U.S. passport or passport card</li>
          <li>
            Valid employee ID card with photo (federal, state, local government)
          </li>
          <li>Valid pilot&apos;s license (FAA)</li>
          <li>Valid U.S. military ID card with photo</li>
          <li>
            Copy of current utility bill, bank statement, government check,
            paycheck (within 60 days)
          </li>
          <li>Certificate of Degree of Indian or Alaskan Native Blood</li>
          <li>Valid Medicare or Medicaid card</li>
          <li>Certified U.S. birth certificate</li>
          <li>Certified documentation of naturalization</li>
          <li>Valid student ID with photo (Colorado higher education)</li>
          <li>Valid veteran ID (VA)</li>
          <li>
            Valid tribal government ID certifying tribal membership
          </li>
          <li>Division of youth services ID card</li>
        </ul>
        <p className="mt-4">
          <strong>Note:</strong> All acceptable forms may be presented in
          digital format. Documents showing address must show Colorado address
          to qualify.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Special Circumstances
        </h2>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Homeless Voters</h3>
        <p className="mt-2">
          You may use any physical location as your &quot;home base&quot; where you
          regularly return and intend to remain:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>Park, vacant lot, or homeless shelter</li>
          <li>Campground or bus station</li>
          <li>Any other physical location you intend to remain</li>
        </ul>
        <p className="mt-2">
          <strong>Mailing address:</strong> You must provide a mailing address
          for ballot delivery. A PO box is acceptable for this purpose.
        </p>
        <p className="mt-2">
          <strong>Note:</strong> PO boxes cannot be used as residence addresses.
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">
          Voters in Foreclosure or Eviction
        </h3>
        <p className="mt-2">
          A foreclosure or eviction notice does NOT affect your voting rights:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>
            If still living at your address: no registration change needed
          </li>
          <li>
            If moved: update registration with your new &quot;home base&quot; address
          </li>
          <li>
            If moved out of state: register to vote in your new state
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">
          Voters Displaced by Natural Disaster
        </h3>
        <p className="mt-2">
          If displaced by fire, flood, tornado, or other natural disaster:
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>
            You may use your previous address while temporarily displaced
          </li>
          <li>
            If you have a new permanent residence: update your registration
          </li>
          <li>
            If you plan to return: remain registered at your previous address
          </li>
          <li>
            You may need to update your mailing address for ballot delivery
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Track Your Ballot
        </h2>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">BallotTrax</h3>
        <p className="mt-2">
          Sign up for free email or SMS text alerts at{" "}
          <a
            href="https://ballottrax.coloradosos.gov/voter/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            ballottrax.coloradosos.gov
          </a>
          .
        </p>
        <p className="mt-2">
          Track your ballot from mailing through counting with status updates.
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Cure Your Ballot</h3>
        <p className="mt-2">
          If your ballot signature is mismatched or missing, you can &quot;cure&quot; it:
        </p>
        <p className="mt-2">
          <a
            href="https://myballot.coloradosos.gov/ecure/app/home"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            Cure your ballot online →
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Find Your County Clerk
        </h2>
        <p className="mt-4">
          All 64 Colorado counties have a clerk and recorder who manages
          elections. Find your county:
        </p>
        <p className="mt-2">
          <a
            href="https://www.coloradosos.gov/pubs/elections/Resources/CountyElectionOffices.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            County election offices and websites →
          </a>
        </p>
        <p className="mt-4">
          <strong>SOS Elections Division Contact:</strong>
        </p>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>Phone: 303-894-2200</li>
          <li>
            Email:{" "}
            <a
              href="mailto:State.ElectionDivision@coloradosos.gov"
              className="font-medium text-oxblood hover:underline"
            >
              State.ElectionDivision@coloradosos.gov
            </a>
          </li>
          <li>Address: 1700 Broadway, Suite 550, Denver CO 80290</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          FAQs and Additional Resources
        </h2>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Frequently Asked Questions</h3>
        <p className="mt-2">
          <a
            href="https://www.coloradosos.gov/pubs/elections/FAQs/FAQsMain.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-oxblood hover:underline"
          >
            Elections &amp; Voting FAQs
          </a>
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Additional Resources</h3>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>
            <a
              href="https://coloradosos.gov/pubs/elections/files/KnowYourRights.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Know Your Voting Rights (PDF)
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/UOCAVA.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Military &amp; Overseas Voters (UOCAVA)
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/accessibleVoting.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Accessible Voting Options
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/FAQs/languageAssist.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Language Assistance Hotline
            </a>
          </li>
          <li>
            <a
              href="https://leg.colorado.gov/content/initiatives/initiatives-blue-book-overview/ballot-information-booklet-blue-book"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Ballot Issue Information (Blue Book)
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-display text-xl text-navy">Get Involved</h3>
        <ul className="mt-2 ml-6 list-disc text-muted">
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/votedSticker/contest.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              &quot;I Voted&quot; digital sticker contest
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/allInChallenge.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Colorado campus voting challenge
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/highSchoolVoterChallenge.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              High School voter registration challenge
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/Resources/BecomeElectionJudge.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Become an election judge or student election judge
            </a>
          </li>
          <li>
            <a
              href="https://www.coloradosos.gov/pubs/elections/vote/veteran.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Vote in honor of a veteran
            </a>
          </li>
        </ul>
      </section>

      <p className="mt-12">
        <Link href="/vote" className="font-medium text-oxblood hover:underline">
          ← Back to voting information
        </Link>
      </p>
    </GuideLayout>
  );
}
