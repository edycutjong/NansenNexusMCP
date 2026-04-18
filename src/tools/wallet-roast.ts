import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const walletRoastModule: RegisterableModule = {
  type: "tool",
  name: "wallet-roast",
  description: "Analyze a wallet's worst trades and PnL to generate comedic roasting material.",
  register(server: McpServer) {
    server.tool(
      "wallet-roast",
      "Compiles terrible trades, rekt PnL, and questionable onchain behaviors of a wallet for roasting.",
      {
        address: z.string().describe("Wallet address to deeply analyze and roast"),
        chain: z.string().default("ethereum").describe("Blockchain network")
      },
      async (args) => {
         const { address, chain } = args;
         const results = { metadata: { source: "Wallet Roaster (Viral)", target: address }, data: {} as Record<string, unknown> };
         
         const promises = [];
         promises.push(execNansen('research profiler pnl-summary', ['--address', address, '--chain', chain])
            .then(res => { results.data.pnlData = res.success ? res.data : res.error; }));
            
         promises.push(execNansen('research profiler transactions', ['--address', address, '--chain', chain])
            .then(res => { results.data.txHistory = res.success ? res.data : res.error; }));
            
         await Promise.all(promises);
         return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
};

export default walletRoastModule;
