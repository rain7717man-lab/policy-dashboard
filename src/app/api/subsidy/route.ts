import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const parser = new Parser();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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

// 1. 화성산업진흥원 (JSON API)
async function fetchHsbiz(): Promise<SubsidyItem[]> {
  try {
    const res = await axios.post('https://platform.hsbiz.or.kr/api/business/search', {
      page: 1,
      size: 15,
      searchText: "",
      sort: "latest"
    }, {
      httpsAgent,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://platform.hsbiz.or.kr/business/list'
      }
    });

    return (res.data?.content || []).map((item: any) => ({
      id: `hsbiz-${item.id}`,
      ministry: '화성산업진흥원',
      category: '지원사업',
      title: item.title,
      link: `https://platform.hsbiz.or.kr/business/view/${item.id}`,
      date: item.endAt || new Date().toISOString(),
      description: `[화성시] ${item.target || '기업지원'} 대상 지원사업입니다. 신청기간: ${item.startAt} ~ ${item.endAt}`,
      source: '화성산업진흥원',
      isLocal: true
    }));
  } catch (e) {
    console.error('Hsbiz fetch error:', e);
    return [];
  }
}

// 2. 범용 백업 (Google News RSS) - K-Startup, 경기도 등 키워드 기반
async function fetchGoogleNewsFallback(query: string, sourceName: string, isLocal = false): Promise<SubsidyItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=ko&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(url);
    
    return feed.items.slice(0, 10).map((item: any) => ({
      id: `news-${item.guid || item.link}`,
      ministry: sourceName,
      category: '지원사업',
      title: item.title,
      link: item.link,
      date: item.pubDate,
      description: item.contentSnippet || '최신 지원사업 소식입니다. 원문에서 상세 내용을 확인하세요.',
      source: sourceName,
      isLocal: isLocal || item.title.includes('화성') || item.title.includes('경기')
    }));
  } catch (e) {
    console.error(`Google News (${query}) error:`, e);
    return [];
  }
}

export async function GET() {
  try {
    // 여러 출처 병렬 수집
    const [hsbizItems, kstartupItems, gyeonggiItems] = await Promise.all([
      fetchHsbiz(),
      fetchGoogleNewsFallback('창업진흥원 K-Startup 지원사업 공고', 'K-Startup'),
      fetchGoogleNewsFallback('경기도 지원사업 공고 egBiz', '경기업비저', true)
    ]);

    const results = [...hsbizItems, ...kstartupItems, ...gyeonggiItems];

    // 날짜순 정렬
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      data: results 
    });
  } catch (error) {
    console.error("Subsidy Route Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
