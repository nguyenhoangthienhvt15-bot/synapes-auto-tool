import { z } from 'zod';

/**
 * Schema ràng buộc nguồn gốc dữ liệu Internet (Strict Data Provenance - chống tráo nhãn)
 */
export const VerifiedNewsItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.string().optional(),
  provenance: z.literal('google_news_rss'),
});

export const VerifiedMediaItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  url: z.string(),
  proxyUrl: z.string().optional(),
  source: z.string(),
  provenance: z.enum(['wikimedia_commons', 'wikipedia', 'nasa_media']),
});

export const TopicResearchResultSchema = z.object({
  query: z.string(),
  domain: z.string(),
  news: z.array(VerifiedNewsItemSchema),
  headlines: z.array(VerifiedNewsItemSchema),
  visuals: z.array(VerifiedMediaItemSchema),
  videos: z.array(VerifiedMediaItemSchema),
  wikiSummary: z.string(),
  fetchedAt: z.string(),
});

export type TopicResearchResult = z.infer<typeof TopicResearchResultSchema>;

function stripHtmlTags(raw: string): string {
  return String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAsciiForMatch(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

const DISAMBIGUATION_BLOCK_TERMS = new Set([
  'wwe', 'wrestler', 'wrestling', 'adam joseph copeland', 'copeland', 'smackdown', 'raw',
  'pac-3', 'patriot', 'ten lua', 'missile', 'fighter jet', 'nfl', 'nba', 'mlb',
]);

function extractCoreTokensAndBigrams(query: string): {
  coreTokens: string[];
  bigrams: string[];
  queryHasBlockedTerm: boolean;
} {
  const stop = new Set([
    've', 'cua', 'cho', 'voi', 'cac', 'nhung', 'la', 'va', 'hom', 'nay', 'ngay',
    'thang', 'nam', 'moi', 'nhat', 'trong', 'tai', 'video', 'clip', 'tin', 'tuc',
  ]);
  const norm = normalizeAsciiForMatch(query);
  const allTokens = norm.split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !stop.has(t));
  const coreTokens = allTokens.filter((t) => t.length >= 2);
  const bigrams: string[] = [];
  for (let i = 0; i < coreTokens.length - 1; i++) {
    bigrams.push(`${coreTokens[i]} ${coreTokens[i + 1]}`);
  }
  const queryHasBlockedTerm = Array.from(DISAMBIGUATION_BLOCK_TERMS).some((term) => norm.includes(term));
  return { coreTokens, bigrams, queryHasBlockedTerm };
}

function isEntityMatchStrict(
  haystackRaw: string,
  coreTokens: string[],
  bigrams: string[],
  queryHasBlockedTerm: boolean
): boolean {
  const hay = normalizeAsciiForMatch(haystackRaw);
  if (!hay) return false;
  if (!queryHasBlockedTerm) {
    for (const bad of DISAMBIGUATION_BLOCK_TERMS) {
      if (hay.includes(bad)) return false;
    }
  }
  if (bigrams.some((bg) => hay.includes(bg))) {
    return true;
  }
  if (coreTokens.length === 0) return true;
  const matchedCount = coreTokens.filter((tok) => {
    if (tok.length <= 2) {
      return new RegExp(`(?:^|[^a-z0-9])${tok}(?:$|[^a-z0-9])`).test(hay);
    }
    return hay.includes(tok);
  }).length;
  const minRequired = coreTokens.length >= 2 ? 2 : 1;
  return matchedCount >= minRequired;
}

function extractTag(xmlBlock: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xmlBlock.match(re);
  return m ? stripHtmlTags(m[1]) : '';
}

/**
 * Thu thập dữ liệu Internet chân thực (Fail-Fast & Strict Provenance):
 * - Từ chối ngay nếu đầu vào rỗng hoặc toàn khoảng trắng.
 * - Ném lỗi thật nếu API trả về HTTP >= 400 (như HTTP 500), cấm nuốt lỗi trả mẫu.
 * - Không trộn ảnh Unsplash hay dữ liệu fallback khi chuỗi tìm kiếm không có kết quả.
 */
export async function researchTopic(query: string): Promise<TopicResearchResult> {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) {
    throw new Error('Từ khóa tìm kiếm chủ đề không được để trống (Fail-Fast).');
  }

  const { coreTokens, bigrams, queryHasBlockedTerm } = extractCoreTokensAndBigrams(cleanQuery);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    // 1. Gọi Google News RSS thật
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=vi&gl=VN&ceid=VN:vi`;
    const rssRes = await fetch(rssUrl, { signal: controller.signal });
    if (!rssRes.ok) {
      throw new Error(`Tìm kiếm tin tức Internet that bai (HTTP ${rssRes.status} ${rssRes.statusText})`);
    }
    const rssXml = await rssRes.text();
    const itemMatches = rssXml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    const news: Array<z.infer<typeof VerifiedNewsItemSchema>> = [];
    for (const block of itemMatches.slice(0, 14)) {
      const title = extractTag(block, 'title');
      const url = extractTag(block, 'link');
      const source = extractTag(block, 'source') || 'Google News';
      const publishedAt = extractTag(block, 'pubDate');
      const relevant = isEntityMatchStrict(`${title} ${url}`, coreTokens, bigrams, queryHasBlockedTerm);
      if (title && url && relevant) {
        news.push({
          title,
          url,
          source,
          publishedAt,
          provenance: 'google_news_rss',
        });
      }
    }

    // 2. Gọi Wikipedia tiếng Việt thật (lọc nghiêm ngặt theo bigram + đa từ khóa, chống nhầm thực thể)
    const wikiUrl = `https://vi.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrlimit=4&prop=extracts|pageimages&exintro=1&explaintext=1&exchars=500&piprop=original|thumbnail&pithumbsize=1280&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl, { signal: controller.signal });
    if (!wikiRes.ok) {
      throw new Error(`Truy vấn Wikipedia that bai (HTTP ${wikiRes.status} ${wikiRes.statusText})`);
    }
    const wikiJson = (await wikiRes.json()) as any;
    const wikiPages = Object.values(wikiJson?.query?.pages || {}) as any[];
    const wikiParts: string[] = [];
    const visuals: Array<z.infer<typeof VerifiedMediaItemSchema>> = [];

    for (const p of wikiPages) {
      const matchesEntity = isEntityMatchStrict(
        `${p?.title || ''} ${p?.extract || ''}`,
        coreTokens,
        bigrams,
        queryHasBlockedTerm
      );
      if (!matchesEntity) continue;
      if (p?.extract && String(p.extract).trim().length > 20) {
        wikiParts.push(`${p.title}: ${String(p.extract).replace(/\s+/g, ' ').trim()}`);
      }
      const imgUrl = p?.thumbnail?.source || p?.original?.source;
      if (
        imgUrl &&
        !/\.(svg|tif|djvu|pdf)$/i.test(imgUrl) &&
        !/unsplash\.com/i.test(imgUrl)
      ) {
        visuals.push({
          id: `wiki-${p.pageid}`,
          title: String(p.title || cleanQuery),
          url: imgUrl,
          proxyUrl: `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`,
          source: 'Wikipedia (VI)',
          provenance: 'wikipedia',
        });
      }
    }

    // 3. Gọi Wikimedia Commons thật (tìm ảnh bitmap sạch, tuyệt đối không nhồi Unsplash)
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      `${cleanQuery} filetype:bitmap`
    )}&gsrlimit=8&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280&format=json&origin=*`;
    const commonsRes = await fetch(commonsUrl, { signal: controller.signal });
    if (!commonsRes.ok) {
      throw new Error(`Truy vấn Wikimedia Commons that bai (HTTP ${commonsRes.status} ${commonsRes.statusText})`);
    }
    const commonsJson = (await commonsRes.json()) as any;
    const commonsPages = Object.values(commonsJson?.query?.pages || {}) as any[];
    for (const cp of commonsPages) {
      const cpTitle = String(cp.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
      if (!queryHasBlockedTerm) {
        const cpNorm = normalizeAsciiForMatch(cpTitle);
        if (Array.from(DISAMBIGUATION_BLOCK_TERMS).some((bad) => cpNorm.includes(bad))) continue;
      }
      const info = cp?.imageinfo?.[0];
      const u = info?.thumburl || info?.url;
      if (
        u &&
        info?.mime?.startsWith('image/') &&
        !/svg|tiff/i.test(info.mime) &&
        !/unsplash\.com/i.test(u)
      ) {
        visuals.push({
          id: `commons-${cp.pageid}`,
          title: cpTitle,
          url: u,
          proxyUrl: `/api/image-proxy?url=${encodeURIComponent(u)}`,
          source: 'Wikimedia Commons',
          provenance: 'wikimedia_commons',
        });
      }
    }

    const result: TopicResearchResult = {
      query: cleanQuery,
      domain: 'auto',
      news,
      headlines: news,
      visuals: visuals.slice(0, 18),
      videos: [],
      wikiSummary: wikiParts.join(' | ').slice(0, 1200),
      fetchedAt: new Date().toISOString(),
    };

    return TopicResearchResultSchema.parse(result);
  } finally {
    clearTimeout(timeout);
  }
}
