import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import Parser from 'rss-parser';

const parser = new Parser();

// 정교한 브라우저 위장 헤더
const STABLE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

const axiosInstance = axios.create({
  timeout: 15000,
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
            console.warn(`[RETRY] ${retries} attempts left. Error: ${e.message}`);
            return await withRetry(fn, retries - 1);
        }
        throw e;
    }
}

// 1. 정책브리핑 Scraper (보도자료 전용 RSS)
export async function scrapeKoreaKr(targetCount = 100): Promise<FeedItem[]> {
    try {
        const res = await axiosInstance.get('https://www.korea.kr/rss/briefing.xml', {
            headers: { ...STABLE_HEADERS, 'Referer': 'https://www.korea.kr/' }
        });
        const feed = await parser.parseString(res.data);
        return feed.items.map(item => ({
            id: `korea-brief-${item.guid || item.link}`,
            ministry: item.title?.match(/\[(.*?)\]/)?.[1] || '대한민국 정부',
            category: '정책브리핑',
            title: item.title?.replace(/\[.*?\]\s*/, '') || '',
            link: item.link || 'https://www.korea.kr',
            date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: (item.contentSnippet || '').substring(0, 200),
            source: '정책브리핑',
            isLocal: false,
            almaengi: extractAlmaengi(item.title || '', item.contentSnippet || '')
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, targetCount);
    } catch (e: any) {
        console.error('[SCRAPE ERROR] Korea.kr:', e.message);
        return [];
    }
}

// 2. K-Startup Scraper (RSS)
export async function scrapeKStartup(targetCount = 100): Promise<FeedItem[]> {
    try {
        const res = await axiosInstance.get('https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do', {
            headers: { ...STABLE_HEADERS, 'Referer': 'https://www.k-startup.go.kr/' }
        });
        const feed = await parser.parseString(res.data);
        return feed.items.map(item => ({
            id: `kstartup-${item.guid || item.link}`,
            ministry: '중기부/창진원',
            category: 'K-Startup',
            title: item.title || '',
            link: item.link || 'https://www.k-startup.go.kr',
            date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: (item.contentSnippet || '').substring(0, 200),
            source: 'K-Startup',
            isLocal: false,
            almaengi: extractAlmaengi(item.title || '', item.contentSnippet || '')
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, targetCount);
    } catch (e: any) {
        console.error('[SCRAPE ERROR] K-Startup:', e.message);
        return [];
    }
}

// 3. 정부24 (보조금24) Scraper (내부 POST API 연동)
export async function scrapeGov24(targetCount = 100): Promise<FeedItem[]> {
    try {
        const url = 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAllData';
        const res = await axiosInstance.post(url, {
            "query": "",
            "pageIndex": 1,
            "pageSize": targetCount,
            "orderType": "DATE",
            "orgSel": "ALL"
        }, {
            headers: { 
                ...STABLE_HEADERS, 
                'Content-Type': 'application/json;charset=UTF-8',
                'Referer': 'https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAll'
            }
        });

        // Gov24 응답 구조 파싱 (추정 구조에 기반하되 안정적으로 처리)
        const dataList = res.data?.dataList || res.data?.list || [];
        return dataList.map((item: any) => ({
            id: `gov24-${item.svcId || item.title || Math.random()}`,
            ministry: item.orgNm || item.agencyNm || '정부공통',
            category: '보조금24',
            title: item.svcNm || item.title || '정부 지원 혜택',
            link: `https://www.gov.kr/portal/rcvfvrSvc/svcFind/svcSearchAll`,
            date: item.regDt || new Date().toISOString().split('T')[0],
            description: item.svcCn || item.description || '혜택 상세 내용을 확인하세요.',
            source: '보조금24',
            isLocal: false,
            almaengi: extractAlmaengi(item.svcNm || '', (item.svcCn || '') + (item.trgtNm || ''))
        })).slice(0, targetCount);
    } catch (e: any) {
        console.error('[SCRAPE ERROR] Gov24 API:', e.message);
        return [];
    }
}

// 4. 중기부/소진공 Scraper (RSS + SSR Scrape)
export async function scrapeMSS(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    try {
        // 중기부 RSS
        const resRss = await axiosInstance.get('https://www.mss.go.kr/rss/smba/board/1.do', {
            headers: { ...STABLE_HEADERS, 'Referer': 'https://www.mss.go.kr/' }
        });
        const feed = await parser.parseString(resRss.data);
        feed.items.forEach(item => {
            if (allItems.length < targetCount) {
                allItems.push({
                    id: `mss-rss-${item.guid || item.link}`,
                    ministry: '중소벤처기업부',
                    category: '중기부/소진공',
                    title: item.title || '',
                    link: item.link || 'https://www.mss.go.kr',
                    date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    description: (item.contentSnippet || '').substring(0, 200),
                    source: '중기부',
                    isLocal: false,
                    almaengi: extractAlmaengi(item.title || '', item.contentSnippet || '')
                });
            }
        });

        // 소진공 크롤링 (SSR 방식 복구)
        if (allItems.length < targetCount) {
            const resSemas = await axiosInstance.get('https://www.semas.or.kr/web/board/webBoardList.kmdc?bCd=1', {
                headers: { ...STABLE_HEADERS, 'Referer': 'https://www.semas.or.kr/' }
            });
            const $ = cheerio.load(resSemas.data);
            $('.table_style01 tbody tr').each((_, el) => {
                const title = $(el).find('.txt_left a').text().trim();
                const link = $(el).find('.txt_left a').attr('href');
                const dateRaw = $(el).find('td').eq(4).text().trim();
                if (title && allItems.length < targetCount) {
                    allItems.push({
                        id: `semas-${title}-${dateRaw}`,
                        ministry: '소상공인시장진흥공단',
                        category: '중기부/소진공',
                        title,
                        link: link ? (link.startsWith('http') ? link : `https://www.semas.or.kr${link}`) : 'https://www.semas.or.kr',
                        date: dateRaw.includes('-') ? dateRaw : new Date().toISOString().split('T')[0],
                        description: '소상공인 지원 공고 및 안내문입니다.',
                        source: '소진공',
                        isLocal: false,
                        almaengi: extractAlmaengi(title, '')
                    });
                }
            });
        }
    } catch (e: any) {
        console.error('[SCRAPE ERROR] MSS/SEMAS:', e.message);
    }
    return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, targetCount);
}

// 5. 경기/화성비즈 Scraper (SSR Scrape + API)
export async function scrapeGyeonggi(targetCount = 100): Promise<FeedItem[]> {
    let allItems: FeedItem[] = [];
    try {
        const url = 'https://www.egbiz.or.kr/sp/supportPrjCatList.do';
        const res = await axiosInstance.get(url, {
            headers: { ...STABLE_HEADERS, 'Referer': 'https://www.egbiz.or.kr/' }
        });
        const $ = cheerio.load(res.data);
        $('.table_style01 tbody tr').each((_, el) => {
            const title = $(el).find('.txt_left a').text().trim();
            const dateRaw = $(el).find('td').eq(4).text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            if (title && allItems.length < targetCount) {
                allItems.push({
                    id: `egbiz-${title}-${dateRaw}`,
                    ministry: '경기기업비서',
                    category: '경기/화성비즈',
                    title,
                    link: link ? (link.startsWith('http') ? link : `https://www.egbiz.or.kr${link}`) : 'https://www.egbiz.or.kr',
                    date: dateRaw ? dateRaw.replace(/\./g, '-') : new Date().toISOString().split('T')[0],
                    description: '경기도 중소기업 지원사업 공고입니다.',
                    source: 'egBiz',
                    isLocal: true,
                    almaengi: extractAlmaengi(title, '')
                });
            }
        });

        // 화성진흥원 API (보충)
        if (allItems.length < targetCount) {
            const resHs = await axiosInstance.post('https://platform.hsbiz.or.kr/api/business/search', {
                page: 1, size: 50, searchText: "", sort: "latest"
            }, {
                headers: { ...STABLE_HEADERS, 'Referer': 'https://platform.hsbiz.or.kr/' }
            });
            (resHs.data?.content || []).forEach((item: any) => {
                if (allItems.length < targetCount) {
                    allItems.push({
                        id: `hsbiz-${item.id}`,
                        ministry: '화성산업진흥원',
                        category: '경기/화성비즈',
                        title: item.title,
                        link: `https://platform.hsbiz.or.kr/business/view/${item.id}`,
                        date: item.endAt ? item.endAt.split(' ')[0] : new Date().toISOString().split('T')[0],
                        description: `화성시 중소기업 기업지원 공고입니다.`,
                        source: '화성진흥원',
                        isLocal: true,
                        almaengi: extractAlmaengi(item.title, '')
                    });
                }
            });
        }
    } catch (e: any) {
        console.error('[SCRAPE ERROR] Gyeonggi:', e.message);
    }
    return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, targetCount);
}
