import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execNansen } from "../lib/nansen-cli.js";

const walletProfilerModule: RegisterableModule = {
  type: "tool",
  name: "wallet-profiler",
  description: "Build a comprehensive profile of any wallet address using Nansen labels, transaction history, and portfolio composition.",
  register(server: McpServer) {
    server.tool(
      "wallet-profiler",
      "Profile any wallet address: Nansen labels, PnL, portfolio, transaction patterns",
      {
        address: z.string().min(1)
          .describe("Wallet address to profile (e.g., '0x...')"),
        chain: z.enum(["ethereum", "base", "arbitrum", "polygon", "optimism", "bsc"])
          .default("ethereum")
          .describe("Blockchain network"),
        includeHistory: z.boolean().default(true)
          .describe("Include recent transaction history"),
        includePnl: z.boolean().default(true)
          .describe("Include profit/loss analysis"),
      },
      async (args) => {
        const { address, chain, includeHistory, includePnl } = args;

        const results = {
          metadata: {
            address,
            chain,
            status: "live",
            source: "Nansen CLI -> MCP Nexus"
          },
          data: {} as Record<string, unknown>
        };

        const promises = [];

        // Always fetch balance
        promises.push(
          execNansen('research profiler balance', ['--address', address, '--chain', chain])
            .then(res => { if (res.success) results.data.balance = res.data; else results.data.balanceError = res.error; })
        );

        if (includePnl) {
          promises.push(
            execNansen('research profiler pnl-summary', ['--address', address, '--chain', chain])
              .then(res => { if (res.success) results.data.pnl = res.data; else results.data.pnlError = res.error; })
          );
        }

        if (includeHistory) {
          promises.push(
            execNansen('research profiler transactions', ['--address', address, '--chain', chain])
              .then(res => { if (res.success) results.data.history = res.data; else results.data.historyError = res.error; })
          );
        }

        await Promise.all(promises);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }
    );
  }
};

export default walletProfilerModule;
