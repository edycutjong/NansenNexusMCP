import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { handler } from '../../src/tools/smart-money-copy-trade.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';

describe('smart-money-copy-trade tool', () => {
    afterEach(() => {
         
        setNansenMock(null);
    });

    test('handles data fetch failure', async () => {
        setNansenMock(async () => ({ success: false, error: 'API Error' }));
        const res = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        assert.ok(res.includes('Failed to fetch smart money dex trades'));
    });

    test('returns mock data when empty array returned', async () => {
        setNansenMock(async () => ({ success: true, data: { trades: [] } }));
        const resJson = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const res = JSON.parse(resJson);
        assert.strictEqual(res.status, 'mock');
        assert.strictEqual(res.suggestions.length, 2);
    });

    test('identifies strong buy and buy signals properly ignoring stables', async () => {
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

        const resJson = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const res = JSON.parse(resJson);
        
        assert.strictEqual(res.actionableTrades.length, 2);
        
        // Sorted by volume descendant
        assert.strictEqual(res.actionableTrades[0].token, 'XYZ');
        assert.strictEqual(res.actionableTrades[0].signal, 'STRONG BUY');
        assert.strictEqual(res.actionableTrades[1].token, 'ABC');
        assert.strictEqual(res.actionableTrades[1].signal, 'BUY');
        assert.strictEqual(res.actionableTrades[1].smartMoneyBuyers, 2);
    });

    test('identifies no high-conviction trades', async () => {
        setNansenMock(async () => ({ success: true, data: {
            trades: [
                { amountUsd: 60000, tokenSymbol: 'LONE', side: 'buy' }
            ]
        }}));

        const resJson = await handler({ chain: 'ethereum', minTradeUsd: 50000 });
        const res = JSON.parse(resJson);
        assert.strictEqual(res.actionableTrades, 'No high-conviction trades detected in the current window.');
    });
});
