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
// 3. 보조금24 (정부24) — 내부 JSON API (XHR target)
//    사이트가 CSR이어서 HTML 스크래핑이 빈 껍데기만 반환.
//    브라우저 Network 탭에서 확인된 내부 엔드포인트에 직접 요청.
// ─────────────────────────────────────────────────────────
export async function scrapeGov24(limit = 100): Promise<FeedItem[]> {
  // gov.kr이 사용하는 내부 XHR 엔드포인트들 (우선순위 순)
  const endpoints = [
    {
      url: 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAllData',
      body: { query: '', pageIndex: 1, pageSize: limit, orderType: 'DATE', orgSel: 'ALL' },
    },
    {
      url: 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAll.json',
      body: { pageIndex: 1, pageUnit: limit, orderType: 'date', searchText: '' },
    },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`[보조금24] Trying endpoint: ${ep.url}`);
      const res = await axios.post(ep.url, ep.body, {
        headers: {
          ...JSON_HEADERS,
          Referer: 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAll',
          Origin: 'https://www.gov.kr',
        },
        httpsAgent: http,
        timeout: 12000,
      });

      const raw = res.data;
      const list: any[] = raw?.dataList ?? raw?.list ?? raw?.result ?? raw?.items ?? [];
      if (!list.length) { console.warn(`[보조금24] Empty list from ${ep.url}. Raw:`, JSON.stringify(raw).slice(0, 200)); continue; }

      console.log(`[보조금24] ✅ ${list.length} items`);
      return list.map((item: any) => ({
        id: `gov24-${item.svcId ?? item.id ?? item.title ?? Math.random()}`,
        ministry: item.orgNm ?? item.agencyNm ?? item.tgtrDscr ?? '정부',
        category: '보조금24',
        title: item.svcNm ?? item.title ?? item.svcName ?? '정부 지원 혜택',
        link: item.svcUrl ?? 'https://www.gov.kr/portal/rcvfvrSvc/main',
        date: toDate(item.modDt ?? item.regDt),
        description: (item.svcSumry ?? item.svcCn ?? item.description ?? '').slice(0, 200),
        source: '보조금24',
        isLocal: false,
        almaengi: extractAlmaengi(
          item.svcNm ?? item.title ?? '',
          (item.svcCn ?? '') + (item.trgtNm ?? '') + (item.tgtrDscr ?? ''),
        ),
      })).slice(0, limit);
    } catch (e: any) {
      console.error(`[보조금24] ❌ ${ep.url} → ${e.response?.status ?? e.message}`);
    }
  }
  // RSS 폴백: 중기부 공고가 보조금24 내용 포함
  return [];
}

// ─────────────────────────────────────────────────────────
// 4. 중기부/소진공 — 중기부 RSS + 소진공 게시판 직접 크롤
// ─────────────────────────────────────────────────────────
export async function scrapeMSS(limit = 100): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  // ① 중기부 RSS (가장 안정적)
  const rssUrls = [
    'https://www.mss.go.kr/rss/smba/board/1.do',
    'https://www.mss.go.kr/rss/smba/board/5.do', // 공고 게시판
  ];
  for (const url of rssUrls) {
    try {
      console.log(`[중기부] Trying RSS: ${url}`);
      const res = await axios.get(url, { headers: { ...CHROME_HEADERS, Referer: 'https://www.mss.go.kr/' }, httpsAgent: http, timeout: 12000 });
      const feed = await parser.parseString(res.data);
      console.log(`[중기부] ✅ ${feed.items.length} items from ${url}`);
      feed.items.forEach(item => {
        if (items.length < limit) items.push({
          id: `mss-${item.guid ?? item.link ?? item.title}`,
          ministry: '중소벤처기업부',
          category: '중기부/소진공',
          title: item.title ?? '',
          link: item.link ?? 'https://www.mss.go.kr',
          date: toDate(item.pubDate),
          description: (item.contentSnippet ?? '').slice(0, 200),
          source: '중기부',
          isLocal: false,
          almaengi: extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),
        });
      });
    } catch (e: any) {
      console.error(`[중기부] ❌ ${url} → ${e.response?.status ?? e.message}`);
    }
    if (items.length >= limit) break;
  }

  // ② 소진공 (SEMAS) 게시판 SSR 크롤
  if (items.length < limit) {
    try {
      console.log('[소진공] Scraping board…');
      const res = await axios.get('https://www.semas.or.kr/web/board/webBoardList.kmdc?bCd=1', {
        headers: { ...CHROME_HEADERS, Referer: 'https://www.semas.or.kr/' },
        httpsAgent: http,
        timeout: 12000,
      });
      const $ = cheerio.load(res.data);
      const rows = $('table tbody tr');
      console.log(`[소진공] HTML rows found: ${rows.length}`);
      rows.each((_, el) => {
        if (items.length >= limit) return;
        const title = $(el).find('a').first().text().trim();
        const href = $(el).find('a').first().attr('href');
        const dateEl = $(el).find('td').last().text().trim();
        if (!title) return;
        items.push({
          id: `semas-${title}-${dateEl}`,
          ministry: '소상공인시장진흥공단',
          category: '중기부/소진공',
          title,
          link: href ? (href.startsWith('http') ? href : `https://www.semas.or.kr${href}`) : 'https://www.semas.or.kr',
          date: toDate(dateEl),
          description: '소상공인 지원 공고 및 안내문입니다.',
          source: '소진공',
          isLocal: false,
          almaengi: extractAlmaengi(title, ''),
        });
      });
      console.log(`[소진공] ✅ ${items.filter(i => i.source === '소진공').length} items`);
    } catch (e: any) {
      console.error(`[소진공] ❌ ${e.response?.status ?? e.message}`);
    }
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

// ─────────────────────────────────────────────────────────
// 5. 경기/화성비즈 — egBiz 내부 API + 화성진흥원 API
//    egBiz는 CSR이므로 내부 JSON API를 직접 호출
// ─────────────────────────────────────────────────────────
export async function scrapeGyeonggi(limit = 100): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  // ① egBiz 내부 API (검색 기반)
  const egBizEndpoints = [
    'https://www.egbiz.or.kr/api/v1/support/list',
    'https://www.egbiz.or.kr/sp/supportPrjCatListJson.do',
    'https://www.egbiz.or.kr/prjCategory/prjCategoryListJson.do',
  ];

  let egBizSuccess = false;
  for (const url of egBizEndpoints) {
    try {
      console.log(`[egBiz] Trying API: ${url}`);
      const res = await axios.post(url, { p_category_id: 'G01', pageIndex: 1, pageSize: 50 }, {
        headers: { ...JSON_HEADERS, Referer: 'https://www.egbiz.or.kr/sp/supportPrjCatList.do', Origin: 'https://www.egbiz.or.kr' },
        httpsAgent: http,
        timeout: 10000,
      });
      const list: any[] = res.data?.list ?? res.data?.items ?? res.data?.content ?? [];
      if (!list.length) { console.warn(`[egBiz] Empty from ${url}`); continue; }
      console.log(`[egBiz] ✅ ${list.length} items`);
      list.forEach((item: any) => {
        if (items.length < limit) items.push({
          id: `egbiz-${item.bizCyclId ?? item.id ?? item.title}`,
          ministry: '경기기업비서',
          category: '경기/화성비즈',
          title: item.title ?? item.bizNm ?? '',
          link: `https://www.egbiz.or.kr/sp/supportPrjDtl.do?bizCyclId=${item.bizCyclId ?? item.id}`,
          date: toDate(item.endDt ?? item.regDt),
          description: item.summary ?? item.description ?? '경기도 기업지원 공고',
          source: 'egBiz',
          isLocal: true,
          almaengi: extractAlmaengi(item.title ?? '', item.summary ?? ''),
        });
      });
      egBizSuccess = true;
      break;
    } catch (e: any) {
      console.error(`[egBiz] ❌ ${url} → ${e.response?.status ?? e.message}`);
    }
  }

  // egBiz SSR 폴백
  if (!egBizSuccess) {
    try {
      console.log('[egBiz] SSR fallback…');
      const res = await axios.get('https://www.egbiz.or.kr/sp/supportPrjCatList.do', {
        headers: { ...CHROME_HEADERS, Referer: 'https://www.egbiz.or.kr/' },
        httpsAgent: http,
        timeout: 12000,
      });
      const $ = cheerio.load(res.data);
      const rows = $('table tbody tr');
      console.log(`[egBiz] SSR rows: ${rows.length}`);
      rows.each((_, el) => {
        if (items.length >= limit) return;
        const title = $(el).find('a').first().text().trim();
        const href = $(el).find('a').first().attr('href');
        const dateEl = $(el).find('td').last().text().trim();
        if (!title) return;
        items.push({
          id: `egbiz-ssr-${title}`,
          ministry: '경기기업비서',
          category: '경기/화성비즈',
          title,
          link: href ? (href.startsWith('http') ? href : `https://www.egbiz.or.kr${href}`) : 'https://www.egbiz.or.kr',
          date: toDate(dateEl),
          description: '경기도 중소기업 지원사업 공고입니다.',
          source: 'egBiz',
          isLocal: true,
          almaengi: extractAlmaengi(title, ''),
        });
      });
    } catch (e: any) {
      console.error(`[egBiz] SSR ❌ ${e.response?.status ?? e.message}`);
    }
  }

  // ② 화성진흥원 API
  if (items.length < limit) {
    try {
      console.log('[화성진흥원] Fetching API…');
      const res = await axios.post('https://platform.hsbiz.or.kr/api/business/search',
        { page: 1, size: 50, searchText: '', sort: 'latest' },
        { headers: { ...JSON_HEADERS, Referer: 'https://platform.hsbiz.or.kr/', Origin: 'https://platform.hsbiz.or.kr' }, httpsAgent: http, timeout: 10000 },
      );
      const list: any[] = res.data?.content ?? [];
      console.log(`[화성진흥원] ✅ ${list.length} items`);
      list.forEach((item: any) => {
        if (items.length < limit) items.push({
          id: `hsbiz-${item.id}`,
          ministry: '화성산업진흥원',
          category: '경기/화성비즈',
          title: item.title ?? '',
          link: `https://platform.hsbiz.or.kr/business/view/${item.id}`,
          date: toDate(item.endAt ?? item.createdAt),
          description: '화성시 기업지원 공고입니다.',
          source: '화성진흥원',
          isLocal: true,
          almaengi: extractAlmaengi(item.title ?? '', ''),
        });
      });
    } catch (e: any) {
      console.error(`[화성진흥원] ❌ ${e.response?.status ?? e.message}`);
    }
  }

  console.log(`[경기/화성비즈] Total collected: ${items.length}`);
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}
