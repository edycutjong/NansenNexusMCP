import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import networkTraversalModule from '../../src/tools/network-traversal.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('network-traversal tool', () => {
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

        networkTraversalModule.register(mockServer);
        
        setNansenMock(async (cmd) => {
            if (cmd.includes('counterparties')) return { success: true, data: { cps: 10 } };
            if (cmd.includes('related-wallets')) return { success: true, data: { expected: true } };
            return { success: true };
        });
        
        const result = await toolCb!({ address: '0x123', chain: 'ethereum', depth: 1 });
        
        assert.ok(result);
        assert.strictEqual(result.content[0].type, 'text');
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.counterparties.cps, 10);
        assert.strictEqual(parsed.data.relatedWallets.expected, true);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        const mockServer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; }
        } as unknown as McpServer;

        networkTraversalModule.register(mockServer);
        
        setNansenMock(async (cmd) => {
            if (cmd.includes('counterparties')) return { success: false, error: 'fail 1' };
            if (cmd.includes('related-wallets')) return { success: false, error: 'fail 2' };
            return { success: true };
        });
        
        const result = await toolCb!({ address: '0x123', chain: 'ethereum', depth: 1 });
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.counterparties, 'fail 1');
        assert.strictEqual(parsed.data.relatedWallets, 'fail 2');
    });
});
