const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function test(url) {
    console.log(`Testing: ${url}`);
    try {
        const res = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: 5000
        });
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Data (first 100): ${res.data.substring(0, 100).replace(/\s+/g, ' ')}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function main() {
    const urls = [
        'https://www.gg.go.kr/rss/board.do?bsIdx=464',
        'https://www.gg.go.kr/bbs/board.do?bsIdx=464&q_rss=Y',
        'https://www.hscity.go.kr/www/user/bbs/BD_selectBbsList.do?q_bbsCode=1019&q_rss=Y',
        'https://www.hscity.go.kr/www/user/rss/BD_selectRss.do?q_bbsCode=1019'
    ];
    for (const url of urls) {
        await test(url);
        console.log('---');
    }
}
main();
