import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import smartMoneyCopyTradeModule from '../../src/tools/smart-money-copy-trade.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<any>;

function extractHandler(): ToolHandler {
    let captured: ToolHandler | null = null;
    const mockServer = {
        tool: (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
            captured = handler;
        }
    } as unknown as McpServer;
    smartMoneyCopyTradeModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('smart-money-copy-trade tool', () => {
    afterEach(() => {
        setNansenMock(null);
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(smartMoneyCopyTradeModule.type, 'tool');
        assert.strictEqual(smartMoneyCopyTradeModule.name, 'smart-money-copy-trade');
        assert.ok(smartMoneyCopyTradeModule.description);
    });

    test('handles data fetch failure', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: false, error: 'API Error' }));
        const res = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        assert.strictEqual(res.isError, true);
        assert.ok(res.content[0].text.includes('Failed to fetch smart money dex trades'));
    });

    test('returns mock data when empty array returned', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: { trades: [] } }));
        const res = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const parsed = JSON.parse(res.content[0].text);
        assert.strictEqual(parsed.status, 'mock');
        assert.strictEqual(parsed.suggestions.length, 2);
    });

    test('identifies strong buy and buy signals properly ignoring stables', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: {
            trades: [
                { amountUsd: 60000, tokenSymbol: 'ABC', side: 'buy' },
                { amountUsd: 55000, tokenSymbol: 'ABC', side: 'buy' }, // 2 buys -> BUY
                { amountUsd: 300000, tokenSymbol: 'XYZ', side: 'buy' },
                { amountUsd: 300000, tokenSymbol: 'XYZ', side: 'buy' }, // 2 buys, > 500k volume -> STRONG BUY
                { amountUsd: 60000, tokenSymbol: 'USDC', side: 'buy' }, // Stablecoin filtered
                { amountUsd: 60000, tokenSymbol: 'DAI', side: 'buy' }, // Stablecoin filtered
                { amountUsd: 60000, tokenSymbol: 'ABC', side: 'sell' },
                { amountUsd: 1000, tokenSymbol: 'XYZ', side: 'buy' }, // Below threshold
                { amountUsd: 100000, tokenSymbol: 'LONE', side: 'buy' } // Only 1 buy -> Filtered out
            ]
        }}));

        const res = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const parsed = JSON.parse(res.content[0].text);
        
        assert.strictEqual(parsed.actionableTrades.length, 2);
        
        // Sorted by volume descendant
        assert.strictEqual(parsed.actionableTrades[0].token, 'XYZ');
        assert.strictEqual(parsed.actionableTrades[0].signal, 'STRONG BUY');
        assert.strictEqual(parsed.actionableTrades[1].token, 'ABC');
        assert.strictEqual(parsed.actionableTrades[1].signal, 'BUY');
        assert.strictEqual(parsed.actionableTrades[1].smartMoneyBuyers, 2);
    });

    test('identifies no high-conviction trades', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: {
            trades: [
                { amountUsd: 60000, tokenSymbol: 'LONE', side: 'buy' }
            ]
        }}));

        const res = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const parsed = JSON.parse(res.content[0].text);
        assert.strictEqual(parsed.actionableTrades, 'No high-conviction trades detected in the current window.');
    });
});
