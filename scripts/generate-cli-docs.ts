import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tmpDir = path.join(rootDir, '.tmp_repos');
const docPath = path.join(rootDir, '..', 'NansenDoc', 'COMMUNITY_CLI_USAGE.md');

// Only allow actual known Nansen CLI prefixes to avoid regex false positives
const KNOWN_MODULES = ["research", "wallet", "token", "trade", "account", "schema"];
// Allowed endpoint patterns underneath the modules (broad strokes but limits english word false-positives)
const VALID_REGEX = new RegExp(`(${KNOWN_MODULES.join('|')})\\s+([a-z-]+(?:\\s+[a-z-]+)?(?:\\s+[a-z-]+)?)`, 'g');

function extractNansenUsage() {
  const usageMap = new Map<string, Set<string>>();
  
  if (!fs.existsSync(tmpDir)) {
    console.error("No temp repos found. Please run the fetcher first.");
    return usageMap;
  }

  function walk(dir: string, repoName: string) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch { return; }
    
    for (const file of files) {
      if (file === '.git' || file === 'node_modules' || file === 'dist' || file === 'build') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath, repoName);
      } else {
        if (/\.(ts|js|py|sh|md|txt|json)$/.test(file)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line) => {
               // Must contain a nansen-specific context trigger so it doesn't just catch the word "research" in an essay
               if (line.includes('execNansen') || line.includes('nansen ') || line.includes('nansen-cli') || line.includes('nansen_cli') || line.includes('command:')) {
                 const matches = line.match(VALID_REGEX);
                 if (matches) {
                   matches.forEach(m => {
                      const cleaned = m.trim();
                      // Exclude obvious JS code words
                      if (!cleaned.includes('const ') && !cleaned.includes('let ') && !cleaned.includes('function ')) {
                        if (!usageMap.has(repoName)) usageMap.set(repoName, new Set());
                        usageMap.get(repoName)!.add(cleaned);
                      }
                   });
                 }
               }
            });
          } catch { /* ignore */ }
        }
      }
    }
  }
  
  const repos = fs.readdirSync(tmpDir);
  for (const repo of repos) {
    if (repo.startsWith('repo_')) {
      // Get friendly name
      const parts = repo.split('_');
      parts.shift(); // remove 'repo'
      parts.shift(); // remove index
      const name = parts.join('_') || repo;
      walk(path.join(tmpDir, repo), name);
    }
  }
  
  return usageMap;
}

function run() {
  const usage = extractNansenUsage();
  
  let markdown = `# Community CLI Usage Documentation\n\n`;
  markdown += `This document catalogs all the specific Nansen CLI endpoints utilized across the community hackathon submissions.\n\n`;
  
  const totalUnique = new Set<string>();
  
  // Sort repos alphabetically
  const sortedRepos = Array.from(usage.keys()).sort();
  
  for (const repo of sortedRepos) {
    const endpoints = usage.get(repo)!;
    if (endpoints.size > 0) {
      markdown += `### \`[${repo}]\`\n`;
      markdown += `*Commands specific to this project execution:*\n`;
      for (const ep of Array.from(endpoints).sort()) {
        markdown += `- \`${ep}\`\n`;
        totalUnique.add(ep);
      }
      markdown += `\n`;
    }
  }
  
  markdown += `## 📊 Master List of Distinct Endpoints Used\n`;
  markdown += `Across all downloaded community submissions, the following unique endpoints were found:\n\n`;
  for (const ep of Array.from(totalUnique).sort()) {
    markdown += `- \`${ep}\`\n`;
  }
  
  fs.writeFileSync(docPath, markdown);
  console.log(`\nSuccessfully generated documentation at ${docPath}. (${totalUnique.size} distinct endpoints detected)`);
}

run();
