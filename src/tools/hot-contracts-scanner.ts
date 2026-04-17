import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const hotContractsModule: RegisterableModule = {
  type: "tool",
  name: "hot-contracts-scanner",
  description: "Discover trending smart contracts, new liquidity pools, and heavily interacted protocols using Nansen Smart Money data.",
  register(server: McpServer) {
    server.tool(
      "hot-contracts-scanner",
      "Scan for trending contracts and protocols that Smart Money is interacting with",
      {
        chain: z.enum(["ethereum", "base", "arbitrum", "polygon", "optimism", "bsc"])
          .default("ethereum")
          .describe("Blockchain network to scan"),
        timeframe: z.enum(["1h", "4h", "24h"])
          .default("24h")
          .describe("Time window for discovering trends"),
        limit: z.number().min(1).max(100).default(20)
          .describe("Maximum number of trending contracts to return"),
      },
      async (args) => {
        const { chain, timeframe, limit } = args;

        const cliArgs = [
          '--chain', chain,
          '--timeframe', timeframe,
          '--limit', String(limit),
        ];

        const response = await execNansen('research hot-contracts', cliArgs);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: `Error executing Nansen Hot Contracts scan on ${chain}: ${response.error || 'Unknown error'}`
              }
            ],
            isError: true
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                metadata: {
                  chain,
                  timeframe,
                  status: "live",
                  source: "Nansen CLI -> MCP Nexus"
                },
                data: response.data
              }, null, 2),
            },
          ],
        };
      }
    );
  }
};

export default hotContractsModule;
