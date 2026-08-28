import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory is relative to project root
const PROJECT_ROOT = path.join(__dirname, '../../../');
const CACHE_DIR = path.join(PROJECT_ROOT, '.cache/bill-text');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Load cached bill texts from disk
 */
export function loadBillTextCache(): Map<string, string> {
  const cache = new Map<string, string>();

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      const data = JSON.parse(content) as Record<string, string>;
      Object.entries(data).forEach(([url, text]) => {
        cache.set(url, text);
      });
    } catch (error) {
      console.error('Error loading bill text cache:', error);
    }
  }

  return cache;
}

/**
 * Save bill text cache to disk
 */
export function saveBillTextCache(cache: Map<string, string>): void {
  const data: Record<string, string> = {};
  cache.forEach((text, url) => {
    data[url] = text;
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get cached bill text or undefined
 */
export function getCachedBillText(url: string): string | undefined {
  const cache = loadBillTextCache();
  return cache.get(url);
}

/**
 * Set cached bill text and save to disk
 */
export function setCachedBillText(url: string, text: string): void {
  const cache = loadBillTextCache();
  cache.set(url, text);
  saveBillTextCache(cache);
}
