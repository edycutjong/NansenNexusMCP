import { test } from 'node:test';
import assert from 'node:assert';

test('server boot module loads', async () => {
    // Just testing that the module loads without error
    const { boot } = await import('../../src/server/boot.js');
    assert.ok(typeof boot === 'function');
});
