export interface RankableEvidence {
  id: string;
  content: string;
  confidence: number;
  createdAt: number;
}

const stopWords = new Set([
  'the', 'and', 'that', 'what', 'when', 'where', 'with', 'from', 'this', 'were',
  'was', 'are', 'is', 'did', 'does', 'have', 'has',
]);

export function tokenize(value: string): string[] {
  return [...new Set(
    (value.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter((token) => !stopWords.has(token)),
  )];
}

export function rankEvidence<T extends RankableEvidence>(query: string, items: T[]): Array<T & { score: number }> {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  return items
    .map((item) => {
      const contentTokens = new Set(tokenize(item.content));
      const overlap = queryTokens.filter((token) => contentTokens.has(token)).length;
      const coverage = overlap / queryTokens.length;
      return {
        ...item,
        score: overlap === 0 ? 0 : coverage * 0.75 + item.confidence * 0.25,
      };
    })
    .filter((item) => item.score >= 0.2)
    .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
}

export function retrievalQuality(scores: number[]): number {
  if (!scores.length) return 0;
  const top = scores.slice(0, 5);
  return Math.min(1, top.reduce((sum, score) => sum + score, 0) / top.length);
}
