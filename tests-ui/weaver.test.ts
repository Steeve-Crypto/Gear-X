import { weaverAgent } from '../src/agents/weaver';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';

jest.mock('../src/repositories/knowledgeRepository', () => ({
  knowledgeRepository: { saveThread: jest.fn().mockResolvedValue('thread_type_decision') },
}));

const insight = (id: string) => ({
  id,
  type: 'decision' as const,
  content: `Decision ${id}`,
  sourceTimestamp: 1,
  confidence: 0.9,
  linkedInsightIds: [],
  createdAt: 1,
});

describe('Weaver agent', () => {
  test('creates normalized links with rationale instead of concatenated prose', async () => {
    const result = await weaverAgent.run({
      recentTranscript: '',
      currentInsights: [insight('one'), insight('two')],
      isListening: false,
    });
    expect(result.success).toBe(true);
    expect(knowledgeRepository.saveThread).toHaveBeenCalledWith(expect.objectContaining({
      links: [
        expect.objectContaining({ insightId: 'one', relationship: 'shared_classification' }),
        expect.objectContaining({ insightId: 'two', relationship: 'shared_classification' }),
      ],
    }));
    expect(result.data?.threadCount).toBe(1);
  });
});
