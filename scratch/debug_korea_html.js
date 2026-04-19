const cheerio = require('cheerio');
const fs = require('fs');

async function debug_html() {
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
    fs.writeFileSync('scratch/korea_full.html', html);
    const $ = cheerio.load(html);
    
    // 리스트를 포함하는 상위 클래스 찾아보기
    console.log('Class list-type1 exists?', $('.list-type1').length);
    console.log('Any ul exists?', $('ul').length);
    console.log('Any li exists?', $('li').length);
    
    // 만약 리스트가 없다면, 본문 영역의 클래스 확인
    console.log('Content area exists?', $('#content').length || $('.content').length);

  } catch (e) {
    console.error('Failed:', e.message);
  }
}

debug_html();
