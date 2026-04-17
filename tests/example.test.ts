import { test } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';

test('Basic math test to ensure framework runs', () => {
    assert.strictEqual(1 + 1, 2);
});

test('Environment verification', () => {
    // Assert that we are running on Node.js v20+ as required by engines
    assert.ok(process.version.startsWith('v2'), 'Should be running on Node.js v20+');
});

test('Module system verification', () => {
    const __filename = fileURLToPath(import.meta.url);
    
    
    // Assert that we are properly in ESM mode and paths resolve
    assert.ok(__filename.includes('tests/example.test.ts'), 'Filename path should be correctly resolved');
});
