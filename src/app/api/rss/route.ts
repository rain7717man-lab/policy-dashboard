import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

type CustomFeed = { title: string };
type CustomItem = { description: string, pubDate: string, contentSnippet?: string, content?: string };

const parser = new Parser<CustomFeed, CustomItem>();

export const dynamic = 'force-dynamic';

// 알맹이 추출 로직 (대상, 예산, 마감)
export function extractAlmaengi(title: string, content: string) {
    const combined = `${title} ${content}`;
    
    // 1. 신청 대상 추출
    const targetMatch = combined.match(/(소상공인|소기업|중소기업|청년|창업자|예비창업자|스타트업|장애인|여성기업|경기|화성)/g);
    const target = targetMatch ? Array.from(new Set(targetMatch)).join(', ') : '전체/기관';

    // 2. 지원 예산 추출
    const budgetMatch = combined.match(/(\d+억원|\d+백만원|\d+만원|\d+억|\d+천만원|최대\s?\d+)/g);
    const budget = budgetMatch ? budgetMatch[0] : '내용 확인';

    // 3. 접수 마감일 추출
    const deadlineMatch = combined.match(/(\d{1,2}\.\d{1,2})|\d{1,2}월\s?\d{1,2}일|상시|마감/g);
    const deadline = deadlineMatch ? deadlineMatch[0] : '상세참조';

    return { target, budget, deadline };
}

export async function GET() {
  const url = 'https://www.korea.kr/rss/pressrelease.xml';

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const feed = await parser.parseString(xml);
    
    // 최신 30개로 제한
    const items = feed.items.slice(0, 30).map(item => {
      let ministry = '부처 공통';
      let title = item.title || '';
      
      const matches = title.match(/\[(.*?)\]/g);
      if (matches && matches.length > 0) {
        let extracted = matches[0].replace(/\[|\]/g, '').trim();
        if (extracted === '보도자료' && matches.length > 1) {
            extracted = matches[1].replace(/\[|\]/g, '').trim();
        }
        if (extracted !== '보도자료') ministry = extracted;
        title = title.replace(/^\[.*?\]\s*/, '').replace(/^\[.*?\]\s*/, '');
      }

      const rawContent = (item.contentSnippet || item.content || item.description || '').replace(/<[^>]*>?/gm, '');
      const almaengi = extractAlmaengi(title, rawContent);
      
      return {
        id: item.guid || item.link || Math.random().toString(),
        ministry,
        category: '정책브리핑',
        title,
        link: item.link,
        date: item.pubDate,
        description: rawContent.substring(0, 200),
        source: '정책브리핑',
        isLocal: title.includes('화성') || title.includes('경기'),
        almaengi // 알맹이 정보 추가
      };
    });

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}
