"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  constantTimeEqual,
  signSession,
} from "@/lib/admin-auth/session";

/** Only allow same-site /admin* return paths (blocks open redirect). */
function resolveNext(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    (value === "/admin" || value.startsWith("/admin/"))
  ) {
    return value;
  }
  return "/admin";
}

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = process.env.ADMIN_PASSWORD;
  const attempt = String(formData.get("password") ?? "");
  const next = resolveNext(formData.get("next"));

  if (!password) {
    return { error: "Admin not configured (ADMIN_PASSWORD missing from env)." };
  }

  if (attempt.length > 0 && (await constantTimeEqual(attempt, password))) {
    const store = await cookies();
    store.set(SESSION_COOKIE, await signSession(password), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.ADMIN_SECURE_COOKIE === "1",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    redirect(next);
  }

  return { error: "Incorrect password." };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
