// digital-drama-blog's pipeline (automation/src/llm.js there) targets
// gemini-2.5-flash, but that model returns 404 "no longer available to new
// users" on this project's API key — Google's own error points new callers
// at gemini-3.6-flash instead, confirmed working against this key live.
const GEMINI_MODEL = "gemini-3.6-flash";

const SYSTEM_PROMPT = `You write for a GTA6 (Grand Theft Auto VI) news and leaks tracker.
Given a news article, respond with ONLY a JSON object with these fields:
- "summary": 2-3 sentences, in your own original words, stating what the article reports about GTA6. Do not closely mirror the source's phrasing. Do not invent details that aren't in the source.
- "credibility": one of "official" (a direct Rockstar/Take-Two statement), "confirmed" (widely corroborated by multiple reputable outlets, or directly shown in official trailers/marketing), or "rumor" (a single-source claim, leak, or datamine not yet corroborated elsewhere). Default to "rumor" when unsure.
- "tags": an array of 1-4 short lowercase kebab-case tags (e.g. "map", "characters", "release-date", "gameplay", "leak").
Never state a rumored or leaked claim as settled fact — use "reportedly"/"allegedly" language in the summary whenever credibility is not "official".`;

// Free-tier gemini-3.6-flash is capped at 5 requests/minute per project, well
// below the ~10-15 RPM PLAN.md assumed for the old model — a single pipeline
// run across 9 feeds routinely finds more than 5 relevant items, so a 429
// here is expected, not exceptional. Retry using the server's own
// RetryInfo.retryDelay rather than a guessed backoff. 503 ("model
// experiencing high demand") is separate — transient and carries no
// RetryInfo, so it falls back to a flat delay.
async function generateContent(apiKey, body, attempt = 1) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
  );

  if ((response.status === 429 || response.status === 503) && attempt <= 4) {
    const errorBody = await response.json().catch(() => null);
    const retryInfo = errorBody?.error?.details?.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
    );
    const retrySeconds = retryInfo ? parseFloat(retryInfo.retryDelay) : 10;
    const waitMs = Math.ceil((retrySeconds || 10) * 1000) + 500;
    const reason = response.status === 429 ? "Rate limited" : "Model overloaded (503)";
    console.log(`${reason}, retrying in ${waitMs}ms (attempt ${attempt})...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return generateContent(apiKey, body, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function rewriteLeak(item, apiKey) {
  const userPrompt = `Title: ${item.title}\n\nSource content:\n${item.contentSnippet ?? item.content ?? ""}`;

  const data = await generateContent(apiKey, {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1000 },
  });
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonText = text.replace(/^```json\s*|```$/g, "").trim();

  const parsed = JSON.parse(jsonText);
  const credibility = ["official", "confirmed", "rumor"].includes(parsed.credibility)
    ? parsed.credibility
    : "rumor";

  return {
    summary: parsed.summary,
    credibility,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}
