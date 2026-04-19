import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const parser = new Parser();

const STABLE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

const axiosInstance = axios.create({
  timeout: 10000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  headers: STABLE_HEADERS
});

// 알맹이 추출 로직
function extractAlmaengi(title: string, content: string) {
    const combined = `${title} ${content}`;
    const targetMatch = combined.match(/(소상공인|소기업|중소기업|청년|창업자|예비창업자|스타트업|장애인|여성기업|경기|화성)/g);
    const target = targetMatch ? Array.from(new Set(targetMatch)).join(', ') : '해당기업';
    const budgetMatch = combined.match(/(\d+억원|\d+백만원|\d+만원|\d+억|\d+천만원|최대\s?\d+)/g);
    const budget = budgetMatch ? budgetMatch[0] : '상세참조';
    const deadlineMatch = combined.match(/(\d{1,2}\/\d{1,2})|(\d{1,2}\.\d{1,2})|\d{1,2}월\s?\d{1,2}일|상시|마감/g);
    const deadline = deadlineMatch ? deadlineMatch[0] : '공고확인';
    return { target, budget, deadline };
}

// 1. 화성산업진흥원 (경기/화성비즈 탭)
async function fetchHsbiz(): Promise<any[]> {
  try {
    const res = await axiosInstance.post('https://platform.hsbiz.or.kr/api/business/search', {
      page: 1, size: 20, searchText: "", sort: "latest"
    }, { headers: { 'Content-Type': 'application/json' } });
    
    return (res.data?.content || []).map((item: any) => {
      const desc = `[화성시] ${item.target || '기업지원'} 대상 지원사업입니다.`;
      return {
        id: `hsbiz-${item.id}`,
        ministry: '화성산업진흥원',
        category: '경기/화성비즈',
        title: item.title,
        link: `https://platform.hsbiz.or.kr/business/view/${item.id}`,
        date: item.endAt || new Date().toISOString(),
        description: desc,
        source: '화성산업진흥원',
        isLocal: true,
        almaengi: extractAlmaengi(item.title, desc)
      };
    });
  } catch (e) { return []; }
}

// 2. K-Startup (K-Startup 탭)
async function fetchKStartup(): Promise<any[]> {
    try {
        const res = await axiosInstance.get('https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do');
        const feed = await parser.parseString(res.data);
        return feed.items.slice(0, 30).map(item => {
            const desc = (item.contentSnippet || item.content || '').substring(0, 200);
            return {
                id: `kstartup-${item.guid || item.link || item.title}`,
                ministry: '중기부/창진원',
                category: 'K-Startup',
                title: item.title || '',
                link: item.link || 'https://www.k-startup.go.kr',
                date: item.pubDate || new Date().toISOString(),
                description: desc,
                source: 'K-Startup',
                isLocal: false,
                almaengi: extractAlmaengi(item.title || '', desc)
            };
        });
    } catch (e) { return []; }
}

// 3. 기업마당 (중기부/소진공 및 경기/화성비즈 통합)
async function fetchBizinfo(): Promise<any[]> {
    try {
        const res = await axiosInstance.get('https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/210/list.do');
        const $ = cheerio.load(res.data);
        const items: any[] = [];
        $('.table_style01 tbody tr').each((i, el) => {
            if (i >= 30) return;
            const title = $(el).find('.txt_left a').text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            const ministry = $(el).find('td').eq(2).text().trim() || '기타';

            if (title) {
                let category = '중기부/소진공'; // 기본
                if (title.includes('경기') || title.includes('화성')) category = '경기/화성비즈';
                
                items.push({
                    id: `bizinfo-${title}`,
                    ministry,
                    category,
                    title,
                    link: link ? `https://www.bizinfo.go.kr${link}` : 'https://www.bizinfo.go.kr',
                    date: $(el).find('td').eq(4).text().trim() || new Date().toISOString(),
                    description: '기업마당(Bizinfo) 최신 공식 공고입니다.',
                    source: '기업마당',
                    isLocal: title.includes('화성') || title.includes('경기'),
                    almaengi: extractAlmaengi(title, ministry)
                });
            }
        });
        return items;
    } catch (e) { return []; }
}

export async function GET() {
  try {
    const results = await Promise.allSettled([fetchHsbiz(), fetchKStartup(), fetchBizinfo()]);
    const items = results
        .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
        .map(r => r.value)
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}
