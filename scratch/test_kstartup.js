const cheerio = require('cheerio');

async function test_kstartup() {
  try {
    console.log('Testing K-Startup POST...');
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: 'pageIndex=1'
    });
    
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const items = [];
    $('.pbanc_list li').each((i, el) => {
      items.push({
        title: $(el).find('.title').text().trim(),
        date: $(el).find('.date').text().trim(),
        link: $(el).find('a').attr('href')
      });
    });
    
    console.log('Found Items:', items.length);
    if (items.length > 0) {
      console.log('Sample Item:', items[0]);
    }
  } catch (e) {
    console.error('K-Startup error:', e.message);
  }
}

test_kstartup();
