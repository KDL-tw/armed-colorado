import type { Metadata } from "next";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = {
  title: "Colorado Revised Statutes",
};

export default function StatutesPage() {
  return (
    <GuideLayout
      title="Colorado Revised Statutes"
      lede="Statutory law of the State of Colorado"
    >
      <p>
        This is where CRS links will go.
      </p>
      <p className="mt-4 text-muted">
        Current law is maintained by the Office of the Code Revisor.
      </p>
    </GuideLayout>
  );
}
