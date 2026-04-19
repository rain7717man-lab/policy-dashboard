const Parser = require('rss-parser');
const parser = new Parser();

const BLACKLIST_KEYWORDS = ["동정", "인사", "위촉", "표창", "간담회", "방문", "장관", "차관", "국무총리", "총리", "대통령", "기념식", "개최", "참석", "MOU", "업무협약", "발족"];

async function test_korea_filtering() {
    try {
        const res = await fetch('https://www.korea.kr/rss/pressrelease.xml');
        const xml = await res.text();
        const feed = await parser.parseString(xml);
        
        console.log(`Total original items: ${feed.items.length}`);
        
        const filtered = feed.items.filter(item => {
            const isBlocked = BLACKLIST_KEYWORDS.some(kw => item.title.includes(kw));
            return !isBlocked;
        });
        
        console.log(`Items after blacklist filtering: ${filtered.length}`);
        
        if (filtered.length > 0) {
            console.log("Sample title:", filtered[0].title);
        }
    } catch (e) {
        console.error(e);
    }
}

test_korea_filtering();
