import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, '.nansen-cache', 'request_logs');
const dumpDir = path.join(rootDir, '.nansen-cache', 'tools_dump');

if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });

const toolsMapping: Record<string, string> = {
  'smart-money-tracker': 'research_smart-money_netflow',
  'token-flow-analyzer': 'research_token_flow-intelligence',
  'wallet-profiler': 'research_profiler_pnl-summary',      // proxy
  'hot-contracts-scanner': 'research_hot-contracts',
  'nft-market-tracker': 'research_nft_paradise',           // projection
  'network-traversal': 'research_profiler_related-wallets',
  'polymarket-oracle': 'research_prediction-market_market-screener',
  'stable-shield': 'research_portfolio_defi',
  'wallet-roast': 'research_profiler_transactions',
  'wyckoff-screener': 'research_token_info',
  'perp-funding-monitor': 'research_perp_screener',
  'smart-money-copy-trade': 'research_smart-money_dex-trades',
  'airdrop-eligibility': 'research_profiler_balance'
};

const allLogs = fs.readdirSync(logsDir).filter(f => f.endsWith('.json')).sort();

for (const [tool, searchStr] of Object.entries(toolsMapping)) {
  // Find the largest or newest valid log for this tool
  const matchingLogs = allLogs.filter(f => f.includes(searchStr));
  if (matchingLogs.length > 0) {
    // Get the biggest file
    const chosenFile = matchingLogs.reduce((prev, current) => {
        const pSize = fs.statSync(path.join(logsDir, prev)).size;
        const cSize = fs.statSync(path.join(logsDir, current)).size;
        return cSize > pSize ? current : prev;
    });

    const data = JSON.parse(fs.readFileSync(path.join(logsDir, chosenFile), 'utf-8'));
    
    const payload = {
        metadata: {
           tool,
           simulatedArgs: {},
           timestamp: new Date().toISOString()
        },
        response: {
           content: [
             {
               type: 'text',
               text: JSON.stringify({
                 metadata: {
                    status: "historical_live",
                    source: "Nansen CLI -> MCP Nexus"
                 },
                 data: data.response
               }, null, 2)
             }
           ]
        }
    };
    fs.writeFileSync(path.join(dumpDir, `${tool}.json`), JSON.stringify(payload, null, 2));
    console.log(`✅ Restored ${tool}.json using ${chosenFile}`);
  }
}
