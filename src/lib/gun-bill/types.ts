export type GunBillPosition = "Support" | "Oppose" | "Amend";

export type GunBillStatus =
  | "Signed into law"
  | "Killed in Committee"
  | "Passed House"
  | "Passed Senate"
  | "Held-over";

export type GunBillCatalogEntry = {
  position: GunBillPosition;
  status: GunBillStatus;
  billNumber: string;
  title: string;
  summary: string;
  sponsors: string[];
  officialUrl: string;
};

export type GunBillCatalogYear = {
  year: number;
  bills: GunBillCatalogEntry[];
};

export type GunBillCatalog = GunBillCatalogYear[];
