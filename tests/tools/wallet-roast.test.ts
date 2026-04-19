import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import walletRoastModule from '../../src/tools/wallet-roast.js';
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
    walletRoastModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('wallet-roast tool', () => {
    afterEach(() => { 
        setNansenMock(null); 
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(walletRoastModule.type, 'tool');
        assert.strictEqual(walletRoastModule.name, 'wallet-roast');
    });

    test('registers successfully and executes success path', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('pnl-summary')) return { success: true, data: { parsed: true } };
            if (cmd.includes('transactions')) return { success: true, data: { txs: true } };
            return { success: true, data: {} };
        });

        const result = await handler({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.pnlData.parsed, true);
        assert.strictEqual(parsed.data.txHistory.txs, true);
    });

    test('handles CLI error gracefully', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('pnl-summary')) return { success: false, error: 'fail pnl' };
            if (cmd.includes('transactions')) return { success: false, error: 'fail tx' };
            return { success: true, data: {} };
        });

        const result = await handler({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.pnlData, 'fail pnl');
        assert.strictEqual(parsed.data.txHistory, 'fail tx');
    });
});
