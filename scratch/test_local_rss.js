const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function testRss(url) {
    console.log(`Testing: ${url}`);
    try {
        const res = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        console.log(`Status: ${res.status}`);
        console.log(`Data (first 200 chars): ${res.data.substring(0, 200)}`);
        return true;
    } catch (e) {
        console.log(`Error: ${e.message}`);
        return false;
    }
}

async function main() {
    const urls = [
        'https://www.hscity.go.kr/www/user/bbs/BD_selectBbsList.do?q_bbsCode=1019', // Board
        'https://www.hscity.go.kr/rss/bbs/BD_selectBbsList.do?q_bbsCode=1019', // Potential RSS
        'https://www.gg.go.kr/rss/board.do?bsIdx=468', // Gyeonggi Economy RSS
        'https://www.gg.go.kr/rss/board.do?bsIdx=464', // Gyeonggi General RSS
        'https://www.hscity.go.kr/www/user/rss/BD_selectRss.do?q_bbsCode=1019' // Another pattern
    ];

    for (const url of urls) {
        await testRss(url);
        console.log('---');
    }
}

main();
