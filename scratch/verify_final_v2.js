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
        const linkEl = first.find('a');
        const title = linkEl.find('strong').text().trim();
        const infoEl = linkEl.find('.date-info, .date');
        const infoSpans = infoEl.find('span');
        const date = infoSpans.eq(0).text().trim();
        const ministry = infoSpans.eq(1).text().trim();
        
        console.log('Sample Data:');
        console.log('Title:', title);
        console.log('Date:', date);
        console.log('Ministry:', ministry);
    } else {
        console.log('No items found. HTML Sample (first 500 chars):');
        console.log(html.substring(0, 500));
        // Check for specific tags
        console.log('Contains list-type1?', html.includes('list-type1'));
    }
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

verify();
