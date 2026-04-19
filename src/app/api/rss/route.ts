import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import axios from 'axios';
import https from 'https';

type CustomFeed = { title: string };
type CustomItem = { description: string, pubDate: string, contentSnippet?: string, content?: string };

const parser = new Parser<CustomFeed, CustomItem>();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const RSS_SOURCES = [
  {
    name: '대한민국 정책브리핑',
    url: 'https://www.korea.kr/rss/pressrelease.xml',
    category: '보도자료'
  },
  {
    name: '중소벤처기업부',
    url: 'https://mss.go.kr/rss/smba/board/85.do',
    category: '사업공고'
  }
];

// 캐싱 방지
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allItems = await Promise.all(RSS_SOURCES.map(async (source) => {
      try {
        // parser.parseURL 대신 axios.get + parser.parseString 사용 (헤더 및 인증서 처리 가능)
        const response = await axios.get(source.url, {
          httpsAgent,
          timeout: 7000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });
        
        const feed = await parser.parseString(response.data);
        
        return feed.items.map(item => {
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
          
          if (!content || content.includes('[자료제공 :(') || content.includes('www.korea.kr') && content.length < 50) {
              content = ministry + "의 최신 소식입니다. 원문을 참조해 주세요.";
          }
          
          return {
            id: item.guid || item.link || Math.random().toString(),
            ministry,
            category,
            title,
            link: item.link,
            date: item.pubDate,
            description: content,
            source: source.name,
            isLocal: title.includes('화성') || title.includes('경기') || content.includes('화성시') || content.includes('경기도')
          };
        });
      } catch (e) {
        console.error(`Failed to fetch ${source.name}:`, e);
        return [];
      }
    }));

    const items = allItems.flat();

    // 날짜 기준 최신순 정렬
    items.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("RSS API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch RSS feeds' }, { status: 500 });
  }
}
