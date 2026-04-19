import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import walletProfilerModule from '../../src/tools/wallet-profiler.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<any>;

function extractHandler(): ToolHandler {
    let captured: ToolHandler | null = null;
    const mockServer = {
        tool: (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
            captured = handler;
        }
    } as unknown as McpServer;
    walletProfilerModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('wallet-profiler tool', () => {
    afterEach(() => { 
        setNansenMock(null); 
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(walletProfilerModule.type, 'tool');
        assert.strictEqual(walletProfilerModule.name, 'wallet-profiler');
    });

    test('executes success path with balance and PnL', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) return { success: true, data: { bal: 100 } };
            if (cmd.includes('pnl-summary')) return { success: true, data: { pnl: 50 } };
            if (cmd.includes('transactions')) return { success: true, data: { txs: [1, 2] } };
            return { success: true, data: {} };
        });

        const result = await handler({ address: '0x123', chain: 'ethereum', includePnl: true, includeHistory: true });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.balance.bal, 100);
        assert.strictEqual(parsed.data.pnl.pnl, 50);
        assert.strictEqual(parsed.data.history.txs.length, 2);
    });

    test('handles CLI error gracefully', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) return { success: false, error: 'fail bal' };
            if (cmd.includes('pnl-summary')) return { success: false, error: 'fail pnl' };
            return { success: true, data: {} };
        });

        const result = await handler({ address: '0x123', chain: 'ethereum', includePnl: true, includeHistory: false });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.balanceError, 'fail bal');
        assert.strictEqual(parsed.data.pnlError, 'fail pnl');
    });

    test('skips PnL and history when disabled', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: { onlyBalance: true } }));

        const result = await handler({ address: '0x456', chain: 'base', includePnl: false, includeHistory: false });
        const parsed = JSON.parse(result.content[0].text);
        assert.ok(parsed.data.balance);
        assert.strictEqual(parsed.data.pnl, undefined);
        assert.strictEqual(parsed.data.history, undefined);
    });
});
