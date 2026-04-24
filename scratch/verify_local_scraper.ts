// Test script for scrapeLocal
import { scrapeLocal } from './src/lib/scrapers/index.ts';

async function test() {
    console.log('Testing scrapeLocal...');
    try {
        const items = await scrapeLocal(10);
        console.log(`Success! Found ${items.length} items.`);
        items.slice(0, 3).forEach((item, i) => {
            console.log(`Item ${i + 1}: ${item.title} (${item.ministry}, ${item.date})`);
            console.log(`Link: ${item.link}`);
            console.log('---');
        });
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
