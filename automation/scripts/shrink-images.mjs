// One-time cleanup: leaks saved before image compression existed hold their
// original (sometimes 1 MB+) images as data URIs. Re-encode any over the
// threshold using the same compressToDataUri the pipeline now uses.
//
// Usage: node scripts/shrink-images.mjs   (run from automation/)
import "dotenv/config";
import { connectDb } from "../src/db.js";
import { compressToDataUri } from "../src/image.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

const THRESHOLD_BYTES = 300 * 1024;

async function main() {
  const { client, leaks } = await connectDb(MONGODB_URI);
  try {
    const cursor = leaks.find({ image: { $regex: "^data:" } });
    let shrunk = 0;
    let skipped = 0;
    let savedBytes = 0;

    for await (const leak of cursor) {
      const match = leak.image.match(/^data:[^;,]+;base64,(.+)$/s);
      if (!match) continue;
      const original = Buffer.from(match[1], "base64");
      if (original.byteLength <= THRESHOLD_BYTES) {
        skipped += 1;
        continue;
      }

      const dataUri = await compressToDataUri(original);
      if (!dataUri) {
        console.log(`Could not compress, leaving as-is: ${leak.slug}`);
        continue;
      }
      const newBytes = Buffer.from(dataUri.split(",")[1], "base64").byteLength;
      await leaks.updateOne({ _id: leak._id }, { $set: { image: dataUri } });
      shrunk += 1;
      savedBytes += original.byteLength - newBytes;
      console.log(`${leak.slug}: ${Math.round(original.byteLength / 1024)}KB -> ${Math.round(newBytes / 1024)}KB`);
    }

    console.log(`Done. ${shrunk} shrunk (saved ${Math.round(savedBytes / 1024)}KB), ${skipped} already small.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
