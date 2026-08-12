import type { Metadata } from "next";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = {
  title: "How to testify at the Colorado Legislature",
};

export default function TestifyingPage() {
  return (
    <GuideLayout
      title="How to testify at the Colorado Legislature"
      lede="Testify in person or remotely at Senate and House committee hearings. All testimony requires registration."
    >
      <p>
        Members of the public may participate in the legislative process by
        testifying at committee hearings in person, remotely, or in writing. All
        testimony requires registration via the
        <a
          href="https://www.leg.state.co.us/clics/clics2026A/commsumm.nsf/NewSignIn.xsp"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-oxblood hover:underline"
        >
          Public Testimony Registration form
        </a>
        .
      </p>

      <section>
        <h2 className="font-display text-2xl text-navy">Before you testify</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <strong>Find your committee:</strong> Bills are assigned to committees
            of reference in the House and Senate. Check the
            <a
              href="https://leg.colorado.gov/bills/bill-search"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium text-oxblood hover:underline"
            >
              daily calendar
            </a>
            for hearing schedules.
          </li>
          <li>
            <strong>Know the rules:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-muted">
              <li>Cell phones and electronic devices must be silenced</li>
              <li>No placards, applause, or verbal interruptions</li>
              <li>The chair may clear the public to prevent disruption</li>
              <li>After testifying, you may stay and listen to the rest of the hearing</li>
            </ul>
          </li>
          <li>
            <strong>Written testimony:</strong> You may submit written testimony
            to the committee in addition to or instead of oral testimony.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          How to sign up to testify in person
        </h2>
        <p className="mt-4">
          Committee meetings are open to the public. To testify in person:
        </p>
        <ol className="mt-4 ml-6 list-decimal space-y-4 text-muted">
          <li>
            <strong>Register online:</strong>
            <a
              href="https://www.leg.state.co.us/clics/clics2026A/commsumm.nsf/NewSignIn.xsp"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium text-oxblood hover:underline"
            >
              Complete the Public Testimony Registration form
            </a>
            . Select the bill/hearing and choose &quot;In Person&quot; as your testimony
            method.
          </li>
          <li>
            <strong>Arrive early:</strong> Committee rooms are in the Capitol
            Complex:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>
                <strong>Senate committees:</strong> Legislative Services Building
                (LSB), 200 E. 14th Ave., LSB-B (west side, first floor)
              </li>
              <li>
                <strong>House committees:</strong> LSB, 200 E. 14th Ave., LSB-A
                (east side, first floor)
              </li>
              <li>
                <strong>Special locations:</strong> Senate Committee Room Hallway
                (3rd floor), House Committee Room Hallway (basement), Room 271
                (2nd floor), Old Supreme Court Chamber (2nd floor)
              </li>
            </ul>
          </li>
          <li>
            <strong>Check in:</strong> Sign in with committee staff before the
            hearing starts. Staff will provide a speaker card and announce your
            name when it&apos;s your turn.
          </li>
          <li>
            <strong>When recognized:</strong> Give your name, address, and reason
            for testifying. Stay concise—committees often have many speakers.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          How to sign up to testify remotely
        </h2>
        <p className="mt-4">
          Remote testimony allows you to participate via phone or video. To
          testify remotely:
        </p>
        <ol className="mt-4 ml-6 list-decimal space-y-4 text-muted">
          <li>
            <strong>Register online:</strong>
            <a
              href="https://www.leg.state.co.us/clics/clics2026A/commsumm.nsf/NewSignIn.xsp"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium text-oxblood hover:underline"
            >
              Complete the Public Testimony Registration form
            </a>
            . Select the bill/hearing and choose &quot;Remote&quot; as your testimony
            method. The form will ask for your phone number.
          </li>
          <li>
            <strong>Watch the video guide:</strong>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/lrL_gWHYFxg"
                title="How to testify remotely - Colorado Legislature"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              Watch: &quot;Testifying Remotely&quot; by the Colorado General Assembly
            </p>
          </li>
          <li>
            <strong>Join the hearing:</strong> At the scheduled time, call the
            phone number provided in your registration confirmation or join the
            video meeting link. Audio only is sufficient for testimony.
          </li>
          <li>
            <strong>Wait for your turn:</strong> The committee chair will call
            your name when it&apos;s your turn to speak. State your name, address,
            and position clearly.
          </li>
          <li>
            <strong>Listen to others:</strong> Remote participants may listen to
            the entire hearing via audio broadcast even after testifying.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">Finding hearings</h2>
        <p className="mt-4">
          Committee hearings are scheduled daily during the legislative session:
        </p>
        <ul className="mt-4 space-y-3">
          <li>
            <a
              href="https://leg.colorado.gov/bills/bill-search"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Daily calendar and hearing schedule
            </a>
            — Find which bills are being heard and in which committee
          </li>
          <li>
            <a
              href="https://leg.colorado.gov/watch-and-listen"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              Live video and audio
            </a>
            — Watch or listen to committee meetings online
          </li>
          <li>
            <a
              href="https://colorado.open.media/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-oxblood hover:underline"
            >
              The Colorado Channel
            </a>
            — Live and archived video of chamber proceedings
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">
          Committee locations
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border border-navy/10 p-4">
            <h3 className="font-semibold text-navy">Senate Committees</h3>
            <p className="mt-2 text-sm text-muted">
              Legislative Services Building (LSB), 200 E. 14th Ave.
              <br />
              LSB-B (west side, first floor)
            </p>
          </div>
          <div className="border border-navy/10 p-4">
            <h3 className="font-semibold text-navy">House Committees</h3>
            <p className="mt-2 text-sm text-muted">
              Legislative Services Building (LSB), 200 E. 14th Ave.
              <br />
              LSB-A (east side, first floor)
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">Need help?</h2>
        <p className="mt-4">
          For questions about testifying, contact the committee staff listed on
          the
          <a
            href="https://leg.colorado.gov/find-my-legislator"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-medium text-oxblood hover:underline"
          >
            Find My Legislator
          </a>
          page or call the General Assembly info line.
        </p>
      </section>
    </GuideLayout>
  );
}
