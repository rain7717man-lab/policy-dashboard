const axios = require('axios');

async function test() {
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
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.message);
    if (e.response) console.error(e.response.data);
  }
}

test();
