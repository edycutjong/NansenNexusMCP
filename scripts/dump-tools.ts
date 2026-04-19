/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import glob from 'fast-glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const toolsDir = path.join(rootDir, 'src', 'tools');
const dumpDir = path.join(rootDir, '.nansen-cache', 'tools_dump');

// process.env.NODE_ENV = 'test'; // Removed to test using live data

async function run() {
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
  }

  // Find all tools
  const toolFiles = await glob('**/*.ts', { cwd: toolsDir, absolute: true });
  console.log(`Found ${toolFiles.length} tool scripts. Preparing to mock execution...`);

  const registeredTools: { name: string; execute: Function; shape: any }[] = [];

  // Mock server to intercept registrations
  const mockServer = {
    tool: (name: string, description: string, shape: any, execute: Function) => {
      registeredTools.push({ name, execute, shape });
    }
  };

  for (const file of toolFiles) {
    // skip test modules if present
    if (file.includes('bad-module')) continue; 

    try {
      const module = await import(pathToFileURL(file).href);
      if (module.default && typeof module.default.register === 'function') {
        module.default.register(mockServer);
      } else if (module.name && module.schema && typeof module.handler === 'function') {
        // Direct named exports pattern
        mockServer.tool(module.name, module.description || '', module.schema.shape, module.handler);
      }
    } catch (err) {
      console.warn(`Failed to import ${file}:`, err);
    }
  }

  console.log(`Intercepted ${registeredTools.length} registered tools! Executing with mock data...`);

  for (const tool of registeredTools) {
    console.log(`Executing tool: ${tool.name}`);

    // Very naive parameter autoloader
    const mockArgs: Record<string, any> = {};
    for (const [key, zodType] of Object.entries(tool.shape)) {
      if (key.toLowerCase().includes('address')) {
        mockArgs[key] = '0xd8da6bf26964af9d7eed9e03e53415dd37ae6abf'; // Vitalik
      } else if (key === 'chain') {
        mockArgs[key] = 'ethereum';
      } else if (key === 'limit' || key === 'amount') {
        mockArgs[key] = 10;
      } else if (key === 'days') {
        mockArgs[key] = 7;
      } else if (key.startsWith('include')) {
        mockArgs[key] = true;
      } else {
        // Fallback generic strings/booleans
        const typeStr = (zodType as any)._def?.typeName;
        if (typeStr === 'ZodBoolean') mockArgs[key] = true;
        else if (typeStr === 'ZodNumber') mockArgs[key] = 1;
        else mockArgs[key] = 'mock_string_value';
      }
    }

    try {
        const response = await tool.execute(mockArgs);
        
        // Write out dummy parameters and resulting response
        const dumpPayload = {
            metadata: {
               tool: tool.name,
               simulatedArgs: mockArgs,
               timestamp: new Date().toISOString()
            },
            response
        };

        const targetFile = path.join(dumpDir, `${tool.name}.json`);
        fs.writeFileSync(targetFile, JSON.stringify(dumpPayload, null, 2));
        console.log(` ✓ Saved payload to ${targetFile}`);

    } catch (err) {
        console.error(` ✗ Failed to execute ${tool.name}:`, err);
    }
  }

  console.log('\nAll tools processed and dumped into:', dumpDir);
}

run().catch(console.error);
