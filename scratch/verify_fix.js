const axios = require('axios');
const https = require('https');
const Parser = require('rss-parser');
const parser = new Parser();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function test_hsbiz() {
  console.log("Testing Hsbiz API...");
  try {
    const res = await axios.post('https://platform.hsbiz.or.kr/api/business/search', {
      page: 1,
      size: 5,
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
    console.log("Hsbiz found:", res.data?.content?.length || 0, "items");
    if (res.data?.content?.[0]) console.log("Sample:", res.data.content[0].title);
  } catch (e) {
    console.error("Hsbiz failed:", e.message);
  }
}

async function test_google_news() {
  console.log("\nTesting Google News Fallback...");
  try {
    const query = '창업진흥원 K-Startup 지원사업 공고';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=ko&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(url);
    console.log("Google News found:", feed.items.length, "items");
    if (feed.items[0]) console.log("Sample:", feed.items[0].title);
  } catch (e) {
    console.error("Google News failed:", e.message);
  }
}

async function run() {
  await test_hsbiz();
  await test_google_news();
}

run();
