import {
  createAnonClient,
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/clients";
import {
  FALLBACK_CASES,
  FALLBACK_RESOURCES,
  FALLBACK_SB25_FAQS,
  type CcwOrg,
  type CountyAvailability,
  type EventItem,
  type FaqEntry,
  type LitigationCase,
  type ResourceLink,
  type SourceLink,
  type TimelineItem,
} from "@/lib/data/fallback";

function asTimeline(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is TimelineItem =>
      typeof item === "object" &&
      item !== null &&
      "date" in item &&
      "label" in item,
  ) as TimelineItem[];
}

function asSources(value: unknown): SourceLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SourceLink =>
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "url" in item,
  ) as SourceLink[];
}

export async function getLitigationCases(): Promise<LitigationCase[]> {
  const client = createAnonClient();
  if (!client) return FALLBACK_CASES;
  const { data, error } = await client
    .from("litigation_cases")
    .select("*")
    .eq("published", true)
    .order("title");
  if (error || !data?.length) return FALLBACK_CASES;
  return data.map((row) => ({
    ...row,
    timeline: asTimeline(row.timeline),
    sources: asSources(row.sources),
  }));
}

export async function getLitigationCase(
  slug: string,
): Promise<LitigationCase | null> {
  const cases = await getLitigationCases();
  return cases.find((c) => c.slug === slug) ?? null;
}

export async function getResources(): Promise<ResourceLink[]> {
  const client = createAnonClient();
  if (!client) return FALLBACK_RESOURCES;
  const { data, error } = await client
    .from("resource_links")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (error || !data?.length) return FALLBACK_RESOURCES;
  return data as ResourceLink[];
}

export async function getFaqs(pageKey: string): Promise<FaqEntry[]> {
  const client = createAnonClient();
  if (!client) {
    return FALLBACK_SB25_FAQS.filter((f) => f.page_key === pageKey);
  }
  const { data, error } = await client
    .from("faq_entries")
    .select("*")
    .eq("page_key", pageKey)
    .eq("published", true)
    .order("sort_order");
  if (error || !data?.length) {
    return FALLBACK_SB25_FAQS.filter((f) => f.page_key === pageKey);
  }
  return data as FaqEntry[];
}

export async function getEvents(): Promise<EventItem[]> {
  const client = createAnonClient();
  if (!client) return [];
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("published", true)
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return data as EventItem[];
}

export async function getCcwOrgs(): Promise<CcwOrg[]> {
  const client = createAnonClient();
  if (!client) return [];
  const { data, error } = await client
    .from("ccw_orgs")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (error || !data) return [];
  return data as CcwOrg[];
}

export async function getCountyAvailability(): Promise<CountyAvailability[]> {
  const client = createAnonClient();
  if (!client) return [];
  const { data, error } = await client
    .from("sb25_county_availability")
    .select("*")
    .order("county");
  if (error || !data) return [];
  return data as CountyAvailability[];
}

export async function getPageViewsSummary(): Promise<
  { path: string; count: number }[]
> {
  const client = createServiceClient();
  if (!client) return [];
  const { data, error } = await client
    .from("page_views")
    .select("path")
    .limit(5000);
  if (error || !data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAlertSubscriberCount(): Promise<number> {
  const client = createServiceClient();
  if (!client) return 0;
  const { count } = await client
    .from("alert_subscribers")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export { isSupabaseConfigured, createServiceClient, createAnonClient };
