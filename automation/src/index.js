import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Parser from "rss-parser";

import { connectDb, alreadyExists, recentTopicExists } from "./db.js";
import { isGta6Related, isPromo } from "./filter.js";
import { extractImage, downloadImageAsDataUri } from "./image.js";
import { rewriteLeak } from "./llm.js";
import { slugify } from "./slugify.js";
import { normalizeCredibility } from "./credibility.js";

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

  // Gemini's free tier allows ~5 requests/minute, so a backlog of new stories
  // can keep one run busy for hours. Bound each run by both story count and
  // wall-clock time so it always finishes (the rest are picked up next run)
  // and the site still gets rebuilt and deployed on schedule.
  const startedAt = Date.now();
  const maxItems = Number(process.env.MAX_ITEMS_PER_RUN ?? 10);
  const maxRuntimeMs = Number(process.env.MAX_RUNTIME_MINUTES ?? 25) * 60_000;
  let attempted = 0;

  try {
    feedLoop: for (const feed of feeds) {
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

        if (attempted >= maxItems || Date.now() - startedAt > maxRuntimeMs) {
          console.log(`Work budget reached (${attempted} stories, ${Math.round((Date.now() - startedAt) / 60000)} min); remaining stories wait for the next run.`);
          break feedLoop;
        }
        attempted += 1;

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
        // Downloaded and re-encoded, not hotlinked — see downloadImageAsDataUri's
        // own comment for why. Stored on the leak document itself (Mongo, not a
        // separate file host) so the built page can embed it directly.
        const image = await downloadImageAsDataUri(extractImage(item));
        const leak = {
          slug: slugify(item.title, publishedAt),
          title: item.title,
          summary: rewritten.summary,
          credibility: normalizeCredibility(rewritten.credibility, item),
          tags: rewritten.tags,
          image,
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
