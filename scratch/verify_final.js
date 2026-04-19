const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

async function test_korea_rss() {
  console.log("Testing Korea.kr RSS...");
  try {
    const res = await fetch('https://www.korea.kr/rss/pressrelease.xml', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const xml = await res.text();
    const feed = await parser.parseString(xml);
    console.log("Korea.kr found:", feed.items.length, "items");
  } catch (e) {
    console.error("Korea.kr failed:", e.message);
  }
}

async function test_kstartup_crawl() {
  console.log("\nTesting K-Startup Crawl...");
  try {
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const count = $('.pbanc_list li').length;
    console.log("K-Startup found:", count, "items");
  } catch (e) {
    console.error("K-Startup failed:", e.message);
  }
}

async function test_bizinfo_crawl() {
  console.log("\nTesting Bizinfo Crawl...");
  try {
    const res = await fetch('https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/210/list.do', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const count = $('.table_style01 tbody tr').length;
    console.log("Bizinfo found:", count, "items");
  } catch (e) {
    console.error("Bizinfo failed:", e.message);
  }
}

async function run() {
  await test_korea_rss();
  await test_kstartup_crawl();
  await test_bizinfo_crawl();
}

run();
