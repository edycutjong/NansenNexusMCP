import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import airdropEligibilityModule from '../../src/tools/airdrop-eligibility.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<any>;

function extractHandler(): ToolHandler {
    let captured: ToolHandler | null = null;
    const mockServer = {
        tool: (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
            captured = handler;
        }
    } as unknown as McpServer;
    airdropEligibilityModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('airdrop-eligibility tool', () => {
    afterEach(() => {
        setNansenMock(null);
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(airdropEligibilityModule.type, 'tool');
        assert.strictEqual(airdropEligibilityModule.name, 'airdrop-eligibility');
        assert.ok(airdropEligibilityModule.description);
    });

    test('handles balance data fetch failure', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: false, error: 'API Error' }));
        const res = await handler({ address: '0xd8da6bf26964af9d7eed9e03e53415dd37ae6abf' });
        assert.strictEqual(res.isError, true);
        assert.ok(res.content[0].text.includes('Failed to fetch balance data'));
    });

    test('calculates high score for multi-chain whale', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) {
                return { success: true, data: {
                    balances: [
                        { chain: 'ethereum', usdValue: 5000 },
                        { chain: 'base', usdValue: 3000 },
                        { chain: 'arbitrum', usdValue: 2000 },
                        { chain: 'polygon', usdValue: 1000 },
                    ]
                }};
            }
            return { success: true, data: { isSybilCluster: false } };
        });

        const res = await handler({ address: '0xd8da6bf26964af9d7eed9e03e53415dd37ae6abf' });
        const parsed = JSON.parse(res.content[0].text);
        assert.strictEqual(parsed.tier, 'Tier 1 (High Probability)');
        assert.ok(parsed.reasons.some((r: string) => r.includes('High multi-chain')));
        assert.ok(parsed.reasons.some((r: string) => r.includes('High wallet balance')));
    });

    test('penalizes sybil clusters', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) {
                return { success: true, data: { balances: [{ chain: 'ethereum', usdValue: 50 }] } };
            }
            return { success: true, data: { isSybilCluster: true } };
        });

        const res = await handler({ address: '0x1234' });
        const parsed = JSON.parse(res.content[0].text);
        assert.ok(parsed.reasons.some((r: string) => r.includes('Sybil')));
    });

    test('handles moderate balance and single chain', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) {
                return { success: true, data: { balances: [{ chain: 'ethereum', usdValue: 500 }] } };
            }
            return { success: true, data: {} };
        });

        const res = await handler({ address: '0x5678' });
        const parsed = JSON.parse(res.content[0].text);
        assert.ok(parsed.reasons.some((r: string) => r.includes('Moderate multi-chain') || r.includes('No multi-chain')));
        assert.ok(parsed.reasons.some((r: string) => r.includes('Modest wallet balance')));
    });

    test('handles zero balance', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('balance')) {
                return { success: true, data: { balances: [] } };
            }
            return { success: true, data: {} };
        });

        const res = await handler({ address: '0xdead' });
        const parsed = JSON.parse(res.content[0].text);
        assert.ok(parsed.reasons.some((r: string) => r.includes('No multi-chain')));
        assert.ok(parsed.reasons.some((r: string) => r.includes('Low wallet balance')));
    });
});
