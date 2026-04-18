import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import wyckoffScreenerModule from '../../src/tools/wyckoff-screener.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('wyckoff-screener tool', () => {
    afterEach(() => { 
         
        setNansenMock(null); 
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        wyckoffScreenerModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('flow-intelligence')) return { success: true, data: { param: 1 } };
            if (cmd.includes('token info')) return { success: true, data: { param: 2 } };
            return { success: true };
        });

        const result = await toolCb!({ tokenAddress: '0xabc', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.flowIntelligence.param, 1);
        assert.strictEqual(parsed.data.technicals.param, 2);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        wyckoffScreenerModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('flow-intelligence')) return { success: false, error: 'fail 1' };
            if (cmd.includes('token info')) return { success: false, error: 'fail 2' };
            return { success: true };
        });

        const result = await toolCb!({ tokenAddress: '0xabc', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.flowIntelligence, 'fail 1');
        assert.strictEqual(parsed.data.technicals, 'fail 2');
    });
});
