const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const axiosInstance = axios.create({
  timeout: 15000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  }
});

async function verify() {
  const targets = [
    { name: 'Korea.kr', url: 'https://www.korea.kr/briefing/pressReleaseList.do', selector: 'ul.list-type1 > li' },
    { name: 'MSS', url: 'https://www.mss.go.kr/site/smba/ex/board/List.do?cbIdx=86', selector: '.table_style01 tbody tr' },
    { name: 'SEMAS', url: 'https://www.semas.or.kr/web/board/webBoardList.kmdc?bCd=1&pNm=BOA0101', selector: '.table_style01 tbody tr' },
    { name: 'egBiz', url: 'https://www.egbiz.or.kr/prjCategory/prjCategoryList.do?p_category_id=G01', selector: '.table_style01 tbody tr' }
  ];

  for (const target of targets) {
    try {
      console.log(`Testing ${target.name}...`);
      const res = await axiosInstance.get(target.url);
      const $ = cheerio.load(res.data);
      const count = $(target.selector).length;
      console.log(`- Result: ${count} items found.`);
      if (count > 0) {
        console.log(`- First Title: ${$(target.selector).first().find('a').text().trim() || 'No link text'}`);
      }
    } catch (e) {
      console.log(`- Failed ${target.name}: ${e.message}`);
    }
    console.log('---');
  }
}

verify();
