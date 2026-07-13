const websiteScraper = require('website-scraper');

const scrape =
  websiteScraper.default ||
  websiteScraper.scrape ||
  websiteScraper;

console.log("website-scraper type:", typeof scrape);

scrape({
  urls: ['https://wspwvv3ia8.youware.app/'],
  directory: './public',
  recursive: true,
  maxRecursiveDepth: 2,
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'link[rel="stylesheet"]', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'source', attr: 'src' },
    { selector: 'video', attr: 'src' },
    { selector: 'audio', attr: 'src' }
  ],
  urlFilter: (url) => {
    return url.startsWith('https://wspwvv3ia8.youware.app/');
  }
}).then(() => {
  console.log('DONE: Site downloaded to public folder');
}).catch((err) => {
  console.error('SCRAPE ERROR:', err);
});
