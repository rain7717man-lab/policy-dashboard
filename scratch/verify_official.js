const cheerio = require('cheerio');

async function verify() {
  try {
    const res = await fetch('https://www.korea.kr/briefing/pressReleaseList.do', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = $('ul.list-type1 > li');
    console.log('Korea.kr items found:', items.length);
    
    if (items.length > 0) {
        const first = items.first();
        const linkEl = first.find('a[href*="pressReleaseView.do"]');
        const title = linkEl.find('strong').text().trim();
        const dateInfo = linkEl.find('span.date');
        const date = dateInfo.find('span').first().text().trim();
        const ministry = dateInfo.find('span').last().text().trim();
        
        console.log('Sample Data:');
        console.log('Title:', title);
        console.log('Date:', date);
        console.log('Ministry:', ministry);
    }
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

verify();
