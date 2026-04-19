import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const readmePath = path.join(rootDir, 'README.md');
const dumpDir = path.join(rootDir, '.nansen-cache', 'tools_dump');

async function run() {
  if (!fs.existsSync(dumpDir)) {
    console.error(`❌ Dump directory not found at ${dumpDir}. Run 'npm run dump:tools' first.`);
    process.exit(1);
  }

  const files = fs.readdirSync(dumpDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn(`⚠️ No tool dumps found in ${dumpDir}.`);
    process.exit(0);
  }

  let injectedContent = '\n';

  for (const file of files) {
    const filePath = path.join(dumpDir, file);
    try {
      const toolData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const toolName = toolData.metadata?.tool || file.replace('.json', '');
      
      // Extract the first text block from the response
      const resultContentStr = toolData.response?.content?.[0]?.text || 'No data';
      
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(resultContentStr);
      } catch {
        parsedOutput = resultContentStr;
      }

      // Truncate output to prevent README from getting monstrous
      const stringified = JSON.stringify(parsedOutput, null, 2);
      const outputLines = stringified.split('\n');
      const MAX_LINES = 30;
      let displayOutput = outputLines.slice(0, MAX_LINES).join('\n');
      if (outputLines.length > MAX_LINES) {
        displayOutput += `\n... (truncated ${outputLines.length - MAX_LINES} lines) ...\n}`;
      }

      injectedContent += `\n<details>\n`;
      injectedContent += `<summary><code>${toolName}</code></summary>\n\n`;
      injectedContent += '```json\n';
      injectedContent += displayOutput;
      injectedContent += '\n```\n\n';
      injectedContent += `</details>\n`;

    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  
  const START_MARKER = '<!-- EXAMPLES_START -->';
  const END_MARKER = '<!-- EXAMPLES_END -->';
  
  const startIndex = readmeContent.indexOf(START_MARKER);
  const endIndex = readmeContent.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1) {
    console.error('❌ Could not find injection markers in README.md!');
    process.exit(1);
  }

  const before = readmeContent.slice(0, startIndex + START_MARKER.length);
  const after = readmeContent.slice(endIndex);

  const newReadme = before + injectedContent + after;
  fs.writeFileSync(readmePath, newReadme);

  console.log(`✅ Inject examples for ${files.length} tools into README.md!`);
}

run().catch(console.error);
