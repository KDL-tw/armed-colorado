import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { WideGuideLayout } from "@/components/chp/WideGuideLayout";
import { CrsLink } from "@/components/chp/CrsLink";
import { StepList } from "@/components/chp/StepList";
import { UsReciprocityMap, type UsStatesTopology } from "@/components/chp/UsReciprocityMap";
import { ColoradoSheriffsMap } from "@/components/chp/ColoradoSheriffsMap";
import { loadCrsData, loadReciprocityData, loadSheriffsData } from "@/lib/chp/chp-client";
import { loadDistrictsData } from "@/lib/districts/districts-client";

export const metadata: Metadata = {
  title: "Concealed Handgun Permit (CHP) Guide",
  description:
    "Colorado concealed carry law: CHP statutes, how to obtain and renew a CHP, state reciprocity, and every county sheriff's office.",
};

const money = (n: number) => `$${n.toFixed(2)}`;

function FeeTable({ label, fee, statute }: { label: string; fee: { total: number; parts: { label: string; amount: number }[]; citation: string }; statute?: boolean }) {
  return (
    <div className="rounded-md border border-silver bg-cream p-4">
      <p className="font-display text-lg text-navy">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-oxblood">{money(fee.total)}</p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {fee.parts.map((p) => (
            <tr key={p.label}>
              <td className="py-0.5 text-muted">{p.label}</td>
              <td className="py-0.5 text-right text-navy">{money(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {statute ? (
        <p className="mt-2 text-sm">Statute: <CrsLink citation={fee.citation.replace(/\(.*$/, "")} /></p>
      ) : null}
    </div>
  );
}

export default function ConcealedCarryPage() {
  const crs = loadCrsData();
  const reciprocity = loadReciprocityData();
  const sheriffs = loadSheriffsData();
  const districts = loadDistrictsData();
  const usTopology = JSON.parse(
    readFileSync(path.join(process.cwd(), "data/us-states/states-10m.json"), "utf8"),
  ) as UsStatesTopology;

  return (
    <WideGuideLayout
      title="Colorado Concealed Handgun Permit (CHP)"
      lede="The complete guide to Colorado concealed carry: the statutes, how to obtain and renew a CHP, which states honor yours, and every county sheriff's office."
    >
      {/* ============ 1. Concealed Handgun Carry Laws ============ */}
      <h2 className="font-display text-3xl text-navy">Concealed Handgun Carry Laws</h2>
      <p className="mt-3">
        Colorado’s concealed handgun permit (CHP) law is codified in <CrsLink citation="18-12-201" /> through{" "}
        <CrsLink citation="18-12-216" /> (Part 2, Article 12, Title 18 of the Colorado Revised Statutes), with related
        carrying offenses in <CrsLink citation="18-12-105" /> and limits on local regulation in{" "}
        <CrsLink citation="29-11.7-101" /> through <CrsLink citation="29-11.7-104" />. County sheriffs issue permits; the
        Colorado Bureau of Investigation (CBI) runs the background checks.
      </p>

      {/* Statute table (CBI list only; `related` statutes render below) */}
      <h3 className="mt-6 font-display text-xl text-navy">The statutes</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b border-silver text-left text-muted">
              <th className="w-32 py-2 pr-3">Citation</th>
              <th className="py-2 pr-3">What it covers</th>
            </tr>
          </thead>
          <tbody>
            {crs.statutes.filter((s) => !s.related).map((s) => (
              <tr key={s.citation} className="border-b border-silver/60 align-top">
                <td className="whitespace-nowrap py-2 pr-3">
                  <CrsLink citation={s.citation} federal={s.federal} />
                </td>
                <td className="whitespace-normal py-2 text-muted">
                  <strong className="text-navy">{s.title}.</strong> {s.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related statutes — govern the topics below but are not in the CBI CHP statute list */}
      {crs.statutes.some((s) => s.related) && (
        <>
          <h3 className="mt-6 font-display text-xl text-navy">Related statutes</h3>
          <p className="mt-1 text-sm text-muted">
            These provisions apply to CHP holders but are not part of the CBI CHP statute list.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <tbody>
                {crs.statutes.filter((s) => s.related).map((s) => (
                  <tr key={s.citation} className="border-b border-silver/60 align-top">
                    <td className="whitespace-nowrap py-2 pr-3">
                      <CrsLink citation={s.citation} federal={s.federal} />
                    </td>
                    <td className="whitespace-normal py-2 text-muted">
                      <strong className="text-navy">{s.title}.</strong> {s.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* The 10 topics */}
      {crs.topics.map((t) => (
        <div key={t.id} id={t.id} className="mt-8">
          <h3 className="font-display text-xl text-navy">{t.heading}</h3>
          <p className="mt-2">{t.summary}</p>
          <p className="mt-1 text-sm">
            {t.citations.map((c, j) => (
              <span key={c}>
                {j > 0 && " · "}
                <CrsLink citation={c} federal={c.startsWith("18 USC")} />
              </span>
            ))}
          </p>
        </div>
      ))}

      {/* ============ 2. Obtaining a CHP ============ */}
      <h2 className="mt-12 font-display text-3xl text-navy">Obtaining a Concealed Handgun Permit (CHP) in Colorado</h2>
      <p className="mt-3">
        A first-time CHP is applied for at your county sheriff’s office. The positive case (no exemptions) is the
        numbered process below; fees are set by statute and paid to the sheriff, made payable to CBI.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <FeeTable label="New CHP application" fee={crs.fees.newApplication} statute />
        <FeeTable label="Temporary emergency permit" fee={crs.fees.temporaryEmergency} statute />
        <FeeTable label="CHP renewal" fee={crs.fees.renewal} statute />
      </div>
      <p className="callout mt-4 text-sm">{crs.fees.paymentNote}</p>
      <div className="mt-6">
        <StepList steps={crs.obtain.steps} exceptions={crs.obtain.exceptions} stepLabel="First-time CHP" />
      </div>

      <h3 className="mt-8 font-display text-xl text-navy">Common questions</h3>
      <div className="mt-3 space-y-4">
        {crs.faqs.map((f, i) => (
          <div key={i}>
            <p className="font-medium text-navy">{f.question}</p>
            <p className="mt-1 text-muted">
              {f.answer}{" "}
              {f.citations.map((c, j) => (
                <span key={c}>
                  {j > 0 && " · "}
                  <CrsLink citation={c} />
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* ============ 3. Reciprocity ============ */}
      <h2 className="mt-12 font-display text-3xl text-navy">Reciprocity</h2>
      <p className="mt-3">
        Reciprocity means Colorado honors a valid concealed-carry permit from another state — and that state honors a
        Colorado CHP in return. Example: a resident of <strong>Utah</strong> with a valid Utah permit may carry
        concealed in Colorado, because Colorado and Utah have full reciprocity. Under{" "}
        <CrsLink citation="18-12-213" />, Colorado recognizes an out-of-state permit only when:
      </p>
      <ul className="mt-2">
        {reciprocity.requirements.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <div className="mt-6">
        <UsReciprocityMap topology={usTopology} states={reciprocity.states} />
      </div>

      {/* ============ 4. Renewing Your CHP ============ */}
      <h2 className="mt-12 font-display text-3xl text-navy">Renewing Your CHP in Colorado</h2>
      <p className="mt-3">
        CHPs are valid for five years (<CrsLink citation="18-12-204" />). Renewal is a name-based check — no new
        fingerprints because your prints are already on file with CBI — and costs {money(crs.fees.renewal.total)}{" "}
        (<CrsLink citation="18-12-211" />).
      </p>
      <div className="mt-6">
        <StepList steps={crs.renew.steps} exceptions={crs.renew.exceptions} stepLabel="Renewal" />
      </div>

      {/* ============ 5. Contacting your Sheriff ============ */}
      <h2 className="mt-12 font-display text-3xl text-navy">Contacting Your Sheriff’s Department</h2>
      <p className="mt-3">
        Every Colorado county issues CHPs through its sheriff’s office. Hover a county for its contact details; click to
        open its CHP page. Some fields (email, CHP application URL, hours) are not yet published for every county — call
        the office when a field is missing.
      </p>
      <div className="mt-6">
        <ColoradoSheriffsMap counties={districts.counties} sheriffs={sheriffs.sheriffs} />
      </div>

      <p className="mt-12 text-sm text-muted">
        Statutes and sheriff policies change. This page is refreshed automatically from official sources; the current
        CRS text always governs. This is general information, not legal advice.
      </p>
    </WideGuideLayout>
  );
}
