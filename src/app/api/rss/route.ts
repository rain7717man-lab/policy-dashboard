import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

type CustomFeed = { title: string };
type CustomItem = { description: string, pubDate: string, contentSnippet?: string, content?: string };

const parser = new Parser<CustomFeed, CustomItem>();

const RSS_SOURCES = [
  {
    name: '대한민국 정책브리핑',
    url: 'https://www.korea.kr/rss/pressrelease.xml',
    category: '보도자료'
  },
  {
    name: '중소벤처기업부',
    url: 'https://mss.go.kr/rss/smba/board/85.do',
    category: '사업공고',
    fallbackUrl: 'https://mss.go.kr/site/smba/ex/board/List.do?cbIdx=86'
  }
];

export const dynamic = 'force-dynamic';

async function fetchMssFallback(): Promise<any[]> {
    try {
        const res = await fetch('https://mss.go.kr/site/smba/ex/board/List.do?cbIdx=86', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(5000)
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const items: any[] = [];
        
        $('.table_style01 tbody tr').each((i, el) => {
            if (i >= 20) return; // 상위 20개만 수집
            const title = $(el).find('.txt_left a').text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            const date = $(el).find('td').eq(4).text().trim();
            
            if (title) {
                items.push({
                    id: `mss-crawl-${title}`,
                    ministry: '중소벤처기업부',
                    category: '사업공고',
                    title,
                    link: link ? `https://mss.go.kr${link}` : 'https://mss.go.kr',
                    date: date || new Date().toISOString(),
                    description: '중소벤처기업부 최신 보도자료 및 공고입니다.',
                    source: '중소벤처기업부',
                    isLocal: false
                });
            }
        });
        return items;
    } catch (e) {
        return [];
    }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(10000), // 10초 타임아웃
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const xml = await res.text();
        if (xml.length < 500 && source.name === '중소벤처기업부') {
            return await fetchMssFallback();
        }

        const feed = await parser.parseString(xml);
        
        // 소스별 최대 30개로 제한하여 쏠림 방지
        return feed.items.slice(0, 30).map(item => {
          let ministry = source.name === '중소벤처기업부' ? '중소벤처기업부' : '기타 부처';
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

          let category = source.category;
          if (source.name === '대한민국 정책브리핑') {
            if (['기획재정부', '국토교통부', '금융위원회', '공정거래위원회'].includes(ministry)) {
              category = '경제/부동산';
            } else if (['보건복지부', '행정안전부', '고용노동부', '여성가족부'].includes(ministry)) {
              category = '생활/복지';
            }
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
            description: content || `${ministry}의 최신 소식입니다.`,
            source: source.name,
            isLocal: title.includes('화성') || title.includes('경기') || content.includes('화성시') || content.includes('경기도')
          };
        });
      } catch (e: any) {
        if (source.name === '중소벤처기업부') return await fetchMssFallback();
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
