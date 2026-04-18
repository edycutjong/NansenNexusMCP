import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tmpDir = path.join(rootDir, '.tmp_repos');
const contentPath = '/Users/edycu/.gemini/antigravity/brain/28f534c8-927f-447d-80d5-d766d3ba131e/.system_generated/steps/60/content.md';

function extractUrls() {
  const content = fs.readFileSync(contentPath, 'utf-8');
  // Match `[repo](https://github.com/...)` or `[gist](https://gist.github.com/...)`
  // Actually the article format is `[repo](url)`
  const repoRegex = /\[repo\]\((https:\/\/(?:github|gist\.github)\.com\/[^)]+)\)/g;
  const gistRegex = /\[gist\]\((https:\/\/(?:github|gist\.github)\.com\/[^)]+)\)/g;
  
  const urls: string[] = [];
  let match;
  while ((match = repoRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  while ((match = gistRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

function cloneRepos(urls: string[]) {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  console.log(`Found ${urls.length} unique repositories/gists to clone.`);
  
  urls.forEach((url, i) => {
    const folderName = `repo_${i}_${url.split('/').pop()?.replace('.git', '') || 'unknown'}`;
    const clonePath = path.join(tmpDir, folderName);
    
    if (!fs.existsSync(clonePath)) {
      console.log(`Cloning [${i+1}/${urls.length}] ${url}...`);
      try {
        execSync(`git clone --depth 1 ${url} ${clonePath}`, { stdio: 'ignore' });
      } catch {
        console.error(`Failed to clone ${url}`);
      }
    } else {
      console.log(`Already cloned [${i+1}/${urls.length}] ${url}`);
    }
  });
}

function extractNansenUsage() {
  console.log('Extracting Nansen CLI usage patterns...');
  const usageMap = new Map<string, Set<string>>();
  
  function walk(dir: string) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch { return; }
    
    for (const file of files) {
      if (file === '.git' || file === 'node_modules') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        // basic text files
        if (/\.(ts|js|py|sh|md|txt)$/.test(file)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line) => {
               // Fast check
               if (line.includes('execNansen') || line.includes('nansen ') || line.includes('nansen-cli') || line.includes('research ') || line.includes('wallet ') || line.includes('token ') || line.includes('trade ') || line.includes('account') || line.includes('schema')) {
                 
                 // Look for structured subcommands: 'research [module] [endpoint]'
                 const researchMatch = line.match(/(research|wallet|token|trade)\s+([a-z-]+(?:\s+[a-z-]+)?)/g);
                 if (researchMatch) {
                   researchMatch.forEach(m => {
                      // Filter out generic hits that aren't endpoints
                      if (m.includes('const ') || m.includes('let ')) return;
                      
                      const repoName = dir.replace(tmpDir, '').split('/')[1] || path.basename(dir);
                      if (!usageMap.has(repoName)) usageMap.set(repoName, new Set());
                      usageMap.get(repoName)!.add(m.trim());
                   });
                 }
               }
            });
          } catch { /* ignore */ }
        }
      }
    }
  }
  
  walk(tmpDir);
  return usageMap;
}

function run() {
  const urls = extractUrls();
  if (urls.length === 0) {
    console.error("No repos or gists found in the document. Ensure regex is correct.");
    return;
  }
  cloneRepos(urls);
  const usage = extractNansenUsage();
  
  console.log('\n--- NANSEN CLI ENDPOINTS BY REPO ---');
  const totalUnique = new Set<string>();
  
  for (const [repo, endpoints] of usage.entries()) {
    console.log(`\nRepository: ${repo}`);
    for (const ep of endpoints) {
      console.log(`  - ${ep}`);
      totalUnique.add(ep);
    }
  }
  
  console.log('\n--- AGGREGATE UNIQUE ENDPOINTS IN USE ---');
  const sorted = [...totalUnique].sort();
  console.log(sorted.map(s => `- ${s}`).join('\n'));
  
  // Write result to file
  fs.writeFileSync(path.join(rootDir, 'aggregated-endpoints.json'), JSON.stringify(sorted, null, 2));
  console.log(`\nSuccessfully saved ${sorted.length} unique combinations to aggregated-endpoints.json`);
}

run();
