import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import tokenFlowModule from '../../src/tools/token-flow-analyzer.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<any>;

function extractHandler(): ToolHandler {
    let captured: ToolHandler | null = null;
    const mockServer = {
        tool: (_name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
            captured = handler;
        }
    } as unknown as McpServer;
    tokenFlowModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('token-flow-analyzer tool', () => {
    afterEach(() => { 
        setNansenMock(null); 
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(tokenFlowModule.type, 'tool');
        assert.strictEqual(tokenFlowModule.name, 'token-flow-analyzer');
    });

    test('registers successfully and executes success path', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: true, data: { flow: true } }));

        const result = await handler({
            token: '0x123',
            chain: 'ethereum',
            flowType: 'all',
            timeframe: '24h'
        });

        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.data.flow, true);
    });

    test('handles CLI error gracefully', async () => {
        const handler = extractHandler();
        setNansenMock(async () => ({ success: false, error: 'Flow api down' }));

        const result = await handler({ token: '0x123', chain: 'ethereum', flowType: 'all', timeframe: '24h' });
        
        assert.strictEqual(result.isError, true);
        assert.ok(result.content[0].text.includes('Flow api down'));
    });
});
