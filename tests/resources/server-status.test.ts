import { test } from 'node:test';
import assert from 'node:assert';
import serverStatusModule from '../../src/resources/server-status.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

test('server-status registers successfully and callback executes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let resCb: Function | null = null;

    const mockServer = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resource: (...args: any[]) => {
            resCb = args[args.length - 1];
        }
    } as unknown as McpServer;

    serverStatusModule.register(mockServer);

    assert.ok(resCb);

    const result = await resCb!(new URL('status://server'));

    assert.ok(result);
    assert.strictEqual(result.contents[0].mimeType, 'application/json');
    assert.ok(result.contents[0].text.includes('uptime'));
});
