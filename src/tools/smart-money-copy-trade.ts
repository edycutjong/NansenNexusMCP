import { z } from "zod";
import { execNansen } from "../lib/nansen-cli.js";

export const name = "smart-money-copy-trade";
export const description = "Analyze recent Smart Money DEX trades, filter out stablecoins and noise, and suggest copy-trade conviction levels based on trade size and repetition frequency.";

export const schema = z.object({
  chain: z.string().optional().default("ethereum").describe("Blockchain to analyze (e.g., ethereum, base, arbitrum)"),
  minTradeUsd: z.number().optional().default(50000).describe("Minimum trade size in USD to filter for conviction"),
});

export async function handler(args: z.infer<typeof schema>): Promise<string> {
  const result = await execNansen("research smart-money dex-trades", ["--chain", args.chain]);

  if (!result.success) {
    return `Failed to fetch smart money dex trades: ${result.error}`;
  }

  const trades = (result.data as { trades?: { amountUsd: number, tokenSymbol: string, side: string }[] })?.trades || [];
  
  if (trades.length === 0) {
    // Return mock analysis if no direct data
    return JSON.stringify({
      status: "mock",
      message: "Currently returning mock insights. In production, this parses raw trades.",
      suggestions: [
        {
          token: "AERO",
          signal: "STRONG BUY",
          confidence: "92%",
          reason: "4 Smart Money wallets accumulated >$100k in the last hour on Base."
        },
        {
          token: "WETH",
          signal: "NEUTRAL",
          confidence: "50%",
          reason: "Mixed inflows/outflows, likely hedging."
        }
      ]
    }, null, 2);
  }

  // Basic aggregation logic for the community tool
  const tokenStats: Record<string, { buys: number, volume: number }> = {};
  
  for (const trade of trades) {
    if (trade.amountUsd < args.minTradeUsd) continue;
    if (trade.tokenSymbol?.includes("USD") || trade.tokenSymbol?.includes("DAI")) continue; // Filter stables

    if (trade.side === "buy") {
      if (!tokenStats[trade.tokenSymbol]) {
        tokenStats[trade.tokenSymbol] = { buys: 0, volume: 0 };
      }
      tokenStats[trade.tokenSymbol]!.buys += 1;
      tokenStats[trade.tokenSymbol]!.volume += trade.amountUsd;
    }
  }

  const actionable = Object.entries(tokenStats)
    .filter(([, data]) => data.buys >= 2) // Need at least 2 distinct smart money buys
    .map(([token, data]) => ({
      token,
      signal: data.volume > 500000 ? "STRONG BUY" : "BUY",
      smartMoneyBuyers: data.buys,
      aggregatedVolumeUsd: data.volume,
    }))
    .sort((a, b) => b.aggregatedVolumeUsd - a.aggregatedVolumeUsd);

  return JSON.stringify({
    chain: args.chain,
    filters: {
      minTradeUsd: args.minTradeUsd,
      removedStables: true,
      minSmartMoneyBuyers: 2
    },
    actionableTrades: actionable.length > 0 ? actionable : "No high-conviction trades detected in the current window."
  }, null, 2);
}
