// Safety net on top of the model's credibility label. The prompt already says
// "official" means Rockstar or Take-Two said or published it, but a model can
// still tag a report as official just because it's about an official event
// (e.g. release times reverse-engineered from store listings). If the story
// calls itself unofficial in its headline or URL, it is a rumor.
export function normalizeCredibility(credibility, item) {
  const slug = (item.link ?? "").split("?")[0].split("/").filter(Boolean).pop() ?? "";
  const title = item.title ?? "";
  if (/^unofficial\b/i.test(slug) || /^unofficial\b/i.test(title)) return "rumor";
  return credibility;
}
