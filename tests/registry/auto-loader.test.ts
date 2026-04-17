import { test } from 'node:test';
import assert from 'node:assert';
import { autoRegisterModules } from '../../src/registry/auto-loader.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('autoRegisterModules runs gracefully', async () => {
  const oldErr = console.error;
  console.error = () => {};
  
  // We mock a tiny registry implementation so the real modules don't crash
  const mockServer = {
    tool: () => {},
    resource: () => {},
    prompt: () => {}
  } as unknown as McpServer;

  try {
    await autoRegisterModules(mockServer);
    assert.ok(true);
  } finally {
    console.error = oldErr;
  }
});

test('autoRegisterModules logs failures if they occur', async () => {
  const badFile = path.join(__dirname, '..', '..', 'src', 'tools', 'bad-module-for-test.ts');
  fs.writeFileSync(badFile, `export default { type: 'invalid' };`);
  
  // We need a .js extension for the glob matching to pick it up, or TS compiles it
  const badJsFile = path.join(__dirname, '..', '..', 'src', 'tools', 'bad-module-for-test.js');
  fs.writeFileSync(badJsFile, `export default { type: 'invalid' };`);
  
  const oldErr = console.error;
  let errorLogged = false;
  console.error = (...args: unknown[]) => {
    if (args.includes('Failed modules:')) {
      errorLogged = true;
    }
  };
  
  const mockServer = { tool: () => {} } as unknown as McpServer;

  try {
    await autoRegisterModules(mockServer);
    assert.ok(errorLogged, 'Should log failed modules block');
  } finally {
    console.error = oldErr;
    if (fs.existsSync(badFile)) fs.unlinkSync(badFile);
    if (fs.existsSync(badJsFile)) fs.unlinkSync(badJsFile);
  }
});
