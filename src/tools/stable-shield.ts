import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const stableShieldModule: RegisterableModule = {
  type: "tool",
  name: "stable-shield",
  description: "Monitor institutional stablecoin parking and delta-neutral yields.",
  register(server: McpServer) {
    server.tool(
      "stable-shield",
      "Analyze where Smart Money is moving stablecoins into DeFi yields (Lending, Staking) to detect risk-off market conditions.",
      {
        address: z.string().optional().describe("Provide optional DAO/Institution wallet to monitor. Omit for macro view."),
        chain: z.string().default("ethereum").describe("Blockchain network")
      },
      async (args) => {
         const { address, chain } = args;
         const results = { metadata: { source: "StableShield Institutional Guardian", mode: address ? "wallet-focus" : "macro" }, data: {} as Record<string, unknown> };
         
         const promises = [];
         
         if (address) {
            promises.push(execNansen('research portfolio defi', ['--address', address, '--chain', chain])
               .then(res => { results.data.defiPortfolio = res.success ? res.data : res.error; }));
            
            promises.push(execNansen('research profiler balance', ['--address', address, '--chain', chain])
               .then(res => { results.data.balances = res.success ? res.data : res.error; }));
         } else {
             // Macro view fallback
             promises.push(execNansen('research smart-money netflow', ['--chain', chain])
               .then(res => { results.data.macroSmFlows = res.success ? res.data : res.error; }));
         }
            
         await Promise.all(promises);
         return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
};

export default stableShieldModule;
