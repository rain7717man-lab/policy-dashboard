import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

type CustomFeed = { title: string };
type CustomItem = { description: string, pubDate: string, contentSnippet?: string, content?: string };

const parser = new Parser<CustomFeed, CustomItem>();

// 공식 공인 기관 RSS 실시간 수집
const RSS_SOURCES = [
  {
    name: '대한민국 정책브리핑',
    url: 'https://www.korea.kr/rss/pressrelease.xml',
    category: '보도자료'
  },
  {
    name: '중소벤처기업부',
    url: 'https://mss.go.kr/rss/smba/board/85.do',
    category: '보도자료'
  }
];

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          next: { revalidate: 0 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const xml = await res.text();
        const feed = await parser.parseString(xml);
        
        return feed.items.map(item => {
          let ministry = source.name === '중소벤처기업부' ? '중소벤처기업부' : '부처 공통';
          let title = item.title || '';
          
          if (source.name === '대한민국 정책브리핑') {
            const matches = title.match(/\[(.*?)\]/g);
            if (matches && matches.length > 0) {
              let extracted = matches[0].replace(/\[|\]/g, '').trim();
              if (extracted === '보도자료' && matches.length > 1) {
                  extracted = matches[1].replace(/\[|\]/g, '').trim();
              }
              if (extracted !== '보도자료') {
                  ministry = extracted;
              }
              title = title.replace(/^\[.*?\]\s*/, '').replace(/^\[.*?\]\s*/, '');
            }
          }

          let category = '기타 부처';
          if (['기획재정부', '국토교통부', '금융위원회', '공정거래위원회'].some(m => ministry.includes(m))) {
            category = '경제/부동산';
          } else if (['보건복지부', '행정안전부', '고용노동부', '여성가족부'].some(m => ministry.includes(m))) {
            category = '생활/복지';
          }
          
          let content = (item.contentSnippet || item.content || item.description || '').trim();
          content = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
          
          return {
            id: item.guid || item.link || Math.random().toString(),
            ministry,
            category,
            title,
            link: item.link,
            date: item.pubDate,
            description: content || `${ministry}의 최신 공식 보도자료입니다.`,
            source: '공식 보도자료',
            isLocal: title.includes('화성') || title.includes('경기')
          };
        });
      } catch (e) {
        return [];
      }
    }));

    const items = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .map(r => r.value)
      .flat()
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}
