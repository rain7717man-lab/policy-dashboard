const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test_bizinfo() {
  try {
    const res = await axios.get('https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?dataType=json&searchCnt=20', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log("Bizinfo Status:", res.status);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Bizinfo Error:", e.message);
  }
}

async function test_hsbiz() {
  try {
    const res = await axios.post('https://platform.hsbiz.or.kr/api/business/search', {
      page: 1,
      size: 10,
      searchText: "",
      sort: "latest"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log("Hsbiz Status:", res.status);
    console.log(JSON.stringify(res.data, null, 2).substring(0, 500) + "...");
  } catch (e) {
    console.error("Hsbiz Error:", e.message);
  }
}

test_bizinfo().then(test_hsbiz);
