# 🧠 Nansen Nexus MCP

> **Compound Skills Router for AI Agents** — Enterprise-grade MCP server exposing Nansen on-chain intelligence as composable AI tools.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.20-purple)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)

---

## 🎯 What is this?

Nansen Nexus MCP transforms Nansen's on-chain analytics into **MCP-standardized compound skills** that any AI agent (Claude, Cursor, Windsurf, etc.) can invoke via JSON-RPC.

Instead of building one-off CLI tools, Nexus exposes:
- **Smart Money Tracking** — Follow whale/fund/DAO wallets across chains
- **Token Flow Analysis** — Detect CEX inflow/outflow patterns, bridge activity
- **Wallet Profiling** — Full wallet dossier: labels, PnL, portfolio, history

All tools are auto-discovered at boot via the module registry system. **Just drop a `.ts` file in `src/tools/` and it's live.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          AI Agent (Claude / Cursor)          │
│                                             │
│  "Track smart money on Ethereum last 24h"   │
└─────────────┬───────────────────────────────┘
              │ JSON-RPC (stdio / HTTP)
              ▼
┌─────────────────────────────────────────────┐
│           Nansen Nexus MCP Server           │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Tools  │ │Resources │ │   Prompts   │  │
│  ├─────────┤ ├──────────┤ ├─────────────┤  │
│  │ smart-  │ │ server-  │ │ (planned)   │  │
│  │ money   │ │ status   │ │             │  │
│  │ tracker │ │          │ │             │  │
│  ├─────────┤ └──────────┘ └─────────────┘  │
│  │ token-  │                                │
│  │ flow    │      Auto-Discovery Registry   │
│  │ analyzer│      ─────────────────────     │
│  ├─────────┤      Drop .ts in src/tools/    │
│  │ wallet- │      → auto-registered         │
│  │ profiler│                                │
│  └─────────┘                                │
└─────────────┬───────────────────────────────┘
              │ REST
              ▼
┌─────────────────────────────────────────────┐
│            Nansen API v2                    │
│  Smart Money • Labels • Flows • Portfolio   │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API key
cp .env.example .env
# Edit .env with your NANSEN_API_KEY

# 3. Build & run (stdio mode — for Claude Desktop / Cursor)
npm run build
npm run serve:stdio

# 4. Or run in HTTP mode (for remote agents / Docker)
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
| `smart-money-tracker` | Track labeled wallet movements | `chain`, `timeframe`, `entityType` |
| `token-flow-analyzer` | CEX/DEX flow analysis | `token`, `chain`, `flowType` |
| `wallet-profiler` | Full wallet dossier | `address`, `chain`, `includePnl` |

---

## 📂 Project Structure

```
src/
├── index.ts                    # Entry point
├── server/
│   └── boot.ts                 # Dual transport (stdio/HTTP) server
├── registry/
│   ├── auto-loader.ts          # Auto-discovery engine
│   ├── helpers.ts              # Module loading utilities
│   ├── module-processor.ts     # Validation & registration
│   └── types.ts                # RegisterableModule interface
├── tools/
│   ├── smart-money-tracker.ts  # Smart Money skill
│   ├── token-flow-analyzer.ts  # Token Flow skill
│   └── wallet-profiler.ts      # Wallet Profiling skill
└── resources/
    └── server-status.ts        # Server health resource
```

---

## 🧪 Development

```bash
# Type-check
npm run typecheck

# Run tests
npm test

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

## 📄 License

MIT — Built by [@edycutjong](https://github.com/edycutjong) for the Nansen ecosystem.
