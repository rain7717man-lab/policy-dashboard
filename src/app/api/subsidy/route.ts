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
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://platform.hsbiz.or.kr/business/list',
        'Origin': 'https://platform.hsbiz.or.kr'
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

// 2. K-Startup 직접 수집 (RSS)
async function fetchKStartup(): Promise<SubsidyItem[]> {
    try {
        const url = 'https://www.k-startup.go.kr/web/contents/rss/bizpbanc-ongoing.do';
        const res = await fetch(url, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const xml = await res.text();
        const feed = await parser.parseString(xml);
        
        return feed.items.map(item => ({
            id: `kstartup-${item.guid || item.link || item.title}`,
            ministry: '중기부/창진원',
            category: '지원사업',
            title: item.title || '',
            link: item.link || 'https://www.k-startup.go.kr',
            date: item.pubDate || new Date().toISOString(),
            description: (item.contentSnippet || item.content || '').substring(0, 200) || 'K-Startup 최신 지원사업 공고입니다.',
            source: 'K-Startup',
            isLocal: false
        }));
    } catch (e) {
        console.error('K-Startup RSS fetch error:', e);
        return [];
    }
}

// 3. 기업마당(Bizinfo) 직접 크롤링
async function fetchBizinfo(): Promise<SubsidyItem[]> {
    try {
        const res = await fetch('https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/210/list.do', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const items: SubsidyItem[] = [];

        $('.table_style01 tbody tr').each((_, el) => {
            const title = $(el).find('.txt_left a').text().trim();
            const link = $(el).find('.txt_left a').attr('href');
            const date = $(el).find('td').eq(4).text().trim();
            const ministry = $(el).find('td').eq(2).text().trim();

            if (title) {
                items.push({
                    id: `bizinfo-${title}`,
                    ministry: ministry || '기타',
                    category: '지원사업',
                    title,
                    link: link ? `https://www.bizinfo.go.kr${link}` : 'https://www.bizinfo.go.kr',
                    date: date || new Date().toISOString(),
                    description: '기업마당(Bizinfo)에 등록된 최신 지원사업 공식 공고입니다.',
                    source: '기업마당',
                    isLocal: title.includes('화성') || title.includes('경기')
                });
            }
        });
        return items;
    } catch (e) {
        console.error('Bizinfo fetch error:', e);
        return [];
    }
}

// 4. 범용 백업 (Google News RSS)
async function fetchGoogleNewsFallback(query: string, sourceName: string): Promise<SubsidyItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=ko&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(url);
    
    return feed.items.slice(0, 3).map((item: any) => ({
      id: `news-${item.guid || item.link}`,
      ministry: sourceName,
      category: '지원사업',
      title: item.title,
      link: item.link,
      date: item.pubDate,
      description: item.contentSnippet || '최신 지원사업 관련 뉴스 소식입니다.',
      source: `뉴스/${sourceName}`,
      isLocal: item.title.includes('화성') || item.title.includes('경기')
    }));
  } catch (e) {
    return [];
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled([
      fetchHsbiz(),
      fetchKStartup(),
      fetchBizinfo(),
      fetchGoogleNewsFallback('정부지원사업 공고', '통합뉴스')
    ]);

    const items = results
        .filter((r): r is PromiseFulfilledResult<SubsidyItem[]> => r.status === 'fulfilled')
        .map(r => r.value)
        .flat();

    // 직접 수집 데이터를 상단으로 배치하기 위해 정렬 시 가중치 부여
    items.sort((a, b) => {
        const isANews = a.source.startsWith('뉴스') ? 1 : 0;
        const isBNews = b.source.startsWith('뉴스') ? 1 : 0;
        if (isANews !== isBNews) return isANews - isBNews;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ 
      success: true, 
      count: items.length, 
      data: items 
    });
  } catch (error) {
    console.error("Subsidy Route Error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}
