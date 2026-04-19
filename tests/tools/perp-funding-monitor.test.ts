import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import perpFundingModule from '../../src/tools/perp-funding-monitor.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<any>;

function extractHandler(): ToolHandler {
    let captured: ToolHandler | null = null;
    const mockServer = {
        tool: (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
            captured = handler;
        }
    } as unknown as McpServer;
    perpFundingModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('perp-funding-monitor tool', () => {
    afterEach(() => {
        setNansenMock(null);
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(perpFundingModule.type, 'tool');
        assert.strictEqual(perpFundingModule.name, 'perp-funding-monitor');
        assert.ok(perpFundingModule.description);
    });

    test('handles data fetch failure', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: false, error: 'API Error' }));
        const res = await handler({ token: 'SOL' });
        assert.strictEqual(res.isError, true);
        assert.ok(res.content[0].text.includes('Failed to fetch perp data'));
    });

    test('returns mock data when empty array returned', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: { data: [] } }));
        const res = await handler({});
        const parsed = JSON.parse(res.content[0].text);
        assert.strictEqual(parsed.status, 'mock');
        assert.strictEqual(parsed.anomalies.length, 2);
    });

    test('identifies short squeeze and overheated longs', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: {
            data: [
                { symbol: 'ABC', fundingRate: -0.05, openInterestChange24h: 15 },
                { symbol: 'XYZ', fundingRate: 0.15, openInterestChange24h: 20 },
                { symbol: 'BORING', fundingRate: 0.05, openInterestChange24h: 5 }
            ]
        }}));

        const res = await handler({ token: 'SOL' });
        const parsed = JSON.parse(res.content[0].text);
        
        assert.ok(parsed.scanType.includes('Targeted scan'));
        assert.strictEqual(parsed.identifiedSetups.length, 2);
        assert.strictEqual(parsed.identifiedSetups[0].setup, 'Potential Short Squeeze');
        assert.strictEqual(parsed.identifiedSetups[1].setup, 'Overheated Longs');
    });

    test('identifies no extreme squeeze setups', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: {
            data: [
                { symbol: 'BORING', fundingRate: 0.05, openInterestChange24h: 5 }
            ]
        }}));

        const res = await handler({});
        const parsed = JSON.parse(res.content[0].text);
        assert.strictEqual(parsed.identifiedSetups, 'No extreme squeeze setups identified.');
    });
});
