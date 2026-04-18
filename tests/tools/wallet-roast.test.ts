import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import walletRoastModule from '../../src/tools/wallet-roast.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('wallet-roast tool', () => {
    afterEach(() => { 
         
        setNansenMock(null); 
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        walletRoastModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('pnl-summary')) return { success: true, data: { parsed: true } };
            if (cmd.includes('transactions')) return { success: true, data: { txs: true } };
            return { success: true };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.pnlData.parsed, true);
        assert.strictEqual(parsed.data.txHistory.txs, true);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        walletRoastModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('pnl-summary')) return { success: false, error: 'fail pnl' };
            if (cmd.includes('transactions')) return { success: false, error: 'fail tx' };
            return { success: true };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.pnlData, 'fail pnl');
        assert.strictEqual(parsed.data.txHistory, 'fail tx');
    });
});
