import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

const STABLE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

const axiosInstance = axios.create({
  timeout: 10000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  headers: STABLE_HEADERS
});

export type Almaengi = {
  target: string;
  budget: string;
  deadline: string;
};

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

// 알맹이 추출 유틸리티
export function extractAlmaengi(title: string, content: string): Almaengi {
    const combined = `${title} ${content}`;
    const targetMatch = combined.match(/(소상공인|소기업|중소기업|청년|창업자|예비창업자|스타트업|장애인|여성기업|경기|화성)/g);
    const target = targetMatch ? Array.from(new Set(targetMatch)).join(', ') : '해당기업';
    const budgetMatch = combined.match(/(\d+억원|\d+백만원|\d+만원|\d+억|\d+천만원|최대\s?\d+)/g);
    const budget = budgetMatch ? budgetMatch[0] : '상세참조';
    const deadlineMatch = combined.match(/(\d{1,2}\/\d{1,2})|(\d{1,2}\.\d{1,2})|\d{1,2}월\s?\d{1,2}일|상시|마감/g);
    const deadline = deadlineMatch ? deadlineMatch[0] : '공고확인';
    return { target, budget, deadline };
}

// 자동 재시도 랩퍼 (2회)
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        if (retries > 0) {
            console.log(`Retry left: ${retries}. Error: ${e.message || e}`);
            return await withRetry(fn, retries - 1);
        }
        throw e;
    }
}

// 1. 정책브리핑 Scraper
export async function scrapeKoreaKr(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    let page = 1;

    while (allItems.length < targetCount && page <= 5) {
        const url = `https://www.korea.kr/briefing/pressReleaseList.do?pageIndex=${page}`;
        const res = await axiosInstance.get(url);
        const $ = cheerio.load(res.data);
        const items = $('ul.list-type1 > li');
        if (items.length === 0) break;

        items.each((_, el) => {
            const linkEl = $(el).find('a');
            const title = linkEl.find('strong').text().trim();
            const link = linkEl.attr('href');
            const infoSpans = linkEl.find('.date span, .date-info span');
            const date = infoSpans.eq(0).text().trim();
            const ministry = infoSpans.eq(1).text().trim() || '대한민국 정부';

            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `korea-${link || title}`,
                    ministry,
                    category: '정책브리핑',
                    title,
                    link: link ? (link.startsWith('http') ? link : `https://www.korea.kr${link}`) : 'https://www.korea.kr',
                    date,
                    description: `${ministry} 공식 보도자료입니다.`,
                    source: '정책브리핑',
                    isLocal: title.includes('화성') || title.includes('경기'),
                    almaengi: extractAlmaengi(title, ministry)
                });
            }
        });
        page++;
    }
    return allItems;
}

// 2. K-Startup Scraper (RSS + Pagination Mock if needed)
export async function scrapeKStartup(targetCount = 100): Promise<FeedItem[]> {
    // RSS는 보통 50건이 한계이므로 100건을 채우기 위해 부족한 부분은 Mock 생성 
    // 혹은 다른 페이지 스크래핑이 필요하나 RSS가 가장 안정적이므로 50건 수집 후 Mock 폴백
    let allItems: FeedItem[] = [];
    try {
        const res = await axiosInstance.get('https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do');
        const $ = cheerio.load(res.data, { xmlMode: true });
        $('item').each((_, el) => {
            const title = $(el).find('title').text();
            const link = $(el).find('link').text();
            const date = $(el).find('pubDate').text();
            const desc = $(el).find('description').text().replace(/<[^>]*>?/gm, '');

            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `kstartup-${link || title}`,
                    ministry: '중기부/창진원',
                    category: 'K-Startup',
                    title,
                    link,
                    date: new Date(date).toLocaleDateString(),
                    description: desc.substring(0, 150),
                    source: 'K-Startup',
                    isLocal: false,
                    almaengi: extractAlmaengi(title, desc)
                });
            }
        });
    } catch (e) {}

    // 100건 채우기 정책
    while (allItems.length < targetCount) {
        const i = allItems.length;
        allItems.push({
            id: `mock-kstartup-${i}`,
            ministry: '창업진흥원',
            category: 'K-Startup',
            title: `[MOCK] 창업지원 및 혁신성장 지원사업 공고 ${i + 1}`,
            link: 'https://www.k-startup.go.kr',
            date: new Date().toLocaleDateString(),
            description: '데이터 구조 증명을 위한 대용량 Mock 데이터입니다.',
            source: 'K-Startup',
            isLocal: false,
            almaengi: { target: '청년/예비창업자', budget: '최대 1억원', deadline: '2026.05.30' }
        });
    }
    return allItems;
}

// 3. 정부24 (보조금24) Scraper + Mock
export async function scrapeGov24(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    try {
        const url = 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAll?sort=DATE&sortOrder=DESC';
        const res = await axiosInstance.get(url);
        const $ = cheerio.load(res.data);
        // 실제 보조금24는 복잡한 스크립트로 동작할 수 있어 실패 가능성 높음
        $('.card-item').each((_, el) => {
            const title = $(el).find('.card-title').text().trim();
            const desc = $(el).find('.card-text').text().trim();
            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `gov24-${title}`,
                    ministry: '정부24',
                    category: '보조금24',
                    title,
                    link: 'https://www.gov.kr/portal/rcvfvrSvc/main',
                    date: new Date().toLocaleDateString(),
                    description: desc.substring(0, 150),
                    source: '보조금24',
                    isLocal: false,
                    almaengi: extractAlmaengi(title, desc)
                });
            }
        });
    } catch (e) {}

    // 구조 증명을 위한 100건 Mock 채우기
    while (allItems.length < targetCount) {
        const i = allItems.length;
        allItems.push({
            id: `mock-gov24-${i}`,
            ministry: '대한민국 정부',
            category: '보조금24',
            title: `[MOCK] 정부 지원 보조금/혜택 안내 ${i + 1}`,
            link: 'https://www.gov.kr/portal/rcvfvrSvc/main',
            date: new Date().toLocaleDateString(),
            description: '모든 국민이 받을 수 있는 정부 지원 보조금 혜택 목록입니다.',
            source: '보조금24',
            isLocal: false,
            almaengi: { target: '전 국민 대상', budget: '상세 확인', deadline: '상시 신청' }
        });
    }
    return allItems;
}

// 4. 중기부/소진공 Scraper
export async function scrapeMSS(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    let page = 1;
    while (allItems.length < targetCount && page <= 5) {
        const url = `https://www.mss.go.kr/site/smba/ex/board/List.do?cbIdx=86&pageIndex=${page}`;
        const res = await axiosInstance.get(url);
        const $ = cheerio.load(res.data);
        $('.table_style01 tbody tr').each((_, el) => {
            const title = $(el).find('.txt_left a').text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            const date = $(el).find('td').eq(4).text().trim();
            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `mss-${title}-${page}`,
                    ministry: '중소벤처기업부',
                    category: '중기부/소진공',
                    title,
                    link: link ? (link.startsWith('http') ? link : `https://www.mss.go.kr${link}`) : 'https://www.mss.go.kr',
                    date,
                    description: '중소벤처기업부 공식 보도자료 및 공고입니다.',
                    source: '중기부',
                    isLocal: false,
                    almaengi: extractAlmaengi(title, '')
                });
            }
        });
        page++;
    }
    // 부족분 Mock
    while (allItems.length < targetCount) {
        const i = allItems.length;
        allItems.push({
            id: `mock-semas-${i}`,
            ministry: '소진공',
            category: '중기부/소진공',
            title: `[MOCK] 소상공인시장진흥공단 정책자금 지원 공고 ${i + 1}`,
            link: 'https://www.semas.or.kr',
            date: new Date().toLocaleDateString(),
            description: '소상공인을 위한 정책자금 및 성장 지원 사업입니다.',
            source: '소진공',
            isLocal: false,
            almaengi: { target: '소상공인/자영업자', budget: '최대 7천만원', deadline: '상시' }
        });
    }
    return allItems;
}

// 5. 경기/화성비즈 Scraper
export async function scrapeGyeonggi(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    try {
        const url = 'https://www.egbiz.or.kr/prjCategory/prjCategoryList.do?p_category_id=G01';
        const res = await axiosInstance.get(url);
        const $ = cheerio.load(res.data);
        $('.table_style01 tbody tr').each((_, el) => {
            const title = $(el).find('.txt_left a').text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            const date = $(el).find('td').eq(4).text().trim();
            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `egbiz-${title}`,
                    ministry: '경기기업비서',
                    category: '경기/화성비즈',
                    title,
                    link: link ? (link.startsWith('http') ? link : `https://www.egbiz.or.kr${link}`) : 'https://www.egbiz.or.kr',
                    date,
                    description: '경기도 지원사업 공고입니다.',
                    source: 'egBiz',
                    isLocal: true,
                    almaengi: extractAlmaengi(title, '')
                });
            }
        });
    } catch (e) {}

    // 부족분 Mock
    while (allItems.length < targetCount) {
        const i = allItems.length;
        allItems.push({
            id: `mock-hsbiz-${i}`,
            ministry: '화성산업진흥원',
            category: '경기/화성비즈',
            title: `[MOCK] 화성시 관내 중소기업 기술지원 사업 공고 ${i + 1}`,
            link: 'https://platform.hsbiz.or.kr',
            date: new Date().toLocaleDateString(),
            description: '화성시 기업을 위한 맞춤형 산업 육성 지원 사업입니다.',
            source: '화성진흥원',
            isLocal: true,
            almaengi: { target: '화성시 소재 기업', budget: '최대 2천만원', deadline: '2026.06.30' }
        });
    }
    return allItems;
}
