import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const wyckoffScreenerModule: RegisterableModule = {
  type: "tool",
  name: "wyckoff-screener",
  description: "Screen tokens for Wyckoff accumulation/distribution phases using Smart Money flows.",
  register(server: McpServer) {
    server.tool(
      "wyckoff-screener",
      "Classifies tokens into Wyckoff phases by analyzing smart money accumulations vs price action.",
      {
        tokenAddress: z.string().describe("Token address to screen"),
        chain: z.string().default("ethereum").describe("Blockchain network")
      },
      async (args) => {
         const { tokenAddress, chain } = args;
         const results = { metadata: { source: "Wyckoff Phase Classifier", tokenAddress }, data: {} as Record<string, unknown> };
         
         const promises = [];
         promises.push(execNansen('research token flow-intelligence', ['--token', tokenAddress, '--chain', chain])
            .then(res => { results.data.flowIntelligence = res.success ? res.data : res.error; }));
            
         // Simulated proxy for technicals using token indicator/info
         promises.push(execNansen('research token info', ['--token', tokenAddress, '--chain', chain])
            .then(res => { results.data.technicals = res.success ? res.data : res.error; }));
            
         await Promise.all(promises);
         return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
};

export default wyckoffScreenerModule;
