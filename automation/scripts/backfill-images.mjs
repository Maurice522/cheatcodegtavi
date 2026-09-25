// One-time backfill: existing leak documents were saved with a raw external
// image URL (hotlinked from IGN/GamesRadar/etc.) before downloadImageAsDataUri
// existed. This re-downloads each one and replaces it with a self-hosted data
// URI, matching what new leaks get from the pipeline going forward.
//
// Usage: node scripts/backfill-images.mjs   (run from automation/)
import "dotenv/config";
import { connectDb } from "../src/db.js";
import { downloadImageAsDataUri } from "../src/image.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

async function main() {
  const { client, leaks } = await connectDb(MONGODB_URI);
  try {
    const cursor = leaks.find({ image: { $regex: "^https?://" } });
    let updated = 0;
    let failed = 0;

    for await (const leak of cursor) {
      console.log(`Downloading image for: ${leak.slug}`);
      const dataUri = await downloadImageAsDataUri(leak.image);

      if (dataUri) {
        await leaks.updateOne({ _id: leak._id }, { $set: { image: dataUri } });
        updated += 1;
        console.log(`  -> re-hosted (${Math.round(dataUri.length / 1024)}KB base64)`);
      } else {
        // Couldn't re-download it (dead link, oversized, etc.) — drop the
        // hotlink rather than leave it pointing at a third-party domain.
        await leaks.updateOne({ _id: leak._id }, { $set: { image: null } });
        failed += 1;
        console.log(`  -> could not re-host, cleared image field`);
      }
    }

    console.log(`Done. ${updated} re-hosted, ${failed} cleared.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
