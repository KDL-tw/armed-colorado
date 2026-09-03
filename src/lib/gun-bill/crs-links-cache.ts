import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory is relative to project root
const PROJECT_ROOT = path.join(__dirname, '../../..');
const CACHE_DIR = path.join(PROJECT_ROOT, '.cache', 'crs-links');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export interface CrsLinkEntry {
  citation: string;
  url: string;
  evidence: string;
  alternates?: string[];
  status: 'resolved' | 'unresolved';
  resolvedAt?: string;
}

export type CrsCache = Map<string, CrsLinkEntry>;

/**
 * Load CRS links cache from disk
 */
export function loadCrsCache(): CrsCache {
  const cache = new Map<string, CrsLinkEntry>();

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      const data = JSON.parse(content) as Record<string, CrsLinkEntry>;
      Object.entries(data).forEach(([billNumber, entry]) => {
        cache.set(billNumber, entry);
      });
    } catch (error) {
      console.error('Error loading CRS links cache:', error);
    }
  }

  return cache;
}

/**
 * Save CRS links cache to disk
 */
export function saveCrsCache(cache: CrsCache): void {
  const data: Record<string, CrsLinkEntry> = {};
  cache.forEach((entry, billNumber) => {
    data[billNumber] = entry;
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Set a CRS link entry for a bill number and save immediately
 */
export function setCrsEntry(billNumber: string, entry: CrsLinkEntry): void {
  const cache = loadCrsCache();
  cache.set(billNumber, entry);
  saveCrsCache(cache);
}

/**
 * Get a CRS link entry by bill number
 */
export function getCrsEntry(billNumber: string): CrsLinkEntry | undefined {
  const cache = loadCrsCache();
  return cache.get(billNumber);
}
