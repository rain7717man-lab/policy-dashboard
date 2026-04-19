import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });

// ─────────────────────────────────────────────────────────
// 진짜 크롬 브라우저를 완벽하게 흉내 낸 헤더
// WAF(봇차단)을 통과하기 위한 핵심
// ─────────────────────────────────────────────────────────
const CHROME_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

const JSON_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json;charset=UTF-8',
};

const http = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

// ─────────────────────────────────────────────────────────
// 공통 타입 정의
// ─────────────────────────────────────────────────────────
export type Almaengi = { target: string; budget: string; deadline: string };

export type FeedItem = {
  id: string;
  ministry: string;
  category: string;
  title: string;
  link: string;
  date: string;
  description: string;
  source: string;
  isLocal: boolean;
  almaengi: Almaengi;
};

// ─────────────────────────────────────────────────────────
// 헬퍼 함수들
// ─────────────────────────────────────────────────────────
export function extractAlmaengi(title: string, content: string): Almaengi {
  const combined = `${title} ${content}`;
  const targetM = combined.match(/(소상공인|소기업|중소기업|청년|창업자|예비창업자|스타트업|장애인|여성기업|경기|화성)/g);
  const target = targetM ? [...new Set(targetM)].join(', ') : '해당기업';
  const budgetM = combined.match(/(\d+억원|\d+백만원|\d+만원|\d+억|\d+천만원|최대\s?\d+)/g);
  const budget = budgetM ? budgetM[0] : '상세참조';
  const deadlineM = combined.match(/(\d{1,2}\/\d{1,2})|(\d{1,2}\.\d{1,2})|\d{1,2}월\s?\d{1,2}일|상시|마감/g);
  const deadline = deadlineM ? deadlineM[0] : '공고확인';
  return { target, budget, deadline };
}

function toDate(raw?: string | Date): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw).replace(/\./g, '-').trim();
    return d.toISOString().split('T')[0];
  } catch { return new Date().toISOString().split('T')[0]; }
}

// 2회 자동 재시도
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try { return await fn(); } catch (e: any) {
    if (retries > 0) {
      console.warn(`[RETRY] ${retries} left — ${e.message}`);
      return withRetry(fn, retries - 1);
    }
    throw e;
  }
}

// ─────────────────────────────────────────────────────────
// 1. 정책브리핑 (korea.kr) — RSS 순수 파싱
//    press.xml → briefing.xml 순으로 시도
// ─────────────────────────────────────────────────────────
export async function scrapeKoreaKr(limit = 100): Promise<FeedItem[]> {
  // press.xml = 보도자료 전용 공식 RSS (1순위)
  const URLS = [
    'https://www.korea.kr/rss/press.xml',
    'https://www.korea.kr/rss/briefing.xml',
    'https://www.korea.kr/rss/policy.xml',
  ];

  for (const url of URLS) {
    try {
      console.log(`[정책브리핑] Trying RSS: ${url}`);
      const res = await axios.get(url, {
        headers: { ...CHROME_HEADERS, Referer: 'https://www.korea.kr/' },
        httpsAgent: http,
        timeout: 12000,
      });
      const feed = await parser.parseString(res.data);
      if (!feed.items?.length) { console.warn(`[정책브리핑] Empty feed: ${url}`); continue; }

      console.log(`[정책브리핑] ✅ OK — ${feed.items.length} items from ${url}`);
      return feed.items.map(item => ({
        id: `korea-${item.guid ?? item.link ?? item.title}`,
        ministry: item.title?.match(/\[(.*?)\]/)?.[1] ?? '대한민국 정부',
        category: '정책브리핑',
        title: (item.title ?? '').replace(/\[.*?\]\s*/, '').trim(),
        link: item.link ?? 'https://www.korea.kr',
        date: toDate(item.pubDate),
        description: (item.contentSnippet ?? '').slice(0, 200),
        source: '정책브리핑',
        isLocal: false,
        almaengi: extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),
      }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (e: any) {
      console.error(`[정책브리핑] ❌ ${url} → ${e.response?.status ?? e.message}`);
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────
// 2. K-Startup — RSS 파싱 + 날짜 내림차순 정렬
// ─────────────────────────────────────────────────────────
export async function scrapeKStartup(limit = 100): Promise<FeedItem[]> {
  const url = 'https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do';
  try {
    console.log('[K-Startup] Fetching RSS…');
    const res = await axios.get(url, {
      headers: { ...CHROME_HEADERS, Referer: 'https://www.k-startup.go.kr/' },
      httpsAgent: http,
      timeout: 12000,
    });
    const feed = await parser.parseString(res.data);
    console.log(`[K-Startup] ✅ ${feed.items.length} items`);
    return feed.items.map(item => ({
      id: `kstartup-${item.guid ?? item.link ?? item.title}`,
      ministry: '중기부/창진원',
      category: 'K-Startup',
      title: item.title ?? '',
      link: item.link ?? 'https://www.k-startup.go.kr',
      date: toDate(item.pubDate),
      description: (item.contentSnippet ?? '').slice(0, 200),
      source: 'K-Startup',
      isLocal: false,
      almaengi: extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),
    }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (e: any) {
    console.error(`[K-Startup] ❌ ${e.response?.status ?? e.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// 3. 보조금24 (정부24) — [공공데이터 API 전환 예정]
//    기존 크롤링/XHR 로직 폐기. 빈 배열 반환.
// ─────────────────────────────────────────────────────────
export async function scrapeGov24(_limit = 100): Promise<FeedItem[]> {
  console.log('[보조금24] ⚠️  공공데이터 API 전환 준비 중 — 임시 비활성화');
  return [];
}

// ─────────────────────────────────────────────────────────
// 4. 중기부/소진공 — [공공데이터 API 전환 예정]
//    기존 RSS/크롤링 로직의 날짜 파싱 오류(1989년 등) 확인.
//    공공데이터포털 API 연동 전까지 임시 비활성화.
// ─────────────────────────────────────────────────────────
export async function scrapeMSS(_limit = 100): Promise<FeedItem[]> {
  console.log('[중기부/소진공] ⚠️  공공데이터 API 전환 준비 중 — 임시 비활성화');
  return [];
}

// ─────────────────────────────────────────────────────────
// 5. 경기/화성비즈 — [공공데이터 API 전환 예정]
//    egBiz CSR 구조로 인해 HTML 크롤링 불가 확인.
//    공공데이터포털 API 연동 전까지 임시 비활성화.
// ─────────────────────────────────────────────────────────
export async function scrapeGyeonggi(_limit = 100): Promise<FeedItem[]> {
  console.log('[경기/화성비즈] ⚠️  공공데이터 API 전환 준비 중 — 임시 비활성화');
  return [];
}

// [사용하지 않는 임시 stub — 공공데이터 API 연동 후 삭제]
export function _scrapeGyeonggiOLD(limit = 100): Promise<FeedItem[]> {
  // 구 로직 보존용 참조 stub
  void limit;
  return Promise.resolve([]);
}

// 아래는 삭제 예정 구 egBiz 로직

