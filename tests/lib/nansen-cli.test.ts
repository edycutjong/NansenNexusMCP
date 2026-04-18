import { describe, test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { execNansen, setNansenMock, setExecFileMock } from '../../src/lib/nansen-cli.js';
import cp from 'node:child_process';

describe('nansen-cli core library', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    setNansenMock(null);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('returns default mock when NODE_ENV is test and testMockHandler is null', async () => {
    process.env.NODE_ENV = 'test';
    const res = await execNansen('test');
    assert.strictEqual(res.success, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((res.data as any)._mock, true);
  });

  test('uses custom mock handler when provided in test mode', async () => {
    process.env.NODE_ENV = 'test';
    setNansenMock(async (cmd, args) => ({ success: true, data: { custom: true, cmd, args } }));
    const res = await execNansen('test', ['--flag']);
    assert.strictEqual(res.success, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((res.data as any).custom, true);
  });

  test('executes nansen over child_process when not in test mode', async () => {
    process.env.NODE_ENV = 'production';
    setExecFileMock((cmd: string, args: unknown, opts: unknown, cb: any) => {
      cb(null, '{"test":"value"}', '');
      return {} as any;
    });

    const res = await execNansen('wallet', ['--address', '0x123']);
    assert.strictEqual(res.success, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((res.data as any).test, 'value');
  });

  test('handles execFile error with JSON parseable stderr', async () => {
    process.env.NODE_ENV = 'production';
    setExecFileMock((cmd: string, args: unknown, opts: unknown, cb: any) => {
      cb(new Error('fail'), '', '{"error":"some error","code":"ERR1"}');
      return {} as any;
    });

    const res = await execNansen('wallet');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'some error');
    assert.strictEqual(res.code, 'ERR1');
  });

  test('handles execFile error with non-JSON fallback', async () => {
    process.env.NODE_ENV = 'production';
    setExecFileMock((cmd: string, args: unknown, opts: unknown, cb: any) => {
      cb(new Error('raw error'), '', 'raw string');
      return {} as any;
    });

    const res = await execNansen('wallet');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'raw string');
    assert.strictEqual(res.code, 'EXEC_ERROR');
  });

  test('handles stdout JSON parsing error', async () => {
    process.env.NODE_ENV = 'production';
    setExecFileMock((cmd: string, args: unknown, opts: unknown, cb: any) => {
      cb(null, '{"invalid_json...', '');
      return {} as any;
    });

    const res = await execNansen('wallet');
    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes('Failed to parse JSON'));
    assert.strictEqual(res.code, 'PARSE_ERROR');
  });
});
