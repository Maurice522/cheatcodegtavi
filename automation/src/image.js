const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB — plenty for an article thumbnail, keeps Mongo docs small
const FETCH_TIMEOUT_MS = 10_000;

// Downloads the source image and re-encodes it as a data: URI so the built
// page embeds it directly rather than hotlinking a third-party CDN (IGN,
// GamesRadar, etc.) — no rights to those images, and hotlinking is a common
// AdSense rejection reason. Never throws: a failed/oversized/non-image fetch
// just means the leak publishes without an image, same as before this existed.
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
    if (contentLength > MAX_IMAGE_BYTES) {
      console.warn(`Skipping oversized image (${contentLength} bytes): ${url}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      console.warn(`Skipping oversized image (${buffer.byteLength} bytes after download): ${url}`);
      return null;
    }

    return `data:${contentType};base64,${buffer.toString("base64")}`;
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
