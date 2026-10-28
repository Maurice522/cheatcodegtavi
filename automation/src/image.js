import sharp from "sharp";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // refuse to even process absurd source files
const MAX_OUTPUT_BYTES = 500 * 1024; // what we actually store/serve per image
const FETCH_TIMEOUT_MS = 10_000;

// Resize + re-encode as WebP so a thumbnail never costs visitors (or the
// Cloudflare 25 MiB per-asset limit) more than a few hundred KB. Tries a
// progressively smaller render until it fits MAX_OUTPUT_BYTES; null if none do.
export async function compressToDataUri(buffer) {
  for (const [width, quality] of [[1200, 78], [1000, 65], [800, 50]]) {
    const out = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (out.byteLength <= MAX_OUTPUT_BYTES) {
      return `data:image/webp;base64,${out.toString("base64")}`;
    }
  }
  return null;
}

// Downloads the source image and re-encodes it as a small data: URI (the
// site build splits these out into static files) rather than hotlinking a
// third-party CDN (IGN, GamesRadar, etc.) — no rights to those images, and
// hotlinking is a common AdSense rejection reason. Never throws: a
// failed/oversized/non-image fetch just means the leak publishes without an
// image, same as before this existed.
export async function downloadImageAsDataUri(url) {
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`Image fetch failed (${res.status}): ${url}`);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      console.warn(`Skipping non-image content-type "${contentType}": ${url}`);
      return null;
    }

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SOURCE_BYTES) {
      console.warn(`Skipping oversized image (${contentLength} bytes): ${url}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_SOURCE_BYTES) {
      console.warn(`Skipping oversized image (${buffer.byteLength} bytes after download): ${url}`);
      return null;
    }

    const dataUri = await compressToDataUri(buffer);
    if (!dataUri) console.warn(`Could not compress under ${MAX_OUTPUT_BYTES} bytes: ${url}`);
    return dataUri;
  } catch (err) {
    console.warn(`Image download failed for ${url}: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;

  const media = item["media:content"];
  if (media) {
    const first = Array.isArray(media) ? media[0] : media;
    if (first?.$?.url) return first.$.url;
  }

  const thumbnail = item["media:thumbnail"];
  if (thumbnail) {
    const first = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;
    if (first?.$?.url) return first.$.url;
  }

  const html = item.content ?? item["content:encoded"] ?? "";
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (match) return match[1];

  return null;
}
