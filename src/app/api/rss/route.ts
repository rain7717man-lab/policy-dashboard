import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export const dynamic = 'force-dynamic';

const STABLE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

async function fetchWithTimeout(url: string, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            headers: STABLE_HEADERS,
            signal: controller.signal,
            next: { revalidate: 0 }
        });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

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

export async function GET() {
  try {
    const results = await Promise.allSettled([
      // 1. 정책브리핑 RSS
      fetchWithTimeout('https://www.korea.kr/rss/pressrelease.xml'),
      // 2. K-Startup RSS
      fetchWithTimeout('https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do'),
      // 3. 기업마당(Bizinfo) RSS - 통합 창구
      fetchWithTimeout('https://www.bizinfo.go.kr/uss/rss/bizinfoRss.do'),
      // 4. 화성산업진흥원 (API)
      fetch('https://platform.hsbiz.or.kr/api/business/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: 1, size: 40, searchText: "", sort: "latest" })
      })
    ]);

    let allItems: any[] = [];

    // [결과 처리 1: 정책브리핑]
    if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const xml = await results[0].value.text();
        const feed = await parser.parseString(xml);
        feed.items.forEach(item => {
            const title = (item.title || '');
            allItems.push({
                id: `press-${item.guid || item.link}`,
                ministry: title.match(/\[(.*?)\]/)?.[1] || '부처 공통',
                category: '정책브리핑',
                title: title.replace(/\[.*?\]\s*/, ''),
                link: item.link,
                date: item.pubDate,
                description: (item.contentSnippet || '').substring(0, 150),
                source: '정책브리핑',
                almaengi: extractAlmaengi(title, item.contentSnippet || '')
            });
        });
    }

    // [결과 처리 2: K-Startup]
    if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const xml = await results[1].value.text();
        const feed = await parser.parseString(xml);
        feed.items.forEach(item => {
            allItems.push({
                id: `kstartup-${item.guid || item.link}`,
                ministry: '중기부/창진원',
                category: 'K-Startup',
                title: item.title,
                link: item.link,
                date: item.pubDate,
                description: (item.contentSnippet || '').substring(0, 150),
                source: 'K-Startup',
                almaengi: extractAlmaengi(item.title || '', item.contentSnippet || '')
            });
        });
    }

    // [결과 처리 3: 기업마당(Bizinfo) -> 중기부/소진공 및 경기비즈 분류]
    if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const xml = await results[2].value.text();
        const feed = await parser.parseString(xml);
        feed.items.forEach(item => {
            const title = item.title || '';
            const desc = item.contentSnippet || '';
            let category = '기타';
            
            if (title.includes('소상공인') || title.includes('소진공') || title.includes('중기부') || title.includes('중소벤처')) {
                category = '중기부/소진공';
            } else if (title.includes('경기') || title.includes('화성') || title.includes('이천') || title.includes('용인')) {
                category = '경기/화성비즈';
            }
            
            if (category !== '기타') {
                allItems.push({
                    id: `biz-${item.guid || item.link}`,
                    ministry: '기업마당 통합',
                    category,
                    title,
                    link: item.link,
                    date: item.pubDate,
                    description: desc.substring(0, 150),
                    source: '기업마당',
                    almaengi: extractAlmaengi(title, desc)
                });
            }
        });
    }

    // [결과 처리 4: 화성진흥원]
    if (results[3].status === 'fulfilled' && results[3].value.ok) {
        const json = await results[3].value.json();
        (json?.content || []).forEach((item: any) => {
            allItems.push({
                id: `hsbiz-${item.id}`,
                ministry: '화성산업진흥원',
                category: '경기/화성비즈',
                title: item.title,
                link: `https://platform.hsbiz.or.kr/business/view/${item.id}`,
                date: item.endAt,
                description: `[화성시] ${item.target || '기업지원'} 대상`,
                source: '화성진흥원',
                isLocal: true,
                almaengi: extractAlmaengi(item.title, '')
            });
        });
    }

    return NextResponse.json({ success: true, count: allItems.length, data: allItems });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}
