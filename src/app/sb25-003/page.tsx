import type { Metadata } from "next";
import Link from "next/link";
import {
  loadSb25Process,
  loadSb25Ssf,
  loadSb25Instructors,
} from "@/lib/sb25/sb25-client";
import type { FeeRow, Sb25Instructor } from "@/lib/sb25/types";
import { WideGuideLayout } from "@/components/chp/WideGuideLayout";
import { CrsLink, crsCitationsToLinks } from "@/components/chp/CrsLink";
import { PermitStepList } from "@/components/sb25/PermitStepList";
import { SsfSearch } from "@/components/sb25/SsfSearch";

export const metadata: Metadata = {
  title: "SB25-003: Colorado Semiautomatic Firearms",
  description:
    "Colorado SB25-003 guide: what the law is and isn't, the permit-to-purchase process, course options and fees, and the official list of Specified Semiautomatic Firearms.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl text-navy">{title}</h2>
      {children}
    </section>
  );
}

function FeeTable({
  fees,
}: {
  fees: { rows: FeeRow[]; paymentNote: string; totalExcludingFirearm: string };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="border-b border-silver text-left text-silver-muted">
            <th className="w-40 py-2 pr-3 font-medium">Fee</th>
            <th className="w-32 py-2 pr-3 font-medium">Amount</th>
            <th className="w-40 py-2 pr-3 font-medium">Collected by</th>
            <th className="py-2 pr-3 font-medium">What it covers</th>
          </tr>
        </thead>
        <tbody>
          {fees.rows.map((r) => (
            <tr key={r.label} className="border-b border-silver/60 align-top">
              <td className="py-2 pr-3 font-medium text-navy">{r.label}</td>
              <td className="whitespace-nowrap py-2 pr-3 font-semibold text-oxblood">{r.amount}</td>
              <td className="py-2 pr-3 text-muted">{r.collectedBy}</td>
              <td className="py-2 pr-3 text-muted">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstructorTable({ instructors }: { instructors: Sb25Instructor[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="border-b border-silver text-left text-silver-muted">
            <th className="w-40 py-2 pr-3 font-medium">Instructor</th>
            <th className="w-40 py-2 pr-3 font-medium">Organization</th>
            <th className="w-32 py-2 pr-3 font-medium">County</th>
            <th className="w-32 py-2 pr-3 font-medium">City</th>
            <th className="py-2 pr-3 font-medium">Contact</th>
            <th className="w-32 py-2 pr-3 font-medium">Course</th>
          </tr>
        </thead>
        <tbody>
          {instructors.map((ins, i) => {
            const hasContact = Boolean(ins.phone || ins.email || ins.url);
            return (
              <tr key={`${ins.name}-${i}`} className="border-b border-silver/60 align-top">
                <td className="py-2 pr-3 font-medium text-navy">{ins.name}</td>
                <td className="py-2 pr-3 text-muted">{ins.organization ?? "—"}</td>
                <td className="py-2 pr-3 text-muted">{ins.county ?? "—"}</td>
                <td className="py-2 pr-3 text-muted">{ins.city ?? "—"}</td>
                <td className="py-2 pr-3 text-muted">
                  {hasContact ? (
                    <span className="flex flex-wrap gap-x-2">
                      {ins.phone ? <span>{ins.phone}</span> : null}
                      {ins.email ? (
                        <a href={`mailto:${ins.email}`} className="text-oxblood underline">
                          {ins.email}
                        </a>
                      ) : null}
                      {ins.url ? (
                        <a href={ins.url} target="_blank" rel="noopener noreferrer" className="text-oxblood underline">
                          website
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-3 text-muted">{ins.course ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Sb25003Page() {
  const process = loadSb25Process();
  const ssf = loadSb25Ssf();
  const instructors = loadSb25Instructors();
  const { law } = process;
  const asOf = process.fetchedAt.slice(0, 10);

  return (
    <WideGuideLayout
      title="SB25-003"
      lede="The complete guide to Colorado's semiautomatic firearms law — what it is and isn't, the permit-to-purchase process, course options and fees, and the official list of Specified Semiautomatic Firearms. Confirm everything with CPW and your sheriff."
    >
      {/* intro */}
      <p className="mt-6">
        Effective <strong>August 1, 2026</strong>, Colorado’s SB25-003 restricts the purchase,
        sale, and transfer of Specified Semiautomatic Firearms (SSFs). This page explains the law,
        walks through the permit-to-purchase process, and provides the official, up-to-date list of
        covered firearms.{" "}
        <CrsLink citation="18-12-116" /> · <CrsLink citation="18-12-101" /> ·{" "}
        <CrsLink citation="24-35-122" />
      </p>

      {/* ============ The Law ============ */}
      <Section title="The Law">
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="rounded-md border border-silver bg-cream p-5">
            <h3 className="font-display text-xl text-navy">What it is</h3>
            <ul className="mt-2 space-y-2">
              {law.is.map((item, i) => (
                <li key={i} className="text-muted">
                  {crsCitationsToLinks(item)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-silver bg-cream p-5">
            <h3 className="font-display text-xl text-navy">What it isn’t</h3>
            <ul className="mt-2 space-y-2">
              {law.isNot.map((item, i) => (
                <li key={i} className="text-muted">
                  {crsCitationsToLinks(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="callout mt-4 text-sm">
          <p>
            <strong>Effective {law.effectiveDate}.</strong> The prohibition (
            <CrsLink citation="18-12-116" />) applies to manufacture, distribution, transfer,
            sale, and purchase on or after that date — possession of a lawfully owned firearm is not
            itself covered.
          </p>
        </div>
      </Section>

      {/* ============ The Process ============ */}
      <Section title="The Permit-to-Purchase Process">
        <p className="mt-3">
          To legally purchase or transfer a Specified Semiautomatic Firearm, complete these five
          steps. The two long poles are your county’s background-check turnaround and scheduling the
          FSP course.
        </p>
        <div className="mt-6">
          <PermitStepList steps={process.permitSteps} />
        </div>
        <div className="callout mt-6">
          <p className="font-display text-lg text-navy">
            Total time: {process.totals.optimisticTime}
          </p>
          <p className="mt-1">{process.totals.optimisticTimeNote}</p>
        </div>
      </Section>

      {/* ============ The Course ============ */}
      <Section title="The Course">
        <p className="mt-3">
          You must complete a Colorado Firearms Safety Program (FSP) course and pass the exam with
          90% or better. Which course you take depends on your prior experience.
        </p>
        <h3 className="mt-4 font-display text-xl text-navy">Course requirements</h3>
        <ul className="mt-2">
          {process.courseRequirements.map((r, i) => (
            <li key={i} className="text-muted">
              {crsCitationsToLinks(r)}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {process.courseOptions.map((c) => (
            <div key={c.id} className="rounded-md border border-silver bg-cream p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-silver-muted">
                {`${c.hours}-hour course`}
              </p>
              <h3 className="mt-1 font-display text-xl text-navy">{c.title}</h3>
              <p className="mt-2 text-muted">
                <strong className="text-navy">Required when:</strong> {c.requiredWhen}
              </p>
              <p className="mt-1 text-muted">
                <strong className="text-navy">Format:</strong> {c.format}
              </p>
              <p className="mt-1 text-muted">
                <strong className="text-navy">Pass:</strong> {c.passScore}
              </p>
              {c.notes ? (
                <p className="mt-2 text-sm text-muted">
                  <strong className="text-navy">Note:</strong> {c.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {/* ============ Fees ============ */}
      <Section title="Fees">
        <p className="mt-3">
          Colorado’s fee schedule. The state publishes a fixed course-record fee; the sheriff’s
          administrative fee and the FSP instructor’s course fee vary. The firearm’s price is
          excluded.
        </p>
        <div className="mt-4">
          <FeeTable fees={process.fees} />
        </div>
        <div className="callout mt-4 text-sm">
          <p>
            <strong>Total (excluding the firearm):</strong> {process.fees.totalExcludingFirearm}
          </p>
          <p className="mt-1">{process.fees.paymentNote}</p>
        </div>
      </Section>

      {/* ============ The SSF List ============ */}
      <Section title="The List of Specified Semiautomatic Firearms">
        <p className="mt-3">
          The Firearms Dealer Division publishes the official list. {ssf.counts.total} firearms are
          currently listed ({ssf.counts.rifle} rifles, {ssf.counts.shotgun} shotguns,{" "}
          {ssf.counts.handgun} handguns). Search or filter below. This list is updated whenever the
          FDD revises its guidance (current version: {ssf.version}).
        </p>
        <div className="mt-4">
          <SsfSearch firearms={ssf.firearms} version={ssf.version} />
        </div>
        <p className="mt-3 text-sm text-muted">
          To challenge a firearm’s inclusion, the FDD runs a statement-of-position process —{" "}
          <a
            href="https://sbg.colorado.gov/firearms-dealer-division"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oxblood underline"
          >
            see the FDD
          </a>
          .
        </p>
      </Section>

      {/* ============ FSP Instructors ============ */}
      <Section title="Firearms Safety Program Instructors">
        <p className="mt-3">
          Courses are taught by sheriffs-verified FSP instructors (
          <CrsLink citation="18-12-202.7" />). The official instructor directory is maintained by
          CPW.
        </p>
        {instructors.instructors.length === 0 ? (
          <div className="callout mt-4 text-sm">
            <p>
              The instructor directory is coming soon. In the meantime, contact the CPW firearms
              safety team at{" "}
              <a
                href={`mailto:${process.instructorProgram.contact.email}`}
                className="text-oxblood underline"
              >
                {process.instructorProgram.contact.email}
              </a>{" "}
              or {process.instructorProgram.contact.phone}.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <InstructorTable instructors={instructors.instructors} />
          </div>
        )}
      </Section>

      {/* ============ Sources ============ */}
      <section className="mt-16">
        <h2 className="font-display text-2xl text-navy">Sources</h2>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-silver-muted">
              Colorado Parks &amp; Wildlife
            </h3>
            <ul className="mt-2 space-y-1">
              {process.links.cpw.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-oxblood underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-silver-muted">
              State of Colorado · Firearms Dealer Division
            </h3>
            <ul className="mt-2 space-y-1">
              {process.links.sbg.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-oxblood underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          Related:{" "}
          <Link href="/litigation/del-toro-v-polis" className="text-oxblood">
            Del Toro v. Polis
          </Link>{" "}
          ·{" "}
          <Link href="/concealed-carry" className="text-oxblood">
            Concealed Carry Guide
          </Link>
        </p>
      </section>

      <p className="mt-12 text-sm text-muted">
        Statutes and CPW/FDD policies change. This page is built from official sources as of{" "}
        {asOf} and is general information, not legal advice. The current CRS text and official
        CPW/FDD guidance always govern.
      </p>
    </WideGuideLayout>
  );
}
