import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

type SubsidyItem = {
  id: string;
  ministry: string;
  category: string;
  title: string;
  link: string;
  date: string;
  description: string;
  source: string;
  isLocal: boolean;
};

const LOCAL_KEYWORDS = ['화성', '경기도', '경기', '수원', '용인', '성남', '안산', '부천', '고양'];

function isLocalItem(title: string, ministry: string): boolean {
  return LOCAL_KEYWORDS.some(
    (kw) => title.includes(kw) || ministry.includes(kw)
  );
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buf);
  } catch {
    return null;
  }
}

// ── K-Startup 창업지원포털 ──────────────────────────────────────────────
async function fetchKStartup(): Promise<SubsidyItem[]> {
  const url = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schBizPbancSn=&page=1';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('ul.biz-pbanc-list li, .notice-list li, table tbody tr').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.k-startup.go.kr${href}`;
    const date = $el.find('.date, td:last-child').first().text().trim() || new Date().toISOString();
    items.push({
      id: `kstartup-${link}`,
      ministry: 'K-Startup',
      category: '창업/스타트업',
      title,
      link,
      date,
      description: '창업진흥원 지원사업 공고입니다. 원문을 확인하세요.',
      source: 'K-Startup',
      isLocal: isLocalItem(title, 'K-Startup'),
    });
  });

  return items.slice(0, 10);
}

// ── 소상공인마당 (SEMAS) ────────────────────────────────────────────────
async function fetchSemas(): Promise<SubsidyItem[]> {
  const url = 'https://www.sbiz.or.kr/sup/biz/bizSuportLst.do';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('table tbody tr, .board-list li, ul.list li').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.sbiz.or.kr${href}`;
    const date = $el.find('td:last-child, .date').first().text().trim() || new Date().toISOString();
    items.push({
      id: `semas-${link}`,
      ministry: '소상공인마당',
      category: '소상공인',
      title,
      link,
      date,
      description: '소상공인시장진흥공단 지원사업 공고입니다. 원문을 확인하세요.',
      source: '소상공인마당',
      isLocal: isLocalItem(title, '소상공인마당'),
    });
  });

  return items.slice(0, 10);
}

// ── 중소벤처기업부 사업공고 RSS ────────────────────────────────────────
async function fetchMssRss(): Promise<SubsidyItem[]> {
  const url = 'https://mss.go.kr/rss/smba/board/85.do';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html, { xmlMode: true });
  const items: SubsidyItem[] = [];

  $('item').each((_, el) => {
    const $el = $(el);
    const title = $el.find('title').text().trim();
    const link = $el.find('link').text().trim() || $el.find('guid').text().trim();
    const date = $el.find('pubDate').text().trim() || new Date().toISOString();
    const description = $el.find('description').text().replace(/<[^>]*>/g, '').trim();
    if (!title) return;
    items.push({
      id: `mss-${link}`,
      ministry: '중소벤처기업부',
      category: '창업/스타트업',
      title,
      link,
      date,
      description: description || '중소벤처기업부 사업공고입니다. 원문을 확인하세요.',
      source: '중소벤처기업부',
      isLocal: false,
    });
  });

  return items.slice(0, 10);
}

// ── 화성산업진흥원 ──────────────────────────────────────────────────────
async function fetchHsia(): Promise<SubsidyItem[]> {
  const url = 'https://www.hsia.or.kr/board/list.do?boardId=NOTICE';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('table tbody tr, .board-list li, ul.list li').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.hsia.or.kr${href}`;
    const date = $el.find('td:last-child, .date').first().text().trim() || new Date().toISOString();
    items.push({
      id: `hsia-${link}-${title}`,
      ministry: '화성산업진흥원',
      category: '지역지원',
      title,
      link,
      date,
      description: '화성시 기업 지원사업 공고입니다. 원문을 확인하세요.',
      source: '화성산업진흥원',
      isLocal: true,
    });
  });

  return items.slice(0, 10);
}

// ── 경기업비저 (egBiz) ──────────────────────────────────────────────────
async function fetchEgBiz(): Promise<SubsidyItem[]> {
  const url = 'https://www.egbiz.or.kr/bsns/notice/noticeList.do';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('table tbody tr, .board-list li').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.egbiz.or.kr${href}`;
    const date = $el.find('td:last-child, .date').first().text().trim() || new Date().toISOString();
    items.push({
      id: `egbiz-${link}-${title}`,
      ministry: '경기업비저',
      category: '지역지원',
      title,
      link,
      date,
      description: '경기도 기업 지원사업 공고입니다. 원문을 확인하세요.',
      source: '경기업비저',
      isLocal: true,
    });
  });

  return items.slice(0, 10);
}

// ── 보조금24 (정부24) ───────────────────────────────────────────────────
async function fetchBojogeum(): Promise<SubsidyItem[]> {
  const url = 'https://www.gov.kr/portal/rcvfvrSvc/listRcvfvrSvc?aprvYn=Y&pageIndex=1';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('ul.service-list li, .list-group li, table tbody tr').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.gov.kr${href}`;
    items.push({
      id: `bojogeum-${link}-${title}`,
      ministry: '보조금24',
      category: '생활/복지',
      title,
      link,
      date: new Date().toISOString(),
      description: '정부24 보조금 지원서비스입니다. 원문을 확인하세요.',
      source: '보조금24',
      isLocal: isLocalItem(title, '보조금24'),
    });
  });

  return items.slice(0, 10);
}

// ── 복지로 ─────────────────────────────────────────────────────────────
async function fetchBokjiro(): Promise<SubsidyItem[]> {
  const url = 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('ul.service-list li, .welfare-list li, table tbody tr').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a, .subject').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.bokjiro.go.kr${href}`;
    items.push({
      id: `bokjiro-${link}-${title}`,
      ministry: '복지로',
      category: '생활/복지',
      title,
      link,
      date: new Date().toISOString(),
      description: '복지로 복지서비스 정보입니다. 원문을 확인하세요.',
      source: '복지로',
      isLocal: isLocalItem(title, '복지로'),
    });
  });

  return items.slice(0, 10);
}

// ── 온통청년 ───────────────────────────────────────────────────────────
async function fetchYouthcenter(): Promise<SubsidyItem[]> {
  const url = 'https://www.youthcenter.go.kr/youngPlcyInfoSrchKr.do';
  const html = await fetchHtml(url);
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: SubsidyItem[] = [];

  $('ul.result-list li, .policy-list li, table tbody tr').each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find('a, .title').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href') || '';
    if (!title) return;
    const link = href.startsWith('http') ? href : `https://www.youthcenter.go.kr${href}`;
    items.push({
      id: `youth-${link}-${title}`,
      ministry: '온통청년',
      category: '생활/복지',
      title,
      link,
      date: new Date().toISOString(),
      description: '온통청년 청년정책 정보입니다. 원문을 확인하세요.',
      source: '온통청년',
      isLocal: isLocalItem(title, '온통청년'),
    });
  });

  return items.slice(0, 10);
}

// ── 메인 핸들러 ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const results = await Promise.allSettled([
      fetchKStartup(),
      fetchSemas(),
      fetchMssRss(),
      fetchHsia(),
      fetchEgBiz(),
      fetchBojogeum(),
      fetchBokjiro(),
      fetchYouthcenter(),
    ]);

    const allItems: SubsidyItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // 날짜 역순 정렬, 날짜 파싱 실패 시 최신으로 처리
    allItems.sort((a, b) => {
      const ta = new Date(a.date).getTime() || Date.now();
      const tb = new Date(b.date).getTime() || Date.now();
      return tb - ta;
    });

    return NextResponse.json({ success: true, count: allItems.length, data: allItems });
  } catch (error) {
    console.error('Subsidy API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subsidy data' }, { status: 500 });
  }
}
