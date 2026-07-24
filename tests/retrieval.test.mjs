import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { rankEvidence, retrievalQuality, tokenize } =
  await loadTypeScriptModule('src/domain/retrieval.ts');

const evidence = [
  { id: 'a', content: 'The client proposal is due Friday.', confidence: 0.9, createdAt: 1 },
  { id: 'b', content: 'Team lunch is on Tuesday.', confidence: 0.95, createdAt: 2 },
  { id: 'c', content: 'Review the proposal budget.', confidence: 0.7, createdAt: 3 },
];

test('Retrieval ranks lexical evidence and excludes unsupported records', () => {
  const ranked = rankEvidence('When is the proposal due?', evidence);
  assert.equal(ranked[0].id, 'a');
  assert.equal(ranked.some((item) => item.id === 'b'), false);
});

test('Retrieval reports no quality without evidence', () => {
  assert.deepEqual(tokenize('the and that'), []);
  assert.equal(retrievalQuality([]), 0);
  assert.ok(retrievalQuality([0.8, 0.6]) > 0.6);
});
