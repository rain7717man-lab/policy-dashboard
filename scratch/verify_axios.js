const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const axiosInstance = axios.create({
  timeout: 10000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  }
});

async function verify() {
  try {
    console.log('Testing Korea.kr Direct Scraping...');
    const res = await axiosInstance.get('https://www.korea.kr/briefing/pressReleaseList.do');
    const $ = cheerio.load(res.data);
    const count = $('ul.list-type1 > li').length;
    console.log('Korea.kr items found:', count);
    if (count > 0) {
      console.log('First Title:', $('ul.list-type1 > li').first().find('strong').text().trim());
    } else {
        console.log('Page Content Sample (500 chars):', res.data.substring(0, 500));
    }
    
    console.log('---');
    console.log('Testing MSS Direct Scraping...');
    const res2 = await axiosInstance.get('https://www.mss.go.kr/site/smba/ex/board/List.do?cbIdx=86');
    const $2 = cheerio.load(res2.data);
    console.log('MSS items found:', $2('.table_style01 tbody tr').length);

  } catch (e) {
    console.error('Verification failed:', e.message);
  }
}

verify();
