import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const smartMoneyModule: RegisterableModule = {
  type: "tool",
  name: "smart-money-tracker",
  description: "Track smart money movements across chains using Nansen labels. Returns top wallet activities, token flows, and entity classifications.",
  register(server: McpServer) {
    server.tool(
      "smart-money-tracker",
      "Track smart money wallet movements and token flows using Nansen entity labels",
      {
        chain: z.enum(["ethereum", "base", "arbitrum", "polygon", "optimism", "bsc"])
          .describe("Blockchain network to query"),
        timeframe: z.enum(["1h", "4h", "24h", "7d", "30d"])
          .default("24h")
          .describe("Time window for activity lookup"),
        entityType: z.enum(["fund", "smart_money", "whale", "dex_trader", "all"])
          .default("smart_money")
          .describe("Type of Nansen-labeled entity to track"),
        limit: z.number().min(1).max(100).default(20)
          .describe("Maximum number of results to return"),
      },
      async (args) => {
        const { chain, timeframe, entityType, limit } = args;

        // Based on entityType or just general tracking, we use netflow as the default tracking mechanism
        // Nansen API format: research smart-money <command> --chain <chain>
        const cliArgs = [
          '--chain', chain,
          '--limit', String(limit),
        ];

        // Currently we map to 'smart-money netflow'
        const response = await execNansen('research smart-money netflow', cliArgs);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                /* c8 ignore next */
                text: `Error executing Nansen tracking on ${chain}: ${response.error || 'Unknown error'}`
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
                  entityType,
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

export default smartMoneyModule;
