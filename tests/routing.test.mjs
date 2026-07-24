import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { decideAgents } = await loadTypeScriptModule('src/domain/routing.ts');

test('Router activates Listener only while quiet capture is active', () => {
  assert.deepEqual(decideAgents({
    isListening: true,
    transcriptLength: 0,
    insightCount: 0,
    hasUserQuery: false,
  }), ['listener']);
});

test('Router orders transcript pipeline and removes duplicate Archivist', () => {
  assert.deepEqual(decideAgents({
    isListening: false,
    transcriptLength: 80,
    insightCount: 2,
    hasUserQuery: false,
  }), ['extractor', 'weaver', 'visualizer', 'archivist']);
});

test('Router schedules summary and questions at five-insight boundaries', () => {
  assert.deepEqual(decideAgents({
    isListening: false,
    transcriptLength: 0,
    insightCount: 5,
    hasUserQuery: true,
  }), ['retriever', 'summarizer', 'questioner', 'archivist']);
});
