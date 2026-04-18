import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import smartMoneyModule from '../../src/tools/smart-money-tracker.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('smart-money-tracker tool', () => {
    afterEach(() => { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNansenMock(null as any); 
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        smartMoneyModule.register(mockServer);

        setNansenMock(async () => ({ success: true, data: { test: true } }));

        const result = await toolCb!({
            chain: 'ethereum',
            timeframe: '24h',
            entityType: 'smart_money',
            limit: 20
        });

        assert.ok(result);
        assert.strictEqual(result.content[0].type, 'text');
        assert.ok(result.content[0].text.includes('"live"'));
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.test, true);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        smartMoneyModule.register(mockServer);

        setNansenMock(async () => ({ success: false, error: 'API died' }));

        const result = await toolCb!({ chain: 'ethereum', timeframe: '24h', entityType: 'smart_money', limit: 20 });
        
        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('API died'));
    });
});
