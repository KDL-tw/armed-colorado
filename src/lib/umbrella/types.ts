export type BillStatus = "proposed" | "passed" | "died" | "unknown";

export type BillSponsor = {
  name: string;
  chamber?: string;
  party?: string;
  district?: string;
  role?: "prime" | "co" | string;
};

export type FiscalCost = {
  amountUsd: number | null;
  source: "smart_act" | "fiscal_note" | "unavailable";
  summary: string | null;
  hearingUrl?: string | null;
};

export type GunBill = {
  id: string;
  number: string;
  title: string;
  status: BillStatus;
  session?: string;
  summary: string | null;
  officialUrl: string | null;
  sponsors: BillSponsor[];
  fiscalCost: FiscalCost | null;
  lastAction?: string | null;
};

export type UmbrellaHealth = {
  configured: boolean;
  status: "ok" | "unconfigured" | "error";
  detail: string;
};
