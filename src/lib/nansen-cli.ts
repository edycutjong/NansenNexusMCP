import { execFile as defaultExecFile } from 'node:child_process';

// Allow overriding execFile for error testing paths
export let internalExecFile = defaultExecFile;
export function setExecFileMock(handler: typeof defaultExecFile | null) {
  /* c8 ignore next */
  internalExecFile = handler || defaultExecFile;
}

export interface NansenResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testMockHandler: ((command: string, args: string[]) => Promise<NansenResponse<any>>) | null = null;

export function setNansenMock(handler: typeof testMockHandler) {
  testMockHandler = handler;
}

/**
 * Execute a nansen CLI command and parse the JSON output.
 * If NODE_ENV is test, this will mock the response.
 */
export function execNansen<T = unknown>(
  command: string,
  args: string[] = [],
): Promise<NansenResponse<T>> {
  if (process.env.NODE_ENV === 'test') {
    if (testMockHandler) {
      return testMockHandler(command, args) as Promise<NansenResponse<T>>;
    }
    return Promise.resolve({
      success: true,
      data: {
        _mock: true,
        command,
        args,
        message: "Mocked Nansen CLI response for testing"
      } as unknown as T
    });
  }

  return new Promise((resolve) => {
    const fullArgs = [...command.split(' '), ...args, '--pretty'];

    internalExecFile('nansen', fullArgs, { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 }, (error, stdout, stderr) => {
      if (error) {
        // Try to parse error output as JSON
        /* c8 ignore next 3 */
        const errorText = stderr || stdout || (error && error.message) || String(error);
        try {
          const parsed = JSON.parse(errorText);
          /* c8 ignore next 6 */
          resolve({
            success: false,
            error: parsed.error || error.message,
            code: parsed.code,
            status: parsed.status,
          });
        } catch {
          resolve({
            success: false,
            error: errorText,
            code: 'EXEC_ERROR',
          });
        }
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve({ success: true, data: parsed as T });
      } catch {
        resolve({
          success: false,
          error: `Failed to parse JSON: ${stdout.slice(0, 200)}`,
          code: 'PARSE_ERROR',
        });
      }
    });
  });
}
