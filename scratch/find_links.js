const cheerio = require('cheerio');
const fs = require('fs');

async function find_links() {
  const html = fs.readFileSync('scratch/korea_full.html', 'utf8');
  const $ = cheerio.load(html);
  
  const links = $('a[href*="pressReleaseView.do"]');
  console.log('Press release links found:', links.length);
  
  if (links.length > 0) {
    const first = links.first();
    console.log('Link:', first.attr('href'));
    console.log('Parent HTML (snippet):', first.parent().html().substring(0, 200));
  }
}

find_links();
