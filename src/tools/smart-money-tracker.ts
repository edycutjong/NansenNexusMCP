import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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

        const result = {
          chain,
          timeframe,
          entityType,
          limit,
          status: "placeholder",
          message: `Smart Money Tracker ready — will query Nansen API for ${entityType} entities on ${chain} over ${timeframe}. Limit: ${String(limit)}.`,
          nextStep: "Connect NANSEN_API_KEY in .env to activate live data.",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }
};

export default smartMoneyModule;
