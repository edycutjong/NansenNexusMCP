import { test } from 'node:test';
import assert from 'node:assert';
import walletProfilerModule from '../../src/tools/wallet-profiler.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

test('wallet-profiler registers successfully and callback executes', async () => {
    let toolName = '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let toolCb: Function | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let toolSchema: any = null;

    const mockServer = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
        tool: (name: string, description: string, schema: any, callback: Function) => {
            toolName = name;
            toolSchema = schema;
            toolCb = callback;
        }
    } as unknown as McpServer;

    walletProfilerModule.register(mockServer);

    assert.strictEqual(toolName, 'wallet-profiler');
    assert.ok(toolSchema);
    assert.ok(toolCb);

    const result = await toolCb!({
        walletAddress: '0x123',
        chain: 'ethereum'
    });

    assert.ok(result);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('"live"'));
});
