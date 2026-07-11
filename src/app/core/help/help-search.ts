import { HelpTopic } from './help.models';

/**
 * Normalize Arabic (and Latin) text for tolerant matching:
 * strip tashkeel, unify alef/ya/hamza/ta-marbuta forms, drop punctuation.
 */
export function normalizeAr(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // tashkeel + tatweel
    .replace(/[آأإ]/g, 'ا')  // آأإ → ا
    .replace(/ى/g, 'ي')                 // ى → ي
    .replace(/ة/g, 'ه')                 // ة → ه
    .replace(/[ؤئ]/g, 'ء')         // ؤئ → ء
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')            // punctuation → space
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(['في', 'من', 'الى', 'على', 'عن', 'ازاي', 'ازای', 'كيف', 'ايه', 'اي', 'هل', 'ما', 'اعمل', 'عايز', 'عاوز', 'اريد', 'the', 'a', 'an', 'to', 'how', 'do', 'i']);

function tokens(text: string): string[] {
  return normalizeAr(text).split(' ').filter(t => t.length > 1 && !STOP.has(t));
}

/**
 * Score how well a topic answers a query. Token overlap against the question
 * text + keywords, with a small bonus for keyword hits and phrase inclusion.
 */
function scoreTopic(queryTokens: string[], topic: HelpTopic): number {
  if (!queryTokens.length) return 0;
  const hay = new Set([
    ...tokens(topic.question),
    ...topic.keywords.flatMap(k => tokens(k)),
  ]);
  let score = 0;
  for (const qt of queryTokens) {
    if (hay.has(qt)) { score += 2; continue; }
    // partial: query token is a prefix/substring of a haystack token or vice versa
    for (const h of hay) {
      if (h.includes(qt) || qt.includes(h)) { score += 1; break; }
    }
  }
  return score / queryTokens.length;
}

/** Rank a screen's topics against a free-text query; returns matches over a threshold. */
export function searchTopics(query: string, topics: HelpTopic[], limit = 3): HelpTopic[] {
  const qt = tokens(query);
  if (!qt.length) return [];
  return topics
    .map(t => ({ t, s: scoreTopic(qt, t) }))
    .filter(x => x.s >= 0.5)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.t);
}
