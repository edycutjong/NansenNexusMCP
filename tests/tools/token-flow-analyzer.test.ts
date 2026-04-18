import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import tokenFlowModule from '../../src/tools/token-flow-analyzer.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('token-flow-analyzer tool', () => {
    afterEach(() => { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNansenMock(null as any); 
    });

    test('registers successfully and executes success path', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        tokenFlowModule.register(mockServer);

        setNansenMock(async () => ({ success: true, data: { flow: true } }));

        const result = await toolCb!({
            token: '0x123',
            chain: 'ethereum',
            flowType: 'cex_flows',
            timeframe: '24h'
        });

        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.flow, true);
    });

    test('handles CLI error gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        tokenFlowModule.register(mockServer);

        setNansenMock(async () => ({ success: false, error: 'Flow api down' }));

        const result = await toolCb!({ token: '0x123', chain: 'ethereum', flowType: 'cex_flows', timeframe: '24h' });
        
        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('Flow api down'));
    });
});
