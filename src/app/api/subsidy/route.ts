import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

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

const SOURCES = [
  {
    name: 'K-Startup',
    url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
    selector: '.pbanc_list li',
    titleSelector: '.title',
    linkSelector: 'a',
    dateSelector: '.date'
  },
  {
    name: '화성산업진흥원',
    url: 'https://hsbiz.or.kr/support/announcement/list',
    selector: '.table_style tbody tr',
    titleSelector: '.td_subject',
    linkSelector: 'a',
    dateSelector: '.td_date'
  },
  {
    name: '경기업비저',
    url: 'https://www.egbiz.or.kr/prj/supportPrjList.do',
    selector: '.board_list tbody tr',
    titleSelector: '.subject',
    linkSelector: 'a',
    dateSelector: '.date'
  }
];

export async function GET() {
  const results: SubsidyItem[] = [];

  const crawlTasks = SOURCES.map(async (src) => {
    try {
      const { data: html } = await axios.get(src.url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(html);

      $(src.selector).each((_, el) => {
        const title = $(el).find(src.titleSelector).text().trim();
        let link = $(el).find(src.linkSelector).attr('href') || '';
        const date = $(el).find(src.dateSelector).text().trim() || new Date().toISOString();

        if (title) {
          if (link && !link.startsWith('http')) {
             const baseUrl = new URL(src.url).origin;
             link = baseUrl + (link.startsWith('/') ? '' : '/') + link;
          }

          const isLocal = title.includes('화성') || title.includes('경기') || src.name.includes('화성') || src.name.includes('경기');

          results.push({
            id: Math.random().toString(36).substring(7),
            ministry: src.name,
            category: '지원사업',
            title,
            link,
            date,
            description: `${src.name}에서 제공하는 공고입니다.`,
            source: src.name,
            isLocal
          });
        }
      });
    } catch (e) {
      console.error(`Error crawling ${src.name}:`, e);
    }
  });

  await Promise.all(crawlTasks);

  return NextResponse.json({ success: true, count: results.length, data: results });
}
