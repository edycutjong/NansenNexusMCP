import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import hotContractsModule from '../../src/tools/hot-contracts-scanner.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('hot-contracts-scanner tool', () => {
    afterEach(() => {
        setNansenMock(null);
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

        hotContractsModule.register(mockServer);
        
        setNansenMock(async () => ({ success: true, data: { contracts: ['0xABC'] } }));
        
        const result = await toolCb!({ chain: 'ethereum', timeframe: '24h', limit: 20 });
        
        assert.ok(result);
        assert.strictEqual(result.content[0].type, 'text');
        assert.ok(result.content[0].text.includes('0xABC'));
    });

    test('handles CLI error', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; }
        } as unknown as McpServer;

        hotContractsModule.register(mockServer);
        
        setNansenMock(async () => ({ success: false, error: 'Network failure' }));
        
        const result = await toolCb!({ chain: 'ethereum', timeframe: '24h', limit: 20 });
        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('Network failure'));
    });
});
