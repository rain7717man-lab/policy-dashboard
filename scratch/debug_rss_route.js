const Parser = require('rss-parser');
const parser = new Parser();

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

async function debug_rss() {
  const allItems = await Promise.all(RSS_SOURCES.map(async (source) => {
    try {
      console.log(`Fetching ${source.name} from ${source.url}...`);
      const res = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      console.log(`Status for ${source.name}: ${res.status}`);
      if (!res.ok) return [];
      
      const xml = await res.text();
      console.log(`XML length for ${source.name}: ${xml.length}`);
      
      const feed = await parser.parseString(xml);
      console.log(`Parsed ${feed.items.length} items from ${source.name}`);
      
      return feed.items.map(item => ({
        source: source.name,
        title: item.title,
        date: item.pubDate
      }));
    } catch (e) {
      console.error(`Error for ${source.name}:`, e.message);
      return [];
    }
  }));

  const flat = allItems.flat();
  console.log(`Total Items: ${flat.length}`);
  if (flat.length > 0) {
    console.log(`First item title: ${flat[0].title}`);
  }
}

debug_rss();
