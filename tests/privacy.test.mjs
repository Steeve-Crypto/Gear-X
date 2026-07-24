import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { canUseProvider } = await loadTypeScriptModule('src/domain/privacy.ts');

test('Local providers never require remote consent', () => {
  assert.equal(canUseProvider(false, false), true);
});

test('Remote providers require explicit consent', () => {
  assert.equal(canUseProvider(true, false), false);
  assert.equal(canUseProvider(true, true), true);
});
