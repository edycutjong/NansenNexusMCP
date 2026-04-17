import { test } from 'node:test';
import assert from 'node:assert';
import { processModule } from '../../src/registry/module-processor.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('processModule handles successful registration', async () => {
  const tempFile = path.join(__dirname, 'temp-valid.js');
  fs.writeFileSync(tempFile, `
    export default {
      type: 'tool',
      name: 'temp-tool',
      register: async (server) => {}
    };
  `);
  
  const oldErr = console.error;
  console.error = () => {};
  try {
    const result = await processModule(tempFile, {} as McpServer);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.name, 'temp-tool');
  } finally {
    console.error = oldErr;
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('processModule handles missing default export', async () => {
  const tempFile = path.join(__dirname, 'temp-no-default.js');
  fs.writeFileSync(tempFile, `export const foo = 1;`);
  
  const oldErr = console.error;
  console.error = () => {};
  try {
    const result = await processModule(tempFile, {} as McpServer);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Missing default export');
  } finally {
    console.error = oldErr;
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('processModule handles invalid RegisterableModule', async () => {
  const tempFile = path.join(__dirname, 'temp-invalid.js');
  fs.writeFileSync(tempFile, `
    export default {
      type: 'invalid',
      name: 'temp'
    };
  `);
  
  const oldErr = console.error;
  console.error = () => {};
  try {
    const result = await processModule(tempFile, {} as McpServer);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Invalid RegisterableModule format');
  } finally {
    console.error = oldErr;
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

test('processModule handles load errors', async () => {
  const oldErr = console.error;
  console.error = () => {};
  try {
    const result = await processModule('/does/not/exist.js', {} as McpServer);
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  } finally {
    console.error = oldErr;
  }
});
