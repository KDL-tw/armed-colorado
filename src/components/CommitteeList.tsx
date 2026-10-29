"use client";

import type { Committee, CommitteeMember } from "@/lib/committee/types";
import CopyEmailsButton from "./CopyEmailsButton";

interface CommitteeListProps {
  committees: Committee[];
}

function MemberCard({ m }: { m: CommitteeMember }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-3">
      <div className="aspect-square w-full overflow-hidden rounded-md bg-slate-100">
        {m.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/legislator-photo?slug=${m.slug}`}
            alt={m.name}
            width={200}
            height={200}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
            {m.name.charAt(0)}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-navy">{m.name}</p>
      <p className="text-center text-xs text-muted">
        {m.title}
        {m.district ? ` · ${m.district}` : ""}
        {m.role ? ` · ${m.role}` : ""}
      </p>
      <a
        href={`mailto:${m.email}`}
        className="mt-1 break-all text-center text-xs text-oxblood hover:underline"
      >
        {m.email}
      </a>
      <p className="text-center text-xs text-muted">{m.phone}</p>
    </div>
  );
}

export default function CommitteeList({ committees }: CommitteeListProps) {
  if (committees.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-muted">
        No committee data available. Run{" "}
        <code className="rounded bg-slate-200 px-1">npx tsx scripts/fetch-committees.ts</code>{" "}
        to populate it.
      </p>
    );
  }
  return (
    <div className="space-y-8">
      {committees.map((c) => {
        const uniqueEmails = Array.from(new Set(c.members.map((m) => m.email)));
        return (
          <section
            key={c.slug}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl text-navy">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline decoration-navy/25 underline-offset-2 transition-colors hover:text-oxblood hover:decoration-oxblood"
                  >
                    {c.name}
                  </a>
                </h3>
                {c.description ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted">{c.description}</p>
                ) : null}
              </div>
              <CopyEmailsButton emails={uniqueEmails} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {c.members.map((m) => (
                <MemberCard key={m.slug} m={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
