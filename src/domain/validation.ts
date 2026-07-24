import type { Insight } from '../agents/types';
import type { OpenLoop } from './models';

const insightTypes = new Set<Insight['type']>([
  'fact', 'decision', 'action', 'entity', 'deadline', 'open_loop',
]);

export interface ParsedInsight {
  type: Insight['type'];
  content: string;
  confidence: number;
}

export function parseInsightOutput(raw: string): ParsedInsight[] {
  const parsed: unknown = JSON.parse(raw.replace(/```json|```/g, '').trim());
  if (!Array.isArray(parsed)) throw new Error('Insight output must be an array.');
  return parsed.slice(0, 5).flatMap((item): ParsedInsight[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    const type = typeof candidate.type === 'string' && insightTypes.has(candidate.type as Insight['type'])
      ? candidate.type as Insight['type']
      : null;
    const content = typeof candidate.content === 'string' ? candidate.content.trim().slice(0, 200) : '';
    const confidence = Number(candidate.confidence);
    if (!type || !content || !Number.isFinite(confidence)) return [];
    return [{ type, content, confidence: Math.min(1, Math.max(0.5, confidence)) }];
  });
}

export function validateSummaryOutput(raw: string): { title: string; body: string } {
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as Record<string, unknown>;
  if (typeof parsed.title !== 'string' || typeof parsed.body !== 'string') {
    throw new Error('Summary requires title and body.');
  }
  const title = parsed.title.trim().slice(0, 80);
  const body = parsed.body.trim().slice(0, 1_200);
  if (!title || !body) throw new Error('Summary fields cannot be empty.');
  return { title, body };
}

export function classifyQuestion(question: string): OpenLoop['category'] {
  const value = question.toLowerCase();
  if (value.includes('deadline') || value.includes('by when')) return 'deadline';
  if (value.includes('risk')) return 'risk';
  if (value.includes('contradict')) return 'contradiction';
  if (value.includes('decision') || value.includes('yes/no')) return 'decision';
  if (value.includes('owner') || value.includes('next step')) return 'follow_up';
  if (value.includes('missing') || value.includes('what information')) return 'missing_information';
  if (value.includes('uncertain') || value.includes('realistic')) return 'uncertainty';
  if (value.includes('commit')) return 'commitment';
  return 'question';
}
