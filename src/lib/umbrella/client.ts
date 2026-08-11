import type {
  FiscalCost,
  GunBill,
  BillSponsor,
  UmbrellaHealth,
} from "./types";

function isConfigured(): boolean {
  return Boolean(
    process.env.UMBRELLA_API_KEY && process.env.UMBRELLA_API_URL,
  );
}

export function getUmbrellaHealth(): UmbrellaHealth {
  if (!isConfigured()) {
    return {
      configured: false,
      status: "unconfigured",
      detail:
        "UMBRELLA_API_KEY / UMBRELLA_API_URL not set. Billwatch runs in stub mode with no bill data.",
    };
  }
  return {
    configured: true,
    status: "ok",
    detail: "Umbrella Civic credentials present.",
  };
}

/**
 * Typed Umbrella Civic client.
 * Stub: never invents bills. Live calls activate only when env credentials exist.
 */
export const umbrellaClient = {
  async listGunBills(): Promise<GunBill[]> {
    if (!isConfigured()) return [];
    // Future: GET gun-related bills from Umbrella Terminal API
    return [];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBill(id: string): Promise<GunBill | null> {
    if (!isConfigured()) return null;
    return null;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSponsors(id: string): Promise<BillSponsor[]> {
    if (!isConfigured()) return [];
    return [];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSummary(id: string): Promise<string | null> {
    if (!isConfigured()) return null;
    return null;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getFiscalCost(id: string): Promise<FiscalCost | null> {
    // SMART Act / fiscal note scrape deferred — always unavailable in stub
    if (!isConfigured()) {
      return {
        amountUsd: null,
        source: "unavailable",
        summary: "Fiscal / SMART Act cost data requires Umbrella API + scraper.",
        hearingUrl: null,
      };
    }
    return {
      amountUsd: null,
      source: "unavailable",
      summary: "Fiscal cost endpoint not implemented yet.",
      hearingUrl: null,
    };
  },
};
