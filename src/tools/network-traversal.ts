import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const networkTraversalModule: RegisterableModule = {
  type: "tool",
  name: "network-traversal",
  description: "BFS wallet traversal for Sybil detection and counterparty risk analysis.",
  register(server: McpServer) {
    server.tool(
      "network-traversal",
      "Performs BFS network traversal on a wallet address to find related entities, Sybil rings, and counterparties.",
      {
        address: z.string().describe("Root wallet address to start traversal"),
        chain: z.string().default("ethereum").describe("Blockchain network"),
        depth: z.number().max(3).default(1).describe("Traversal depth level (max 3)")
      },
      async (args) => {
         const { address, chain, depth } = args;
         const results = { metadata: { source: "Network Traversal (RedString)", root: address, depth }, data: {} as Record<string, unknown> };
         
         const promises = [];
         promises.push(execNansen('research profiler counterparties', ['--address', address, '--chain', chain])
            .then(res => { results.data.counterparties = res.success ? res.data : res.error; }));
            
         promises.push(execNansen('research profiler related-wallets', ['--address', address, '--chain', chain])
            .then(res => { results.data.relatedWallets = res.success ? res.data : res.error; }));
            
         await Promise.all(promises);
         return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
};

export default networkTraversalModule;
