import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import wyckoffScreenerModule from '../../src/tools/wyckoff-screener.js';
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
    wyckoffScreenerModule.register(mockServer);
    if (!captured) throw new Error('Handler not captured');
    return captured;
}

describe('wyckoff-screener tool', () => {
    afterEach(() => { 
        setNansenMock(null); 
    });

    test('registers as a valid RegisterableModule', () => {
        assert.strictEqual(wyckoffScreenerModule.type, 'tool');
        assert.strictEqual(wyckoffScreenerModule.name, 'wyckoff-screener');
    });

    test('registers successfully and executes success path', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('flow-intelligence')) return { success: true, data: { param: 1 } };
            if (cmd.includes('token info')) return { success: true, data: { param: 2 } };
            return { success: true, data: {} };
        });

        const result = await handler({ tokenAddress: '0xabc', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.flowIntelligence.param, 1);
        assert.strictEqual(parsed.data.technicals.param, 2);
    });

    test('handles CLI error gracefully', async () => {
        const handler = extractHandler();
        setNansenMock(async (cmd: string) => {
            if (cmd.includes('flow-intelligence')) return { success: false, error: 'fail 1' };
            if (cmd.includes('token info')) return { success: false, error: 'fail 2' };
            return { success: true, data: {} };
        });

        const result = await handler({ tokenAddress: '0xabc', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.flowIntelligence, 'fail 1');
        assert.strictEqual(parsed.data.technicals, 'fail 2');
    });
});
