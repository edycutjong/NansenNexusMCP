import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const nftMarketTrackerModule: RegisterableModule = {
  type: "tool",
  name: "nft-market-tracker",
  description: "Analyze NFT collections, tracking mints, volume, floor price trends, and Smart Money sweeping behaviors.",
  register(server: McpServer) {
    server.tool(
      "nft-market-tracker",
      "Scan NFT collections for Mint Master metrics, volume trends, and Smart Money accumulation",
      {
        collection: z.string().optional()
          .describe("Optional NFT contract address or slug to analyze specifically (otherwise returns market overview)"),
        chain: z.enum(["ethereum", "base", "polygon"])
          .default("ethereum")
          .describe("Blockchain network"),
        timeframe: z.enum(["1h", "24h", "7d", "30d"])
          .default("24h")
          .describe("Time window for analysis"),
        metric: z.enum(["volume", "floor_price", "smart_money_sweeps", "mints"])
          .default("smart_money_sweeps")
          .describe("Primary metric to track"),
      },
      async (args) => {
        const { collection, chain, timeframe, metric } = args;

        const cliArgs = [
          '--chain', chain,
          '--timeframe', timeframe,
          '--metric', metric,
        ];

        if (collection) {
          cliArgs.push('--collection', collection);
        }

        const response = await execNansen('research nft paradise', cliArgs);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                /* c8 ignore next */
                text: `Error executing Nansen NFT analysis on ${chain}: ${response.error || 'Unknown error'}`
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
                  collection: collection || "Market Overview",
                  chain,
                  timeframe,
                  metric,
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

export default nftMarketTrackerModule;
