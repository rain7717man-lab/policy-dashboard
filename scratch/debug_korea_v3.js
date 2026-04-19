const Parser = require('rss-parser');
const parser = new Parser();

async function debug() {
    console.log("Starting debug...");
    try {
        const url = 'https://www.korea.kr/rss/pressrelease.xml';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Size:", text.length);
        
        if (text.length > 500) {
            const feed = await parser.parseString(text);
            console.log("Parsed items:", feed.items.length);
        } else {
            console.log("Response too short, likely blocked.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
