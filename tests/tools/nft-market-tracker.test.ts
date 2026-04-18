import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import nftMarketTrackerModule from '../../src/tools/nft-market-tracker.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('nft-market-tracker tool', () => {
    afterEach(() => {
        setNansenMock(null as any);
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => {
                toolCb = callback;
            }
        } as unknown as McpServer;

        nftMarketTrackerModule.register(mockServer);
        
        setNansenMock(async (cmd, args) => ({ success: true, data: { nfts: ['pudgy'] }, cmd, args }));
        
        // Without collection
        const result1 = await toolCb!({ chain: 'ethereum', timeframe: '24h', metric: 'volume' });
        assert.ok(result1);
        assert.ok(result1.content[0].text.includes('pudgy'));
        
        // With collection
        const result2 = await toolCb!({ chain: 'ethereum', timeframe: '24h', metric: 'volume', collection: '0x123' });
        assert.ok(result2.content[0].text.includes('0x123'));
    });

    test('handles CLI error', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; }
        } as unknown as McpServer;

        nftMarketTrackerModule.register(mockServer);
        
        setNansenMock(async () => ({ success: false, error: 'Network failure' }));
        
        const result = await toolCb!({ chain: 'ethereum', timeframe: '24h', metric: 'volume' });
        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('Network failure'));
    });
});
