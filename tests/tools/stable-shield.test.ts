import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import moduleInfo from '../../src/tools/stable-shield.js';
import { setNansenMock } from '../../src/lib/nansen-cli.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('stable-shield tool', () => {
    afterEach(() => { 
         
        setNansenMock(null); 
    });

    test('executes wallet-focus mode successfully when address provided', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        moduleInfo.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('portfolio defi')) return { success: true, data: { defi: true } };
            if (cmd.includes('profiler balance')) return { success: true, data: { bal: 100 } };
            return { success: false };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.metadata.mode, 'wallet-focus');
        assert.strictEqual(parsed.data.defiPortfolio.defi, true);
        assert.strictEqual(parsed.data.balances.bal, 100);
    });

    test('executes macro mode successfully when address omitted', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        moduleInfo.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('smart-money netflow')) return { success: true, data: { macro: true } };
            return { success: false };
        });

        const result = await toolCb!({ chain: 'ethereum' }); // omitting address
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.metadata.mode, 'macro');
        assert.strictEqual(parsed.data.macroSmFlows.macro, true);
    });

    test('handles CLI errors gracefully in wallet-focus mode', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        moduleInfo.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('portfolio defi')) return { success: false, error: 'fail 1' };
            if (cmd.includes('profiler balance')) return { success: false, error: 'fail 2' };
            return { success: true };
        });

        const result = await toolCb!({ address: '0x123', chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.defiPortfolio, 'fail 1');
        assert.strictEqual(parsed.data.balances, 'fail 2');
    });
    
    test('handles CLI errors gracefully in macro mode', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let toolCb: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockServer = { tool: (name: string, description: string, schema: any, callback: any) => { toolCb = callback; } } as unknown as McpServer;
        moduleInfo.register(mockServer);

        setNansenMock(async (cmd) => {
            if (cmd.includes('smart-money netflow')) return { success: false, error: 'macro fail' };
            return { success: true };
        });

        const result = await toolCb!({ chain: 'ethereum' });
        const parsed = JSON.parse(result.content[0].text);
        
        assert.strictEqual(parsed.data.macroSmFlows, 'macro fail');
    });
});
