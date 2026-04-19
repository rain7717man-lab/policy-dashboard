const axios = require('axios');
const https = require('https');

const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function test_hsbiz() {
  try {
    const res = await axios.post('https://platform.hsbiz.or.kr/api/business/search', {
      page: 1,
      size: 10,
      searchText: "",
      sort: "latest"
    }, {
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://platform.hsbiz.or.kr/business/list',
        'Origin': 'https://platform.hsbiz.or.kr'
      }
    });
    console.log("Hsbiz Status:", res.status);
    console.log("Items:", res.data.content?.length);
    if (res.data.content?.[0]) {
      console.log("First Item:", res.data.content[0].title);
    }
  } catch (e) {
    console.error("Hsbiz Error:", e.message);
  }
}

test_hsbiz();
