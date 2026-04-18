import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const polymarketOracleModule: RegisterableModule = {
  type: "tool",
  name: "polymarket-oracle",
  description: "Cross-reference Polymarket odds with Smart Money conviction to find divergence.",
  register(server: McpServer) {
    server.tool(
      "polymarket-oracle",
      "Correlate Polymarket event odds with Nansen Smart Money positioning to detect mispricings.",
      {
        marketId: z.string().describe("Polymarket Market ID or Condition ID"),
        includeHolders: z.boolean().default(true).describe("Include top holders analysis")
      },
      async (args) => {
         const { marketId, includeHolders } = args;
         const results = { metadata: { source: "Polymarket Oracle", marketId }, data: {} as Record<string, unknown> };
         
         const promises = [];
         promises.push(execNansen('research prediction-market market-screener', ['--market-id', marketId])
            .then(res => { results.data.marketInfo = res.success ? res.data : res.error; }));
            
         if (includeHolders) {
            promises.push(execNansen('research prediction-market top-holders', ['--market-id', marketId])
            .then(res => { results.data.holders = res.success ? res.data : res.error; }));
         }
         
         await Promise.all(promises);
         return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
};

export default polymarketOracleModule;
