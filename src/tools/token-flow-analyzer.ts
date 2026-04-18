import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const tokenFlowModule: RegisterableModule = {
  type: "tool",
  name: "token-flow-analyzer",
  description: "Analyze token inflows and outflows across CEXs and DEXs using Nansen data. Detect accumulation/distribution patterns.",
  register(server: McpServer) {
    server.tool(
      "token-flow-analyzer",
      "Analyze token inflows/outflows across exchanges to detect accumulation or distribution",
      {
        token: z.string().min(1)
          .describe("Token symbol or contract address (e.g., 'ETH', 'USDC', '0x...')"),
        chain: z.enum(["ethereum", "base", "arbitrum", "polygon", "optimism", "bsc"])
          .default("ethereum")
          .describe("Blockchain network"),
        flowType: z.enum(["cex_inflow", "cex_outflow", "dex_volume", "bridge", "all"])
          .default("all")
          .describe("Type of token flow to analyze"),
        timeframe: z.enum(["1h", "4h", "24h", "7d", "30d"])
          .default("24h")
          .describe("Time window for analysis"),
      },
      async (args) => {
        const { token, chain, flowType, timeframe } = args;

        const cliArgs = [
          '--chain', chain,
          '--token', token,
        ];

        // Currently we map to 'token flow-intelligence' which gives a holistic view
        const response = await execNansen('research token flow-intelligence', cliArgs);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                /* c8 ignore next */
                text: `Error executing Nansen token analysis for ${token} on ${chain}: ${response.error || 'Unknown error'}`
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
                  token,
                  chain,
                  flowType,
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

export default tokenFlowModule;
