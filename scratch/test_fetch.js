async function test() {
  const sources = [
    { name: 'Korea.kr', url: 'https://www.korea.kr/rss/pressrelease.xml' },
    { name: 'MSS', url: 'https://mss.go.kr/rss/smba/board/85.do' },
    { name: 'Bizinfo', url: 'https://www.bizinfo.go.kr/uss/rss/bizinfoRss.do' }
  ];

  for (const src of sources) {
    try {
      console.log(`Testing ${src.name}...`);
      const res = await fetch(src.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Length: ${text.length}`);
      console.log(`Preview: ${text.substring(0, 100).replace(/\n/g, '')}`);
    } catch (e) {
      console.error(`${src.name} error:`, e.message);
    }
    console.log('---');
  }
}

test();
