import { test } from 'node:test';
import assert from 'node:assert';
import smartMoneyModule from '../../src/tools/smart-money-tracker.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

test('smart-money-tracker registers successfully and callback executes', async () => {
    let toolName = '';
    let toolCb: Function | null = null;
    let toolSchema: any = null;

    const mockServer = {
        tool: (name: string, description: string, schema: any, callback: Function) => {
            toolName = name;
            toolSchema = schema;
            toolCb = callback;
        }
    } as unknown as McpServer;

    smartMoneyModule.register(mockServer);

    assert.strictEqual(toolName, 'smart-money-tracker');
    assert.ok(toolSchema);
    assert.ok(toolCb);

    // Provide values that match default validation schema expectations
    const result = await toolCb!({
        chain: 'ethereum',
        timeframe: '24h',
        entityType: 'smart_money',
        limit: 20
    });

    assert.ok(result);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('"live"'));
});
