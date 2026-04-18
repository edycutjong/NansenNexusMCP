import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import walletProfilerModule from '../../src/tools/wallet-profiler.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('wallet-profiler tool', () => {
    afterEach(() => { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNansenMock(null as any); 
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        walletProfilerModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { success: true, data: { bal: 100 } };
            if (cmd.includes('pnl-summary')) return { success: true, data: { pnl: 50 } };
            return { success: false };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum', includePnl: true, includeHistory: true });

        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.balance.bal, 100);
        assert.strictEqual(parsed.data.pnl.pnl, 50);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        walletProfilerModule.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { success: false, error: 'fail bal' };
            if (cmd.includes('pnl-summary')) return { success: false, error: 'fail pnl' };
            return { success: true };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum', includePnl: true });
        
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.balanceError, 'fail bal');
        assert.strictEqual(parsed.data.pnlError, 'fail pnl');
    });
});
