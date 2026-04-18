import { test, describe } from 'node:test';
import assert from 'node:assert';
import { boot } from '../../src/server/boot.js';

describe('server boot module tests', () => {
    test('boot executes with stdio gracefully', async () => {
        // We capture any uncaught output
        try {
            const result = await boot('stdio');
            assert.ok(true, 'Boot process completed without throwing');
            assert.strictEqual(result.mode, 'stdio');
            await result.transport.close();
            await result.server.close();
        } catch (e) {
            assert.fail('Boot threw an error: ' + String(e));
        }
    });

    test('boot executes with http gracefully', async () => {
        try {
            const result = await boot('http');
            assert.ok(true, 'Boot process completed without throwing');
            assert.strictEqual(result.mode, 'http');
            await result.transport.close();
            await result.server.close();
            
            // To prevent open handles stopping node:test from finishing
            await new Promise((resolve) => result.httpServer.close(resolve));
        } catch (e) {
            assert.fail('Boot threw an error: ' + String(e));
        }
    });
});
