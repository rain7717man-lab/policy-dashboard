import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

type CustomFeed = { title: string };
type CustomItem = { description: string, pubDate: string, contentSnippet?: string, content?: string };

const parser = new Parser<CustomFeed, CustomItem>();

const RSS_URL = 'https://www.korea.kr/rss/pressrelease.xml';

// 캐싱 방지: 매 요청마다 RSS 서버에서 최신 정보를 가져옵니다.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    
    const items = feed.items.map(item => {
      // 제목에서 부처명 추출 (예: "[과학기술정보통신부]어쩌고" -> "과학기술정보통신부")
      let ministry = '기타 부처';
      let title = item.title || '';
      
      // 정규식으로 대괄호 안의 텍스트 추출 (보도자료 등의 말머리 제외를 위해 먼저 가장 긴 단일 부처명을 찾거나, 단순 추출 후 보정)
      const matches = title.match(/\[(.*?)\]/g);
      if (matches && matches.length > 0) {
        // 보통 첫 번째 말머리가 부처명(또는 위원회)임. [보도자료] 처럼 되어 있을 수도 있음.
        // 가능한 부처 이름이 들어간 것을 택함
        let extracted = matches[0].replace(/\[|\]/g, '').trim();
        if (extracted === '보도자료' && matches.length > 1) {
            extracted = matches[1].replace(/\[|\]/g, '').trim();
        }
        if (extracted !== '보도자료') {
            ministry = extracted;
        }
        title = title.replace(/^\[.*?\]\s*/, '').replace(/^\[.*?\]\s*/, '');
      }

      // 부처별 카테고리 매핑
      let category = '기타 부처';
      if (['기획재정부', '국토교통부', '금융위원회', '공정거래위원회'].includes(ministry)) {
        category = '경제/부동산';
      } else if (['보건복지부', '행정안전부', '고용노동부', '여성가족부'].includes(ministry)) {
        category = '생활/복지';
      }
      
      // 요약 내용이 없을 경우 대체 텍스트 삽입
      let content = (item.contentSnippet || item.content || item.description || '').trim();
      
      // HTML 태그 강제 제거 및 공백 정리
      content = content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
      
      // 의미없는 단순 안내 문구일 경우 예외 처리
      if (!content || content.includes('[자료제공 :(') || content.includes('www.korea.kr') && content.length < 50) {
          content = "원문을 참조해 주세요.";
      }
      
      return {
        id: item.guid || item.link || Math.random().toString(),
        ministry,
        category,
        title,
        link: item.link,
        date: item.pubDate,
        description: content,
      };
    });

    // 날짜 기준 최신순 정렬
    items.sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("RSS API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch RSS feeds' }, { status: 500 });
  }
}
