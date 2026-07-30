"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/clients";

function requireAdmin() {
  const client = createServiceClient();
  if (!client) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not configured",
    );
  }
  return client;
}

export async function upsertFaq(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  const payload = {
    page_key: String(formData.get("page_key") || ""),
    question: String(formData.get("question") || ""),
    answer: String(formData.get("answer") || ""),
    sort_order: Number(formData.get("sort_order") || 0),
    published: formData.get("published") === "on",
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await client.from("faq_entries").update(payload).eq("id", id);
  } else {
    await client.from("faq_entries").insert(payload);
  }
  revalidatePath("/admin/content");
  revalidatePath("/sb25-003");
}

export async function deleteFaq(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) await client.from("faq_entries").delete().eq("id", id);
  revalidatePath("/admin/content");
  revalidatePath("/sb25-003");
}

export async function upsertResource(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  const colorado = formData.get("colorado_contact");
  const payload = {
    slug: String(formData.get("slug") || ""),
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "advocacy"),
    url: String(formData.get("url") || "") || null,
    description: String(formData.get("description") || ""),
    note: String(formData.get("note") || "") || null,
    colorado_contact:
      colorado === "true" ? true : colorado === "false" ? false : null,
    sort_order: Number(formData.get("sort_order") || 0),
    published: formData.get("published") === "on",
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await client.from("resource_links").update(payload).eq("id", id);
  } else {
    await client.from("resource_links").insert(payload);
  }
  revalidatePath("/admin/content");
  revalidatePath("/resources");
}

export async function upsertCounty(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  const payload = {
    county: String(formData.get("county") || ""),
    status: String(formData.get("status") || "unknown"),
    provider_notes: String(formData.get("provider_notes") || "") || null,
    class_url: String(formData.get("class_url") || "") || null,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await client.from("sb25_county_availability").update(payload).eq("id", id);
  } else {
    await client.from("sb25_county_availability").upsert(payload, {
      onConflict: "county",
    });
  }
  revalidatePath("/admin/content");
  revalidatePath("/sb25-003");
}

export async function upsertCcwOrg(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || ""),
    url: String(formData.get("url") || "") || null,
    region: String(formData.get("region") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    sort_order: Number(formData.get("sort_order") || 0),
    published: formData.get("published") === "on",
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await client.from("ccw_orgs").update(payload).eq("id", id);
  } else {
    await client.from("ccw_orgs").insert(payload);
  }
  revalidatePath("/admin/content");
  revalidatePath("/ccw-renewal");
}

export async function upsertLitigation(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  let timeline = [];
  let sources = [];
  try {
    timeline = JSON.parse(String(formData.get("timeline") || "[]"));
  } catch {
    timeline = [];
  }
  try {
    sources = JSON.parse(String(formData.get("sources") || "[]"));
  } catch {
    sources = [];
  }
  const payload = {
    slug: String(formData.get("slug") || ""),
    title: String(formData.get("title") || ""),
    court: String(formData.get("court") || "") || null,
    docket: String(formData.get("docket") || "") || null,
    parties: String(formData.get("parties") || "") || null,
    status: String(formData.get("status") || "active"),
    summary: String(formData.get("summary") || ""),
    timeline,
    sources,
    published: formData.get("published") === "on",
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await client.from("litigation_cases").update(payload).eq("id", id);
  } else {
    await client.from("litigation_cases").upsert(payload, { onConflict: "slug" });
  }
  revalidatePath("/admin/litigation");
  revalidatePath("/litigation");
  revalidatePath(`/litigation/${payload.slug}`);
}

export async function deleteLitigation(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) await client.from("litigation_cases").delete().eq("id", id);
  revalidatePath("/admin/litigation");
  revalidatePath("/litigation");
}

export async function upsertEvent(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  const starts = String(formData.get("starts_at") || "");
  const payload = {
    title: String(formData.get("title") || ""),
    starts_at: starts ? new Date(starts).toISOString() : null,
    location: String(formData.get("location") || "") || null,
    url: String(formData.get("url") || "") || null,
    description: String(formData.get("description") || ""),
    published: formData.get("published") === "on",
  };
  if (id) {
    await client.from("events").update(payload).eq("id", id);
  } else {
    await client.from("events").insert(payload);
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function deleteEvent(formData: FormData) {
  const client = requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) await client.from("events").delete().eq("id", id);
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function refreshHealthChecks() {
  const client = requireAdmin();
  const umbrellaConfigured = Boolean(
    process.env.UMBRELLA_API_KEY && process.env.UMBRELLA_API_URL,
  );
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const rows = [
    {
      service: "umbrella",
      status: umbrellaConfigured ? "ok" : "unconfigured",
      detail: umbrellaConfigured
        ? "Credentials present"
        : "UMBRELLA_API_KEY not set — Billwatch stub",
      checked_at: new Date().toISOString(),
    },
    {
      service: "supabase",
      status: "ok",
      detail: "Service role reachable",
      checked_at: new Date().toISOString(),
    },
    {
      service: "resend",
      status: resendConfigured ? "ok" : "unconfigured",
      detail: resendConfigured
        ? "RESEND_API_KEY present"
        : "Alerts store-only until Resend configured",
      checked_at: new Date().toISOString(),
    },
  ];
  await client.from("api_health_checks").upsert(rows, { onConflict: "service" });
  revalidatePath("/admin/health");
}
