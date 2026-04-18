import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { handler } from '../../src/tools/airdrop-eligibility.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';

describe('airdrop-eligibility tool', () => {
    afterEach(() => {
        setNansenMock(null);
    });

    test('handles balance fetch failure', async () => {
        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { success: false, error: 'API Error' };
            return { success: true, data: {} };
        });
        const res = await handler({ address: '0x123' });
        assert.ok(res.includes('Failed to fetch balance data'));
    });

    test('calculates high multi-chain activity and high balance', async () => {
        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { 
                success: true, 
                data: { balances: [{chain: 'ethereum', usdValue: 5000}, {chain: 'base', usdValue: 5000}, {chain: 'optimism', usdValue: 100}, {chain: 'arbitrum', usdValue: 100}] } 
            };
            if (cmd.includes('counterparties')) return {
                success: true,
                data: { isSybilCluster: false }
            };
            return { success: true };
        });
        const resJson = await handler({ address: '0x123' });
        const res = JSON.parse(resJson);
        assert.strictEqual(res.tier, 'Tier 1 (High Probability)');
        assert.ok(res.reasons.some((r: string) => r.includes('High multi-chain activity detected (4 chains)')));
        assert.ok(res.reasons.some((r: string) => r.includes('High wallet balance (>$10k USD)')));
    });

    test('calculates moderate activity and sybil warning', async () => {
        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { 
                success: true, 
                data: { balances: [{chain: 'ethereum', usdValue: 500}] } 
            };
            if (cmd.includes('counterparties')) return {
                success: true,
                data: { isSybilCluster: true }
            };
            return { success: true };
        });
        const resJson = await handler({ address: '0x123' });
        const res = JSON.parse(resJson);
        assert.strictEqual(res.tier, 'Tier 3 (Low)');
        assert.ok(res.reasons.some((r: string) => r.includes('Moderate multi-chain activity (1 chains)')));
        assert.ok(res.reasons.some((r: string) => r.includes('Modest wallet balance (>$100 USD)')));
        assert.ok(res.reasons.some((r: string) => r.includes('Warning: Identified in known Sybil clusters.')));
    });

    test('calculates low activity', async () => {
        setNansenMock(async (cmd) => {
            if (cmd.includes('balance')) return { 
                success: true, 
                data: { balances: [] } 
            };
            if (cmd.includes('counterparties')) return {
                success: true,
                data: { isSybilCluster: false }
            };
            return { success: true };
        });
        const resJson = await handler({ address: '0x123' });
        const res = JSON.parse(resJson);
        assert.ok(res.reasons.some((r: string) => r.includes('No multi-chain activity detected')));
        assert.ok(res.reasons.some((r: string) => r.includes('Low wallet balance (<$100 USD)')));
    });
});
