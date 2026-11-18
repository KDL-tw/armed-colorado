"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/admin-auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  return (
    <form action={formAction} className="grid gap-3">
      <input name="next" value={next} readOnly hidden />
      <input
        name="password"
        type="password"
        placeholder="Admin password"
        required
        autoFocus
        className="admin-input"
      />
      <button type="submit" disabled={pending} className="admin-btn">
        {pending ? "Checking…" : "Sign in"}
      </button>
      {state?.error ? (
        <p className="text-sm text-amber">{state.error}</p>
      ) : null}
    </form>
  );
}
