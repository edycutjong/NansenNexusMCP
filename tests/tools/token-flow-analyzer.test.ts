import { test } from 'node:test';
import assert from 'node:assert';
import tokenFlowModule from '../../src/tools/token-flow-analyzer.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

test('token-flow-analyzer registers successfully and callback executes', async () => {
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

    tokenFlowModule.register(mockServer);

    assert.strictEqual(toolName, 'token-flow-analyzer');
    assert.ok(toolSchema);
    assert.ok(toolCb);

    const result = await toolCb!({
        token: '0x123',
        chain: 'ethereum',
        flowType: 'cex_flows',
        timeframe: '24h'
    });

    assert.ok(result);
    assert.strictEqual(result.content[0].type, 'text');
    assert.ok(result.content[0].text.includes('"live"'));
});
