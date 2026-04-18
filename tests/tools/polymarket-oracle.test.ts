import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import polymarketOracleModule from '../../src/tools/polymarket-oracle.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('polymarket-oracle tool', () => {
    afterEach(() => {
         
        setNansenMock(null);
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; }
        } as unknown as McpServer;

        polymarketOracleModule.register(mockServer);
        
        setNansenMock(async (cmd) => {
            if (cmd.includes('market-screener')) return { success: true, data: { odds: 50 } };
            if (cmd.includes('top-holders')) return { success: true, data: { holders: [] } };
            return { success: true };
        });
        
        const result = await toolCb!({ marketId: '123', includeHolders: true });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.marketInfo.odds, 50);
        assert.ok(parsed.data.holders);
    });

    test('handles lack of includeHolders and CLI errors', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; }
        } as unknown as McpServer;

        polymarketOracleModule.register(mockServer);
        
        setNansenMock(async (cmd) => {
            if (cmd.includes('market-screener')) return { success: false, error: 'fail 1' };
            return { success: true };
        });
        
        const result = await toolCb!({ marketId: '123', includeHolders: false });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.marketInfo, 'fail 1');
        assert.strictEqual(parsed.data.holders, undefined);
    });
});
