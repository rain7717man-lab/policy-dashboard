const Parser = require('rss-parser');
const parser = new Parser();

async function test_mss_rss() {
  try {
    const feed = await parser.parseURL('https://mss.go.kr/rss/smba/board/85.do');
    console.log("MSS RSS Title:", feed.title);
    console.log("Item Count:", feed.items.length);
    if (feed.items.length > 0) {
      console.log("First Item Title:", feed.items[0].title);
    }
  } catch (e) {
    console.error("MSS RSS Error:", e.message);
  }
}

test_mss_rss();
