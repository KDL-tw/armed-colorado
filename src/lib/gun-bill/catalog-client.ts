import type { GunBillCatalogEntry, GunBillCatalogYear } from './types';
import fs from 'fs';
import path from 'path';

const CATALOG_FILE = 'gun-bill-catalog-20260828_013008.json';
const CATALOG_PATH = path.join(process.cwd(), 'data', CATALOG_FILE);

/**
 * Load catalog data from the server
 */
export async function loadGunBillCatalog(): Promise<GunBillCatalogYear[]> {
  try {
    const content = fs.readFileSync(CATALOG_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading catalog from file:', error);
    return [];
  }
}

/**
 * Get catalog for a specific year
 */
export function getYearData(
  catalog: GunBillCatalogYear[],
  year: number
): GunBillCatalogEntry[] {
  const yearData = catalog.find((y) => y.year === year);
  return yearData?.bills || [];
}
