import { test } from 'node:test';
import assert from 'node:assert';
import { isRegisterableModule } from '../../src/registry/types.js';

test('isRegisterableModule validates valid module', () => {
  const validModule = {
    type: 'tool',
    name: 'test-tool',
    description: 'A test tool',
    register: () => {}
  };
  assert.strictEqual(isRegisterableModule(validModule), true);
});

test('isRegisterableModule handles missing register function', () => {
  const invalidModule = {
    type: 'tool',
    name: 'test-tool'
  };
  assert.strictEqual(isRegisterableModule(invalidModule), false);
});

test('isRegisterableModule handles invalid type', () => {
  const invalidModule = {
    type: 'invalid',
    name: 'test-tool',
    register: () => {}
  };
  assert.strictEqual(isRegisterableModule(invalidModule), false);
});

test('isRegisterableModule validates valid module without description', () => {
  const validModule = {
    type: 'resource',
    name: 'test-resource',
    register: () => Promise.resolve()
  };
  assert.strictEqual(isRegisterableModule(validModule), true);
});
