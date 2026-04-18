import { z } from "zod";
import { execNansen } from "../lib/nansen-cli.js";

export const name = "perp-funding-monitor";
export const description = "Scan Perpetual Futures (Perps) markets for anomalies in open interest and funding rates to identify potential short-squeeze or long-squeeze setups.";

export const schema = z.object({
  token: z.string().optional().describe("Specific token symbol to analyze. If omitted, scans top leaderboard."),
});

export async function handler(args: z.infer<typeof schema>): Promise<string> {
  const result = await execNansen(
    args.token ? "research perp screener" : "research perp leaderboard", 
    args.token ? ["--token", args.token] : []
  );

  if (!result.success) {
    return `Failed to fetch perp data: ${result.error}`;
  }

  const items = (result.data as { data?: { symbol: string, fundingRate: number, openInterestChange24h: number }[] })?.data || [];
  
  if (items.length === 0) {
    return JSON.stringify({
      status: "mock",
      message: "Currently returning mock insights. In production, this parses raw perp data.",
      anomalies: [
        {
          token: "SOL",
          openInterestChange24h: "+15.2%",
          fundingRate: "-0.08%",
          setup: "Potential Short Squeeze",
          rationale: "High negative funding with rising OI indicates aggressive shorting. Any price bump may trigger liquidations."
        },
        {
          token: "WIF",
          openInterestChange24h: "+22.5%",
          fundingRate: "+0.15%",
          setup: "Overheated Longs",
          rationale: "Extremely high positive funding. Longs are paying a premium. Risk of long squeeze on minor correction."
        }
      ]
    }, null, 2);
  }

  // Real data parsing from Nansen payload
  const setups: Record<string, string>[] = [];

  for (const item of items) {
    const isNegativeFunding = item.fundingRate < 0;
    const oiSurge = item.openInterestChange24h > 10; // >10% surge

    if (isNegativeFunding && oiSurge) {
      setups.push({
        token: item.symbol,
        setup: "Potential Short Squeeze",
        openInterestChange24h: `${item.openInterestChange24h}%`,
        fundingRate: `${item.fundingRate}%`,
        rationale: "Rising OI + Negative Funding = Aggressive Shorting."
      });
    } else if (item.fundingRate > 0.1 && oiSurge) {
      setups.push({
        token: item.symbol,
        setup: "Overheated Longs",
        openInterestChange24h: `${item.openInterestChange24h}%`,
        fundingRate: `${item.fundingRate}%`,
        rationale: "High OI + High Positive Funding = Late longs at risk."
      });
    }
  }

  return JSON.stringify({
    scanType: args.token ? `Targeted scan on ${args.token}` : "Leaderboard anomaly scan",
    identifiedSetups: setups.length > 0 ? setups : "No extreme squeeze setups identified."
  }, null, 2);
}
