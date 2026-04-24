const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function inspect(url) {
    console.log(`Inspecting: ${url}`);
    try {
        const res = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        const $ = cheerio.load(res.data);
        
        // Try to find table rows
        const rows = $('table tbody tr, ul.list-wrap li, .board-list tr, .list-type tr, .board_list tr');
        console.log(`Found ${rows.length} rows`);
        
        if (rows.length === 0) {
            console.log("No rows found. Body snippet:");
            console.log(res.data.substring(res.data.indexOf('<body'), res.data.indexOf('<body') + 2000));
        } else {
            rows.slice(0, 5).each((i, el) => {
                console.log(`Row ${i}: ${$(el).text().replace(/\s+/g, ' ').trim().substring(0, 150)}`);
                const link = $(el).find('a').attr('href');
                console.log(`Link ${i}: ${link}`);
            });
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function main() {
    await inspect('https://www.hscity.go.kr/www/user/bbs/BD_selectBbsList.do?q_bbsCode=1019');
    console.log('---');
    await inspect('https://www.gg.go.kr/bbs/board.do?bsIdx=468');
}

main();
