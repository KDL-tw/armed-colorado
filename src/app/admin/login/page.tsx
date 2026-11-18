import type { Metadata } from "next";
import { ContentShell } from "@/components/ContentShell";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in — Armed Colorado",
};

type Props = {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  return (
    <ContentShell width="xl">
      <h1 className="font-display text-4xl text-navy">Admin sign in</h1>
      <p className="mt-3 text-sm text-muted">
        Shared admin password. Sessions last 12 hours.
      </p>
      <div className="mt-8 max-w-sm">
        <LoginForm next={next} />
      </div>
    </ContentShell>
  );
}
