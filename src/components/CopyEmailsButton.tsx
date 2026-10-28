"use client";

import { useState } from "react";

interface CopyEmailsButtonProps {
  emails: string[]; // unique, in roster order
}

/**
 * Copies the committee's member emails (newline-joined) to the clipboard.
 * Label: "Email Every Member (N)" -> "Copied!" for 2s.
 * Clipboard is a client-only API; the button no-ops gracefully if the
 * clipboard API is unavailable (e.g. non-secure context).
 */
export default function CopyEmailsButton({ emails }: CopyEmailsButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    if (emails.length === 0) return;
    try {
      await navigator.clipboard.writeText(emails.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (non-secure context, etc.) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
    >
      {copied ? "Copied!" : `Email Every Member (${emails.length})`}
    </button>
  );
}
