import axios from 'axios';
import Parser from 'rss-parser';
import https from 'https';

const parser = new Parser({ timeout: 10000 });
const http   = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

// ─────────────────────────────────────────────────────────
// 공공데이터포털 인증키 (.env.local에 DATA_GO_KR_API_KEY 로 설정하거나 여기서 직접 선언)
// ─────────────────────────────────────────────────────────
const API_KEY = process.env.DATA_GO_KR_API_KEY
  ?? '8fe320f24b13d8aefff69324297f2487c2854460ab477d43c284a9748117735c';

// ─────────────────────────────────────────────────────────
// 공통 브라우저 위장 헤더 (WAF 우회)
// ─────────────────────────────────────────────────────────
const CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Cache-Control': 'no-cache',
};

// ─────────────────────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────────────────────
export type Almaengi = { target: string; budget: string; deadline: string };
export type FeedItem  = {
  id: string; ministry: string; category: string;
  title: string; link: string; date: string; description: string;
  source: string; isLocal: boolean; almaengi: Almaengi;
};

// ─────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────
export function extractAlmaengi(title: string, content: string): Almaengi {
  const c = `${title} ${content}`;
  const tm = c.match(/(소상공인|소기업|중소기업|청년|창업자|예비창업자|스타트업|장애인|여성기업|경기|화성)/g);
  const target   = tm ? [...new Set(tm)].join(', ') : '해당기업';
  const bm = c.match(/(\d+억원|\d+백만원|\d+만원|\d+억|\d+천만원|최대\s?\d+)/g);
  const budget   = bm ? bm[0] : '상세참조';
  const dm = c.match(/(\d{1,2}\/\d{1,2})|(\d{1,2}\.\d{1,2})|\d{1,2}월\s?\d{1,2}일|상시|마감/g);
  const deadline = dm ? dm[0] : '공고확인';
  return { target, budget, deadline };
}

/** 날짜 문자열 → YYYY-MM-DD, 실패하면 폴백 반환 */
function toDate(raw?: string | null, fallback = '상시'): string {
  if (!raw || raw.trim() === '') return fallback;
  // YYYYMMDD 형식 처리 (API 공통)
  if (/^\d{8}$/.test(raw.trim())) {
    const d = raw.trim();
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
      return d.toISOString().split('T')[0];
    }
  } catch { /* noop */ }
  return fallback;
}

/** 2회 자동 재시도 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try { return await fn(); } catch (e: any) {
    if (retries > 0) { console.warn(`[RETRY] ${retries}회 남음 — ${e.message}`); return withRetry(fn, retries - 1); }
    throw e;
  }
}

// ─────────────────────────────────────────────────────────
// 1. 정책브리핑 (korea.kr) — 보도자료 RSS
// ─────────────────────────────────────────────────────────
export async function scrapeKoreaKr(limit = 100): Promise<FeedItem[]> {
  const URLS = [
    'https://www.korea.kr/rss/pressrelease.xml',
    'https://www.korea.kr/rss/press.xml',
    'https://www.korea.kr/rss/briefing.xml',
  ];

  for (const url of URLS) {
    try {
      console.log(`[정책브리핑] RSS 시도: ${url}`);
      const res  = await axios.get(url, {
        headers: { ...CHROME_HEADERS, Referer: 'https://www.korea.kr/' },
        httpsAgent: http, timeout: 12000,
      });
      const feed = await parser.parseString(res.data);
      if (!feed.items?.length) { console.warn(`[정책브리핑] 빈 피드: ${url}`); continue; }

      console.log(`[정책브리핑] ✅ ${feed.items.length}건 수신 — ${url}`);
      return feed.items.map(item => ({
        id:          `korea-${item.guid ?? item.link}`,
        ministry:    item.title?.match(/\[(.*?)\]/)?.[1] ?? '대한민국 정부',
        category:    '정책브리핑',
        title:       (item.title ?? '').replace(/\[.*?\]\s*/, '').trim(),
        link:        item.link ?? 'https://www.korea.kr',
        date:        toDate(item.pubDate, ''),
        description: (item.contentSnippet ?? '').slice(0, 200),
        source:      '정책브리핑',
        isLocal:     false,
        almaengi:    extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),
      }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (e: any) {
      console.error(`[정책브리핑] ❌ ${url} — ${e.response?.status ?? e.message}`);
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────
// 2. K-Startup — RSS (최신순 정렬)
// ─────────────────────────────────────────────────────────
export async function scrapeKStartup(limit = 100): Promise<FeedItem[]> {
  const url = 'https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do';
  try {
    console.log('[K-Startup] RSS 호출...');
    const res  = await axios.get(url, {
      headers: { ...CHROME_HEADERS, Referer: 'https://www.k-startup.go.kr/' },
      httpsAgent: http, timeout: 12000,
    });
    const feed = await parser.parseString(res.data);
    console.log(`[K-Startup] ✅ ${feed.items.length}건 수신`);
    return feed.items.map(item => ({
      id:          `kstartup-${item.guid ?? item.link}`,
      ministry:    '중기부/창진원',
      category:    'K-Startup',
      title:       item.title ?? '',
      link:        item.link ?? 'https://www.k-startup.go.kr',
      date:        toDate(item.pubDate, ''),
      description: (item.contentSnippet ?? '').slice(0, 200),
      source:      'K-Startup',
      isLocal:     false,
      almaengi:    extractAlmaengi(item.title ?? '', item.contentSnippet ?? ''),
    }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (e: any) {
    console.error(`[K-Startup] ❌ ${e.response?.status ?? e.message}`);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// 3. 보조금24 — 공공데이터포털 OpenAPI
//    행정안전부_대한민국 공공서비스 정보(보조금24)
//    https://api.odcloud.kr/api/gov24/v1/serviceList
//    파라미터: page, perPage, returnType=JSON, serviceKey
// ─────────────────────────────────────────────────────────
export async function scrapeGov24(limit = 100): Promise<FeedItem[]> {
  // api.odcloud.kr — gov24 v1 서비스 목록 (행안부 보조금24)
  // 파라미터: page, perPage, returnType=JSON, serviceKey (이중인코딩 방지: URL 직접삽입)
  const url = `https://api.odcloud.kr/api/gov24/v1/serviceList?page=1&perPage=${limit}&returnType=JSON&serviceKey=${API_KEY}`;
  console.log(`[보조금24] gov24 v1 API 호출... URL: ${url.replace(API_KEY, 'REDACTED')}`);
  try {
    const res = await axios.get(url, {
      headers: { ...CHROME_HEADERS, Accept: 'application/json' },
      httpsAgent: http,
      timeout:    15000,
    });

    // ── 원문 응답 항상 로깅
    const rawStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    console.log('[보조금24] RAW Response (first 600):', rawStr.slice(0, 600));

    // odcloud API 응답 구조: { currentCount, data: [...], matchCount, page, perPage, totalCount }
    const list: any[] = (res.data?.data ?? []) || [];
    if (!list.length) {
      console.warn('[보조금24] ⚠️ 데이터 없음 — totalCount:', res.data?.totalCount, '| keys:', Object.keys(res.data ?? {}));
      return [];
    }
    console.log(`[보조금24] ✅ ${list.length}건 수신 (총 ${res.data?.totalCount}건)`);

    return list.map((item: any) => ({
      id:          `gov24-${item['서비스ID'] ?? item.svcId ?? Math.random()}`,
      ministry:    item['소관기관명'] ?? item.orgNm ?? '정부',
      category:    '보조금24',
      title:       item['서비스명'] ?? item.svcNm ?? '정부 지원 서비스',
      link:        item['신청사이트URL'] ?? item['상세조회URL'] ?? 'https://www.gov.kr/portal/rcvfvrSvc/main',
      date:        toDate(item['수정일시'] ?? item['등록일시'] ?? item['변경일시']),
      description: (item['서비스요약'] ?? item['서비스내용'] ?? '').slice(0, 200),
      source:      '보조금24',
      isLocal:     false,
      almaengi:    extractAlmaengi(
        item['서비스명'] ?? '',
        `${item['지원대상'] ?? ''} ${item['선정기준'] ?? ''} ${item['지원내용'] ?? ''}`,
      ),
    })).slice(0, limit);
  } catch (e: any) {
    console.error('[보조금24] ❌ Public API Raw Error:', e.response?.data || e);
    console.error('[보조금24] ❌ HTTP Status:', e.response?.status, '| Message:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// 4. 중기부/소진공 — 공공데이터포털 OpenAPI
//    중소벤처기업부_사업공고서비스 v2
//    https://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2
// ─────────────────────────────────────────────────────────
async function fetchMSSBiz(limit: number): Promise<any[]> {
  // 중소기업 지원사업 공고 조회 서비스 (사용자가 활용신청·승인받은 실제 API)
  // https://apis.data.go.kr/1421000/pblancBsnsService/getPblancBsnsInfoList
  // ⚠️ params 객체 금지: 이중 인코딩 방지 — URL에 직접 삽입
  const url = `https://apis.data.go.kr/1421000/pblancBsnsService/getPblancBsnsInfoList?serviceKey=${API_KEY}&pageNo=1&numOfRows=${limit}&dataType=JSON`;
  console.log(`[중기부API] pblancBsnsService 호출... URL: ${url.replace(API_KEY, 'REDACTED')}`);
  try {
    const res = await axios.get(url, {
      headers: { ...CHROME_HEADERS, Accept: 'application/json' },
      httpsAgent: http,
      timeout:    15000,
    });

    // ── 원문 응답 항상 로깅
    const rawStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    console.log('[중기부API] RAW Response (first 600):', rawStr.slice(0, 600));

    // XML 에러 응답 감지 (401/NoAuthority 등)
    if (typeof res.data === 'string' && res.data.includes('<OpenAPI_ServiceResponse>')) {
      console.error('[중기부API] ❌ XML 에러 응답 수신! 전문:', res.data.slice(0, 800));
      return [];
    }

    // 파싱 경로 다중 fallback
    const body     = res.data?.response?.body ?? res.data?.body ?? res.data;
    const rawItems = body?.items?.item ?? body?.items ?? body?.item;
    if (!rawItems) {
      console.warn('[중기부API] ⚠️ 응답 구조 이상 (items 없음) — totalCount:', body?.totalCount, '| 전체 body 키:', Object.keys(body ?? {}));
      return [];
    }
    const list: any[] = (Array.isArray(rawItems) ? rawItems : [rawItems]) || [];
    console.log(`[중기부API] ✅ ${list.length}건 수신 (총 ${body?.totalCount}건)`);
    return list;
  } catch (e: any) {
    console.error('[중기부API] ❌ Public API Raw Error:', e.response?.data || e);
    console.error('[중기부API] ❌ HTTP Status:', e.response?.status, '| Message:', e.message);
    return [];
  }
}


/** API raw item → FeedItem 변환 */
function mapMSSItem(item: any, isLocal: boolean): FeedItem {
  const title    = item.pblancNm     ?? item.사업명      ?? item.title ?? '';
  const ministry = item.jrsdInsttNm  ?? item.소관기관명  ?? item.creator ?? '중기부';
  const start    = toDate(item.rceptBgnde ?? item.접수시작일 ?? item.pubDate);
  const end      = toDate(item.rceptEndde ?? item.접수마감일, '상시');
  const desc     = (item.bsnsSumryCn ?? item.사업개요 ?? item.contentSnippet ?? '').slice(0, 200);
  const link     = item.pblancUrl    ?? item.detailUrl   ?? item.link ?? 'https://www.bizinfo.go.kr';
  const budget   = item.suprtLmttAmt ?? item.지원한도액  ?? '';
  const target   = item.trgtRgnNm    ?? item.지원대상    ?? '';

  return {
    id:          `mss-${item.pblancId ?? item.공고ID ?? title}-${start}`,
    ministry,
    category:    isLocal ? '경기/화성비즈' : '중기부/소진공',
    title,
    link,
    date:        start !== '상시' ? start : end,
    description: desc,
    source:      isLocal ? 'egBiz' : '중기부',
    isLocal,
    almaengi: {
      target:   target || extractAlmaengi(title, desc).target,
      budget:   budget || extractAlmaengi(title, desc).budget,
      deadline: end,
    },
  };
}

export async function scrapeMSS(limit = 100): Promise<FeedItem[]> {
  const raw  = await fetchMSSBiz(limit);
  const all  = raw.map(item => mapMSSItem(item, false));
  const result = all
    .filter(i => !isGyeonggi(i))              // 경기/화성은 별도 탭
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
  console.log(`[중기부/소진공] 최종 ${result.length}건 렌더링`);
  return result;
}

// ─────────────────────────────────────────────────────────
// 5. 경기/화성비즈 — 중기부 API에서 경기/화성만 필터링
// ─────────────────────────────────────────────────────────
function isGyeonggi(item: FeedItem | any): boolean {
  const txt = `${item.ministry ?? ''} ${item.title ?? ''} ${item.trgtRgnNm ?? ''} ${item.jrsdInsttNm ?? ''}`;
  return /경기|화성/.test(txt);
}

export async function scrapeGyeonggi(limit = 100): Promise<FeedItem[]> {
  // 중기부 API에서 경기/화성 키워드 포함 공고만 필터
  const raw = await fetchMSSBiz(200); // 더 많이 가져와서 필터
  let result = raw
    .filter(item => isGyeonggi(item))
    .map(item => mapMSSItem(item, true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  // 화성진흥원 API 보충 (결과가 적을 경우)
  if (result.length < 10) {
    try {
      console.log('[화성진흥원] 보충 API 호출...');
      const res  = await axios.post(
        'https://platform.hsbiz.or.kr/api/business/search',
        { page: 1, size: 50, searchText: '', sort: 'latest' },
        { headers: { ...CHROME_HEADERS, Referer: 'https://platform.hsbiz.or.kr/' }, httpsAgent: http, timeout: 10000 },
      );
      const list: any[] = res.data?.content ?? [];
      console.log(`[화성진흥원] ✅ ${list.length}건 수신`);
      list.forEach((item: any) => {
        if (result.length < limit) result.push({
          id:          `hsbiz-${item.id}`,
          ministry:    '화성산업진흥원',
          category:    '경기/화성비즈',
          title:       item.title ?? '',
          link:        `https://platform.hsbiz.or.kr/business/view/${item.id}`,
          date:        toDate(item.endAt ?? item.createdAt),
          description: '화성시 기업지원 공고입니다.',
          source:      '화성진흥원',
          isLocal:     true,
          almaengi:    extractAlmaengi(item.title ?? '', ''),
        });
      });
    } catch (e: any) {
      console.error(`[화성진흥원] ❌ ${e.response?.status ?? e.message}`);
    }
  }

  console.log(`[경기/화성비즈] 최종 ${result.length}건 렌더링`);
  return result;
}
