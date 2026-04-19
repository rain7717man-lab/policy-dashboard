const axios = require('axios');
const Parser = require('rss-parser');
const https = require('https');

const parser = new Parser();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function test_rss() {
  const url = 'https://www.korea.kr/rss/pressrelease.xml';
  try {
    console.log(`Fetching RSS from ${url}...`);
    const response = await axios.get(url, {
      httpsAgent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log("Response Status:", response.status);
    const feed = await parser.parseString(response.data);
    console.log("Feed Title:", feed.title);
    console.log("Item Count:", feed.items.length);
  } catch (e) {
    console.error("RSS Fetch Error:", e.message);
    if (e.response) console.log("Error Body Preview:", e.response.data.substring(0, 200));
  }
}

test_rss();
