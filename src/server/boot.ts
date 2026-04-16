import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { autoRegisterModules } from "../registry/auto-loader.js";

type TransportMode = "stdio" | "http";

config();

export async function boot(
  mode?: TransportMode
): Promise<void> {
  const transportMode = mode ?? (process.env.STARTER_TRANSPORT as TransportMode | undefined) ?? "stdio";
  const server = new McpServer(
    {
      name: "nansen-nexus-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        completions: {},
      },
    }
  );

  await autoRegisterModules(server);

  if (transportMode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Nansen Nexus MCP running on stdio");
    return;
  }

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const corsOrigin = process.env.CORS_ORIGIN ?? "*";
  app.use(cors({ 
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "x-mcp-session", "x-mcp-session-id"],
    exposedHeaders: ["x-mcp-session-id"]
  }));

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  await server.connect(transport);

  app.all("/mcp", (req, res) => {
    void transport.handleRequest(req, res, req.body);
  });

  const port = Number(process.env.PORT ?? 3000);
  const httpServer = app.listen(port, () => {
    console.log(`Nansen Nexus MCP (HTTP) listening on http://localhost:${String(port)}/mcp`);
    console.log(`SSE endpoint: GET http://localhost:${String(port)}/mcp`);
    console.log(`JSON-RPC endpoint: POST http://localhost:${String(port)}/mcp`);
    console.log(`CORS origin: ${corsOrigin}`);
  });

  process.on("SIGINT", () => {
    console.log("Shutting down Nansen Nexus MCP...");
    void transport.close();
    httpServer.close(() => {
      process.exit(0);
    });
  });
}
