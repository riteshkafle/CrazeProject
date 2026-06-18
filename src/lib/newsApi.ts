const NEWS_KEY = import.meta.env.VITE_NEWS_API_KEY as string;
const BASE = '/api/news';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
}

// Brands with ambiguous names need explicit queries to avoid false positives.
// All others fall back to the generic commercial keyword pattern.
const BRAND_QUERIES: Partial<Record<string, { targeted: string; broad: string }>> = {
  celsius: {
    targeted: '"Celsius" AND ("energy drink" OR "Celsius Holdings" OR fitness OR beverage OR marketing OR brand OR campaign OR launch)',
    broad: '"Celsius Holdings" OR ("Celsius" AND "energy drink")',
  },
  ghost: {
    targeted: '"Ghost Energy" OR ("Ghost" AND ("energy drink" OR supplement OR KDP OR "Keurig Dr Pepper" OR beverage OR brand OR marketing))',
    broad: '"Ghost Energy" OR ("Ghost" AND supplement)',
  },
  'prime-hydration': {
    targeted: '"Prime Hydration" OR ("PRIME" AND (Logan OR KSI OR hydration OR drink OR brand OR marketing))',
    broad: '"Prime Hydration" OR "PRIME drink"',
  },
  'stanley-1913': {
    targeted: '"Stanley" AND (tumbler OR drinkware OR "water bottle" OR cup OR hydration OR brand OR marketing OR campaign)',
    broad: '"Stanley" AND (tumbler OR drinkware OR bottle)',
  },
  'bloom-nutrition': {
    targeted: '"Bloom Nutrition" OR ("Bloom" AND (supplement OR greens OR nutrition OR wellness OR brand OR marketing))',
    broad: '"Bloom Nutrition" OR ("Bloom" AND supplement)',
  },
};

const COMMERCIAL_TERMS = '(marketing OR campaign OR launch OR partnership OR sponsorship OR "Gen Z" OR brand OR product OR revenue OR growth OR college OR creator)';

function buildKeyword(companyId: string, companyName: string, broad: boolean): string {
  const override = BRAND_QUERIES[companyId];
  if (override) return broad ? override.broad : override.targeted;
  // Generic brands: exact name phrase + commercial signal terms
  const name = `"${companyName}"`;
  return broad ? name : `${name} AND ${COMMERCIAL_TERMS}`;
}

function dateFromNow(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function parseArticles(data: Record<string, unknown>): NewsArticle[] {
  const results = (data.articles as Record<string, unknown>)?.results as Record<string, unknown>[] ?? [];
  return results.map((a) => ({
    title: (a.title as string) ?? '',
    description: ((a.body as string) ?? '').slice(0, 200),
    url: (a.url as string) ?? '',
    source: ((a.source as Record<string, string>)?.title) ?? '',
    published_at: (a.dateTime as string) ?? (a.date as string) ?? '',
  }));
}

async function fetchNews(
  companyId: string,
  companyName: string,
  limit: number,
  daysAgo: number,
  broad = false,
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    apiKey: NEWS_KEY,
    keyword: buildKeyword(companyId, companyName, broad),
    lang: 'eng',
    articlesSortBy: 'date',
    articlesCount: String(limit),
    dateStart: dateFromNow(daysAgo),
  });
  const res = await fetch(`${BASE}/api/v1/article/getArticles?${params}`);
  if (!res.ok) throw new Error(`News API ${res.status}`);
  return parseArticles(await res.json());
}

export async function fetchCompanyNews(
  companyId: string,
  companyName: string,
  limit = 4,
): Promise<NewsArticle[]> {
  // Stage 1: targeted commercial query, last 30 days
  const s1 = await fetchNews(companyId, companyName, limit, 30);
  if (s1.length >= 4) return s1;

  // Stage 2: same targeted query, expand to 90 days
  const s2 = await fetchNews(companyId, companyName, limit, 90);
  if (s2.length >= 4) return s2;

  // Stage 3: broad name-only query, 90 days — last resort
  return fetchNews(companyId, companyName, limit, 90, true);
}
