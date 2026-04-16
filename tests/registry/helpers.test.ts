import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  getModuleName,
  getModuleType,
  filePathToUrl,
  getModulePatterns,
  getRootDir,
  isSuccessfulResult,
  isFailedResult,
  countResults,
  formatRegistrationSummary,
  formatModuleInfo,
  logModuleLoading,
  logModuleSuccess,
  logModuleError,
  logLoadError,
  logFoundFiles,
  logAutoRegistering,
  logFailedModules,
  createSuccessResult,
  createErrorResult,
  findModuleFiles,
  loadModule
} from '../../src/registry/helpers.js';

test('getModuleName extracts basename without .js', () => {
  assert.strictEqual(getModuleName('/path/to/my-module.js'), 'my-module');
});

test('getModuleType extracts dirname basename', () => {
  assert.strictEqual(getModuleType('/path/to/tools/my-module.js'), 'tools');
});

test('filePathToUrl converts path to URL string', () => {
  const p = '/absolute/path.js';
  assert.strictEqual(filePathToUrl(p), pathToFileURL(p).href);
});

test('getModulePatterns returns correct globs', () => {
  const patterns = getModulePatterns('/root');
  assert.deepStrictEqual(patterns, [
    path.join('/root', 'tools', '*.js'),
    path.join('/root', 'resources', '*.js'),
    path.join('/root', 'prompts', '*.js')
  ]);
});

test('getRootDir extracts root', () => {
  const fileUrl = pathToFileURL('/root/src/registry/helpers.js').href;
  assert.strictEqual(getRootDir(fileUrl), '/root/src');
});

test('isSuccessfulResult works correctly', () => {
  assert.strictEqual(isSuccessfulResult({ status: 'fulfilled', value: { success: true } }), true);
  assert.strictEqual(isSuccessfulResult({ status: 'fulfilled', value: { success: false } }), false);
  assert.strictEqual(isSuccessfulResult({ status: 'rejected', reason: 'err' }), false);
});

test('isFailedResult works correctly', () => {
  assert.strictEqual(isFailedResult({ status: 'fulfilled', value: { success: true } }), false);
  assert.strictEqual(isFailedResult({ status: 'fulfilled', value: { success: false } }), true);
  assert.strictEqual(isFailedResult({ status: 'rejected', reason: 'err' }), true);
});

test('countResults computes stats', () => {
  const results: any[] = [
    { status: 'fulfilled', value: { success: true } },
    { status: 'fulfilled', value: { success: false } },
    { status: 'rejected', reason: 'err' }
  ];
  assert.deepStrictEqual(countResults(results), { successful: 1, failed: 2 });
});

test('formatRegistrationSummary formats correctly', () => {
  assert.strictEqual(formatRegistrationSummary(2, 1), '\nRegistration complete: 2 successful, 1 failed');
});

test('formatModuleInfo formats correctly', () => {
  assert.strictEqual(formatModuleInfo('tools', 'test'), 'tools/test');
});

test('Factories create expected results', () => {
  assert.deepStrictEqual(createSuccessResult('n', 't'), { success: true, name: 'n', type: 't' });
  assert.deepStrictEqual(createErrorResult('n', 'e'), { success: false, name: 'n', error: 'e' });
});

test('findModuleFiles runs without throwing (integration)', async () => {
  // temporarily mute console
  const oldErr = console.error;
  console.error = () => {};
  try {
    const res = await findModuleFiles(__dirname);
    assert.ok(Array.isArray(res));
  } finally {
    console.error = oldErr;
  }
});

test('Log functions do not throw', () => {
  const oldErr = console.error;
  console.error = () => {};
  try {
    logModuleLoading('t', 'n');
    logModuleSuccess('t', 'n');
    logModuleError('n', 'e');
    logLoadError('n', new Error('e'));
    logFoundFiles(5);
    logAutoRegistering(['*']);
    
    // Coverage for failed module logger
    logFailedModules([
        { status: 'rejected', reason: 'err' },
        { status: 'fulfilled', value: { success: false, name: 'fail', error: 'err2' } } as any,
        { status: 'fulfilled', value: { success: true, name: 'pass' } } as any
    ]);
  } finally {
    console.error = oldErr;
  }
});

test('loadModule can import a file', async () => {
  // Since we use tsx, loading a dummy file or ourselves should work
  const result = await loadModule(__filename.replace('.ts', '.js'));
  assert.ok(result);
});
