import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Parser from "rss-parser";

import { connectDb, alreadyExists, recentTopicExists } from "./db.js";
import { isGta6Related, isPromo } from "./filter.js";
import { extractImage } from "./image.js";
import { rewriteLeak } from "./llm.js";
import { slugify } from "./slugify.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MONGODB_URI = process.env.MONGODB_URI;
const LLM_API_KEY = process.env.LLM_API_KEY;
const DEPLOY_HOOK_URL = process.env.DEPLOY_HOOK_URL;

if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
if (!LLM_API_KEY) throw new Error("LLM_API_KEY is not set");

const { feeds, keywords } = JSON.parse(readFileSync(join(__dirname, "..", "sources.json"), "utf-8"));

async function main() {
  const parser = new Parser({
    customFields: { item: ["media:content", "media:thumbnail"] },
  });
  const { client, leaks } = await connectDb(MONGODB_URI);
  let addedCount = 0;

  try {
    for (const feed of feeds) {
      console.log(`Fetching ${feed.name}...`);
      let parsedFeed;
      try {
        parsedFeed = await parser.parseURL(feed.url);
      } catch (err) {
        console.error(`Failed to fetch ${feed.name}: ${err.message}`);
        continue;
      }

      for (const item of parsedFeed.items) {
        const sourceUrl = item.link;
        if (!sourceUrl) continue;

        if (await alreadyExists(leaks, sourceUrl)) continue;

        if (!isGta6Related(item, keywords)) continue;

        if (isPromo(item)) {
          console.log(`Skipping promo/deal post: ${item.title}`);
          continue;
        }

        console.log(`Relevant: ${item.title}`);

        let rewritten;
        try {
          rewritten = await rewriteLeak(item, LLM_API_KEY);
        } catch (err) {
          console.error(`LLM rewrite failed for "${item.title}": ${err.message}`);
          continue;
        }

        if (await recentTopicExists(leaks, rewritten.tags)) {
          console.log(`Skipping, topic covered in the last 2 hours: ${item.title} [${rewritten.tags.join(", ")}]`);
          continue;
        }

        const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
        const leak = {
          slug: slugify(item.title, publishedAt),
          title: item.title,
          summary: rewritten.summary,
          credibility: rewritten.credibility,
          tags: rewritten.tags,
          image: extractImage(item),
          sourceUrl,
          sourceName: feed.name,
          sourceLinks: [{ title: feed.name, url: sourceUrl }],
          publishedAt,
          createdAt: new Date().toISOString(),
        };

        try {
          await leaks.insertOne(leak);
          addedCount += 1;
          console.log(`Saved: ${leak.slug}`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`Duplicate, skipping: ${leak.slug}`);
          } else {
            throw err;
          }
        }
      }
    }
  } finally {
    await client.close();
  }

  console.log(`Done. ${addedCount} new leak(s) added.`);

  if (addedCount > 0 && DEPLOY_HOOK_URL) {
    console.log("Triggering deploy hook...");
    const res = await fetch(DEPLOY_HOOK_URL, { method: "POST" });
    console.log(`Deploy hook responded with ${res.status}`);
  } else if (addedCount > 0) {
    console.log("DEPLOY_HOOK_URL not set, skipping rebuild trigger.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
