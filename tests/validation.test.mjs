import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { classifyQuestion, parseInsightOutput, validateSummaryOutput } =
  await loadTypeScriptModule('src/domain/validation.ts');

test('Extractor validation accepts only valid structured insights', () => {
  const result = parseInsightOutput(JSON.stringify([
    { type: 'decision', content: 'Ship Friday.', confidence: 1.4 },
    { type: 'unknown', content: 'Ignore me.', confidence: 0.8 },
    { type: 'fact', content: '', confidence: 0.8 },
  ]));
  assert.deepEqual(result, [{ type: 'decision', content: 'Ship Friday.', confidence: 1 }]);
});

test('Summary validation rejects missing source fields', () => {
  assert.throws(() => validateSummaryOutput('{"title":"Only a title"}'), /title and body/);
  assert.deepEqual(
    validateSummaryOutput('```json\n{"title":"Plan","body":"Ship after review."}\n```'),
    { title: 'Plan', body: 'Ship after review.' },
  );
});

test('Question classification covers actionable categories', () => {
  assert.equal(classifyQuestion('Who is the owner and next step?'), 'follow_up');
  assert.equal(classifyQuestion('Is this deadline realistic?'), 'deadline');
  assert.equal(classifyQuestion('What risk remains?'), 'risk');
  assert.equal(classifyQuestion('Which claim contradicts the earlier note?'), 'contradiction');
});
