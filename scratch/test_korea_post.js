const cheerio = require('cheerio');

async function test_post() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    
    const params = new URLSearchParams();
    params.append('pageIndex', '1');
    params.append('startDate', lastYear);
    params.append('endDate', today);

    const res = await fetch('https://www.korea.kr/briefing/pressReleaseList.do', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: params
    });
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const count = $('ul.list-type1 > li').length;
    console.log('Korea.kr items found via POST:', count);
    
    if (count > 0) {
        const first = $('ul.list-type1 > li').first();
        console.log('Sample Title:', first.find('strong').text().trim());
    } else {
        console.log('HTML length:', html.length);
        console.log('Sample HTML (first 500):', html.substring(0, 500));
    }
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

test_post();
