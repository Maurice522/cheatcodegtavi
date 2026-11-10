// Tells Bing and other IndexNow search engines that pages changed, so new
// content is crawled in minutes instead of days. Run after a deploy:
//   node scripts/indexnow.mjs
// The key file lives at public/178deb0160d7030e4db0d5f6a93ecaaf.txt (served at the site root) and proves
// we own the domain.
const HOST = "cheatcodegtavi.com";
const KEY = "178deb0160d7030e4db0d5f6a93ecaaf";

const sitemap = await (await fetch(`https://${HOST}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) throw new Error("No URLs found in the live sitemap");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: submitted ${urlList.length} URLs, response ${res.status}`);
if (res.status >= 400) process.exitCode = 1;
