import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import { handler } from '../../src/tools/perp-funding-monitor.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';

describe('perp-funding-monitor tool', () => {
    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNansenMock(null as any);
    });

    test('handles data fetch failure', async () => {
        setNansenMock(async () => ({ success: false, error: 'API Error' }));
        const res = await handler({ token: 'SOL' });
        assert.ok(res.includes('Failed to fetch perp data'));
    });

    test('returns mock data when empty array returned', async () => {
        setNansenMock(async () => ({ success: true, data: { data: [] } }));
        const resJson = await handler({});
        const res = JSON.parse(resJson);
        assert.strictEqual(res.status, 'mock');
        assert.strictEqual(res.anomalies.length, 2);
    });

    test('identifies short squeeze and overheated longs', async () => {
        setNansenMock(async () => ({ success: true, data: {
            data: [
                { symbol: 'ABC', fundingRate: -0.05, openInterestChange24h: 15 },
                { symbol: 'XYZ', fundingRate: 0.15, openInterestChange24h: 20 },
                { symbol: 'BORING', fundingRate: 0.05, openInterestChange24h: 5 }
            ]
        }}));

        const resJson = await handler({ token: 'SOL' });
        const res = JSON.parse(resJson);
        
        assert.ok(res.scanType.includes('Targeted scan'));
        assert.strictEqual(res.identifiedSetups.length, 2);
        assert.strictEqual(res.identifiedSetups[0].setup, 'Potential Short Squeeze');
        assert.strictEqual(res.identifiedSetups[1].setup, 'Overheated Longs');
    });

    test('identifies no extreme squeeze setups', async () => {
        setNansenMock(async () => ({ success: true, data: {
            data: [
                { symbol: 'BORING', fundingRate: 0.05, openInterestChange24h: 5 }
            ]
        }}));

        const resJson = await handler({}); 
        const res = JSON.parse(resJson);
        assert.strictEqual(res.identifiedSetups, 'No extreme squeeze setups identified.');
    });
});
