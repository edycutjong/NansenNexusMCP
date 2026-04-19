# 🧠 Nansen Nexus MCP

> **Compound Skills Router for AI Agents** — Enterprise-grade MCP server exposing Nansen on-chain intelligence as composable AI tools.

[![CI](https://github.com/edycutjong/NansenNexusMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/NansenNexusMCP/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-stable-brightgreen)](https://github.com/edycutjong/NansenNexusMCP)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.20-8B5CF6?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw0IDdWMTdMMTIgMjJMMjAgMTdWN0wxMiAyWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+)](https://modelcontextprotocol.io/)
[![Node 20](https://img.shields.io/badge/node-20-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Node 22](https://img.shields.io/badge/node-22-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Node 24](https://img.shields.io/badge/node-24-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tools](https://img.shields.io/badge/tools-13-orange)](src/tools/)
[![Tests](https://img.shields.io/badge/tests-21%20files-success)](tests/)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/edycutjong/NansenNexusMCP)
[![Nansen CLI](https://img.shields.io/badge/Nansen%20CLI-50%2B%20endpoints-FF6B35)](https://docs.nansen.ai/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)

---

## 🎯 What is this?

**Nansen Nexus MCP** is the capstone of a [4-week build challenge](https://academy.nansen.ai/en/help/articles/6399546-nansen-cli-builds) where 90+ developers competed to build the best Nansen CLI integrations. After shipping 4 projects, writing **698 tests**, and placing **🥈 2nd Place in Week 2**, the pattern became clear:

> _Everyone built retail dashboards. Nobody built **infrastructure for AI agents.**_

Nexus fills that gap. It wraps Nansen's entire on-chain intelligence surface into **MCP-standardized compound skills** that any AI agent (Claude, Cursor, Windsurf, etc.) can invoke via JSON-RPC — turning hackathon-winning logic into reusable AI plumbing.

### Why MCP?

The Nansen Growth Manager on the **API / MCP team** identified compound workflows as the highest-leverage integration pattern. Instead of piping raw JSON into prompts, Nexus pre-packages multi-step analytics (Sybil detection, Wyckoff classification, SM divergence scoring) as single tool calls — reducing token spend, latency, and hallucinations.

---

## 🏗️ Architecture

![Nansen Nexus MCP Architecture](./docs/architecture.png)

---

## 🧬 Origin Story

Each of the 13 tools has a lineage — either derived from our own challenge projects or aggregated from the 28 best open-source community submissions:

### 🏆 From Our Challenge Projects

| Tool | Origin Project | Challenge Week |
|------|---------------|----------------|
| `polymarket-oracle` | [Nansen Polymarket Oracle](https://github.com/edycutjong/nansen-polymarket-oracle) | Week 3 — First tool to use prediction market endpoints |
| `network-traversal` | [Project RedString](https://github.com/edycutjong/NansenRedString) | Week 4 — BFS wallet forensics + 3D WebGL graph |
| `wallet-roast` | Inspired by Cookd.wtf (@HeavyOT) | Week 1 winner — virality > complexity |
| `stable-shield` | Strategic B2B gap identified in deep analysis | Institutional stablecoin parking monitor |
| `wyckoff-screener` | Trading signal analysis | Token phase classification |

### 🛠 From Community Aggregation

| Tool | Source Repos | What It Bundles |
|------|-------------|-----------------|
| `airdrop-eligibility` | eligibility-dashboard, onchain-activity-radar | Airdrop scoring + Sybil checks |
| `smart-money-copy-trade` | nansen-hunt-alpha, sm-divergence-detector, +1 | High-conviction SM copy list |
| `perp-funding-monitor` | apexhunter-skill, nansensei, nansen-cli-tools | Funding rate anomaly detection |

---

## 🚀 Quick Start

Choose your preferred way to run the MCP server: **Make**, **Docker**, or **Manual NPM**.

### Option A: Using `make` (Recommended)

The included `Makefile` abstracts all the setup and execution commands.

```bash
# 1. Install dependencies and create .env
make setup
# ⚠️ Edit .env and insert your NANSEN_API_KEY

# 2. Build the project
make build

# 3. Run the interactive MCP Inspector UI
make inspect

# 4. Or, run in Stdio mode (for Cursor / Claude Desktop)
make serve-stdio
```

### Option B: Using Docker

Perfect for cloud deployments (like Cloud Run) or keeping your local environment clean. The server runs on HTTP transport by default.

```bash
# 1. Create your env file
cp .env.example .env
# ⚠️ Edit .env and insert your NANSEN_API_KEY

# 2. Build and spin up the container in the background
docker compose up --build -d

# 3. View live logs
docker compose logs -f

# 4. Shut down when finished
docker compose down
```

*(Alternatively, you can just use `make docker-up` and `make docker-down`)*

### Option C: Manual NPM

For developers looking to run commands manually.

```bash
# 1. Install dependencies
npm install

# 2. Configure API key
cp .env.example .env
# ⚠️ Edit .env and insert your NANSEN_API_KEY

# 3. Build & run (stdio mode — for Claude Desktop / Cursor)
npm run build
npm run serve:stdio

# 4. Or run in HTTP mode (for remote agents)
npm run serve:http
```
### Register in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nansen-nexus": {
      "command": "node",
      "args": ["/path/to/NansenNexusMCP/build/index.js"]
    }
  }
}
```

---

## 🛠️ Available Tools

| Tool | Description | Key Params |
|------|-------------|------------|
| `smart-money-tracker` | Track labeled wallet movements across chains | `chain`, `timeframe`, `entityType` |
| `token-flow-analyzer` | CEX/DEX inflow/outflow analysis | `token`, `chain`, `flowType` |
| `wallet-profiler` | Full wallet dossier: labels, PnL, history | `address`, `chain`, `includePnl` |
| `hot-contracts-scanner` | Discover trending Smart Money contracts | `chain`, `timeframe`, `limit` |
| `nft-market-tracker` | NFT collection volume, floor, sweeps | `collection`, `chain`, `metric` |
| `network-traversal` | BFS wallet traversal for Sybil detection | `address`, `chain`, `depth` |
| `polymarket-oracle` | Polymarket odds vs Smart Money divergence | `marketId`, `includeHolders` |
| `stable-shield` | Monitor institutional stablecoin parking | `address`, `chain` |
| `wallet-roast` | Analyze worst trades for roasting material | `address`, `chain` |
| `wyckoff-screener` | Screen tokens for Wyckoff phases | `tokenAddress`, `chain` |
| `perp-funding-monitor` | Perp market funding rate anomalies | `token` |
| `smart-money-copy-trade` | High-conviction copy-trade signals | `chain`, `minTradeUsd` |
| `airdrop-eligibility` | Estimate wallet airdrop eligibility | `address` |

### 🔍 Example Outputs

<!-- EXAMPLES_START -->

<details>
<summary><code>airdrop-eligibility</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "pagination": {
          "page": 1,
          "per_page": 10,
          "is_last_page": true
        },
        "data": []
      }
    }
  }
}
```

</details>

<details>
<summary><code>hot-contracts-scanner</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": false,
    "error": "Unknown research category: hot-contracts. Available: smart-money, profiler, token, search, perp, portfolio, points, prediction-market",
    "code": "UNKNOWN",
    "status": null
  }
}
```

</details>

<details>
<summary><code>network-traversal</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "pagination": {
          "page": 1,
          "per_page": 10,
          "is_last_page": true
        },
        "data": []
      }
    }
  }
}
```

</details>

<details>
<summary><code>nft-market-tracker</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "nfts": [
        "pudgy"
      ]
    },
    "cmd": "research nft paradise",
    "args": [
      "--chain",
      "ethereum",
      "--timeframe",
      "24h",
      "--metric",
      "volume",
      "--collection",
      "0x123"
    ]
  }
}
```

</details>

<details>
<summary><code>perp-funding-monitor</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "data": [
          {
            "volume": 70088716064.8529,
            "buy_volume": 35365202382.73637,
            "sell_volume": 34723513682.11654,
            "buy_sell_pressure": 641688700.61983,
            "trader_count": 82712,
            "token_symbol": "BTC",
            "mark_price": 75669,
            "funding": -0.0000183626,
            "open_interest": 2141165415.90468,
            "previous_price_usd": 71213
          },
          {
            "volume": 6683711284.2131,
            "buy_volume": 3464331241.1264,
            "sell_volume": 3219380043.0867,
            "buy_sell_pressure": 244951198.0397,
            "trader_count": 20986,
            "token_symbol": "xyz:SP500",
... (truncated 111 lines) ...
}
```

</details>

<details>
<summary><code>polymarket-oracle</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "pagination": {
          "page": 1,
          "per_page": 10,
          "is_last_page": false
        },
        "data": [
          {
            "market_id": "1994007",
            "question": "Israel x Hezbollah ceasefire by April 18, 2026?",
            "slug": "israel-x-hezbollah-ceasefire-by-april-18-2026",
            "event_id": "242420",
            "event_title": "Israel x Hezbollah ceasefire by...?",
            "active": true,
            "closed": false,
            "end_date": "2026-04-15T00:00:00",
            "neg_risk": false,
            "tags": [
              "Iran",
              "Israel",
              "Geopolitics",
... (truncated 331 lines) ...
}
```

</details>

<details>
<summary><code>smart-money-copy-trade</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "data": [
          {
            "chain": "ethereum",
            "block_timestamp": "2026-04-19T00:36:59",
            "transaction_hash": "0xfaaa17a02ec4cba8019f010d33f529981a5971d7dd69d5a8a190ccfdda699abc",
            "trader_address": "0xbdd705c1bea262817f6d3a5cf480cceccae8d0ab",
            "trader_address_label": "Token Millionaire",
            "token_bought_address": "0x7a76db883446022ecbc86b9280e34055ec1be05c",
            "token_sold_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "token_bought_amount": 187944.962598919,
            "token_sold_amount": 666,
            "token_bought_symbol": "RISE",
            "token_sold_symbol": "USDC",
            "token_bought_age_days": 482,
            "token_sold_age_days": 2816,
            "token_bought_market_cap": null,
            "token_sold_market_cap": 78499325560,
            "token_bought_fdv": 275882.872900164,
            "token_sold_fdv": 78499721374,
            "trade_value_usd": 665.8997310560211
... (truncated 191 lines) ...
}
```

</details>

<details>
<summary><code>smart-money-tracker</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "data": [
          {
            "token_address": "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
            "token_symbol": "LDO",
            "net_flow_1h_usd": 0,
            "net_flow_24h_usd": 253442.34317953387,
            "net_flow_7d_usd": 253442.34317953387,
            "net_flow_30d_usd": 253442.3311766702,
            "chain": "ethereum",
            "token_sectors": [],
            "trader_count": 3,
            "token_age_days": 1949,
            "market_cap_usd": 322227915
          },
          {
            "token_address": "0x8390a1da07e376ef7add4be859ba74fb83aa02d5",
            "token_symbol": "GROK",
            "net_flow_1h_usd": 0,
            "net_flow_24h_usd": 23568.647689030906,
            "net_flow_7d_usd": 23568.647689030906,
... (truncated 130 lines) ...
}
```

</details>

<details>
<summary><code>stable-shield</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "summary": {
          "total_value_usd": 0,
          "total_assets_usd": 0,
          "total_debts_usd": 0,
          "total_rewards_usd": 0,
          "token_count": 0,
          "protocol_count": 0
        },
        "protocols": []
      }
    }
  }
}
```

</details>

<details>
<summary><code>token-flow-analyzer</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "data": [
          {
            "public_figure_net_flow_usd": 0,
            "public_figure_avg_flow_usd": null,
            "public_figure_wallet_count": 0,
            "top_pnl_net_flow_usd": 0,
            "top_pnl_avg_flow_usd": null,
            "top_pnl_wallet_count": 0,
            "whale_net_flow_usd": 0,
            "whale_avg_flow_usd": null,
            "whale_wallet_count": 0,
            "smart_trader_net_flow_usd": 0,
            "smart_trader_avg_flow_usd": null,
            "smart_trader_wallet_count": 0,
            "exchange_net_flow_usd": 0,
            "exchange_avg_flow_usd": null,
            "exchange_wallet_count": 0,
            "fresh_wallets_net_flow_usd": 0,
            "fresh_wallets_avg_flow_usd": 0,
            "fresh_wallets_wallet_count": 0
... (truncated 7 lines) ...
}
```

</details>

<details>
<summary><code>wallet-profiler</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "pagination": {
          "page": 1,
          "per_page": 1,
          "is_last_page": true
        },
        "top5_tokens": [],
        "traded_token_count": 0,
        "traded_times": 0,
        "realized_pnl_usd": 0,
        "realized_pnl_percent": 0,
        "win_rate": 0
      }
    }
  }
}
```

</details>

<details>
<summary><code>wallet-roast</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "pagination": {
          "page": 1,
          "per_page": 20,
          "is_last_page": true
        },
        "data": []
      }
    }
  }
}
```

</details>

<details>
<summary><code>wyckoff-screener</code></summary>

```json
{
  "metadata": {
    "status": "historical_live",
    "source": "Nansen CLI -> MCP Nexus"
  },
  "data": {
    "success": true,
    "data": {
      "success": true,
      "data": {
        "data": {
          "name": "",
          "symbol": "",
          "contract_address": "0xd8da6bf26964af9d7eed9e03e53415dd37ae6abf",
          "logo": "",
          "token_details": {
            "token_deployment_date": "",
            "website": "",
            "x": "",
            "telegram": "",
            "market_cap_usd": 0,
            "fdv_usd": 0,
            "circulating_supply": 0,
            "total_supply": 0
          },
          "spot_metrics": {
            "volume_total_usd": 0,
            "buy_volume_usd": 0,
            "sell_volume_usd": 0,
            "total_buys": 0,
... (truncated 11 lines) ...
}
```

</details>
<!-- EXAMPLES_END -->

---

## 📊 Nansen CLI Endpoint Coverage

Nexus exercises **50+ unique Nansen CLI endpoints** across all 13 tools — the deepest coverage of any single MCP integration:

| Endpoint Family | Tools Using It |
|-----------------|---------------|
| `research smart-money netflow/dex-trades/holdings` | smart-money-tracker, copy-trade, stable-shield |
| `research token info/indicators/ohlcv/screener` | token-flow-analyzer, wyckoff-screener |
| `research token flow-intelligence/who-bought-sold` | token-flow-analyzer, wyckoff-screener |
| `research profiler balance/labels/pnl/trace` | wallet-profiler, network-traversal, wallet-roast |
| `research profiler counterparties/related-wallets` | network-traversal (BFS Sybil detection) |
| `research prediction-market *` (12 sub-endpoints) | polymarket-oracle |
| `research perp screener/leaderboard` | perp-funding-monitor |
| `research portfolio defi` | stable-shield |

---

## 📂 Project Structure

```
src/
├── index.ts                        # Entry point
├── server/
│   └── boot.ts                     # Dual transport (stdio/HTTP) server
├── lib/
│   └── nansen-cli.ts               # CLI wrapper (child_process.execFile)
├── registry/
│   ├── auto-loader.ts              # Auto-discovery engine
│   ├── helpers.ts                  # Module loading utilities
│   ├── module-processor.ts         # Validation & registration
│   └── types.ts                    # RegisterableModule interface
├── tools/
│   ├── smart-money-tracker.ts      # Smart Money movements
│   ├── token-flow-analyzer.ts      # Token flow intelligence
│   ├── wallet-profiler.ts          # Wallet dossier
│   ├── hot-contracts-scanner.ts    # Trending contracts
│   ├── nft-market-tracker.ts       # NFT market analysis
│   ├── network-traversal.ts        # BFS Sybil detection
│   ├── polymarket-oracle.ts        # Prediction market oracle
│   ├── stable-shield.ts            # Stablecoin institutional guardian
│   ├── wallet-roast.ts             # Wallet roasting
│   ├── wyckoff-screener.ts         # Wyckoff phase classifier
│   ├── perp-funding-monitor.ts     # Perp funding anomalies
│   ├── smart-money-copy-trade.ts   # Copy-trade signals
│   └── airdrop-eligibility.ts      # Airdrop scoring
└── resources/
    └── server-status.ts            # Server health resource
```

All tools are auto-discovered at boot via the module registry system. **Just drop a `.ts` file in `src/tools/` and it's live.**

---

## 🧪 Development

```bash
# Type-check
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Interactive REPL
npm run dev

# MCP Inspector
npm run inspect

# Generate new tool
npm run gen:tool
```

---

## 🐳 Docker

```bash
# Build & run
docker compose up --build

# With API key
NANSEN_API_KEY=your_key docker compose up --build
```

---

## 🏆 Challenge Context

This project is the **5th build** in a progressive arc across the Nansen CLI Build Challenge (March–April 2026):

| Week | Project | Result | What It Proved |
|------|---------|--------|----------------|
| 1 | [Make Alpha](https://github.com/edycutjong/nansen-make-alpha) | Unplaced | Zero-dep data compilation |
| 2 | [NansenTerm](https://github.com/edycutjong/nansen-term) | **🥈 2nd Place** (100K Credits) | Interactive TUI + live streaming |
| 3 | [Polymarket Oracle](https://github.com/edycutjong/nansen-polymarket-oracle) | Submitted | Predictive SM divergence scoring |
| 4 | [Project RedString](https://github.com/edycutjong/NansenRedString) | Submitted | Forensic 3D graph visualization |
| **5** | **Nansen Nexus MCP** | **Capstone** | **Enterprise MCP infrastructure** |

### Season Stats

| Metric | Value |
|--------|-------|
| Projects shipped | **5** |
| Total tests (all projects) | **698+** |
| Total TypeScript LOC | **~23,000+** |
| Nansen CLI endpoints used | **50+** |
| Best placement | **🥈 2nd Place (Week 2)** |
| Prize won | **100,000 Nansen API Credits** |

---

## 🔗 Related Projects

| Project | Description |
|---------|-------------|
| [nansen-make-alpha](https://github.com/edycutjong/nansen-make-alpha) | Zero-dep Makefile alpha compiler |
| [nansen-term](https://github.com/edycutjong/nansen-term) | Bloomberg-style TUI for Nansen CLI |
| [nansen-polymarket-oracle](https://github.com/edycutjong/nansen-polymarket-oracle) | SM × Polymarket divergence scoring |
| [NansenRedString](https://github.com/edycutjong/NansenRedString) | Forensic 3D wallet graph visualizer |

---

## 📄 License

MIT — Built by [@edycutjong](https://github.com/edycutjong) for the Nansen ecosystem.
