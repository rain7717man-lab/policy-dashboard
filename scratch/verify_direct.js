const cheerio = require('cheerio');

async function verify() {
  try {
    const res = await fetch('https://www.korea.kr/news/pressList.do', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const count = $('.list-type1 > li').length;
    console.log('Korea.kr items found:', count);
    if (count > 0) {
      console.log('First Title:', $('.list-type1 > li').first().find('span.subject').text().trim());
    }
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

verify();
