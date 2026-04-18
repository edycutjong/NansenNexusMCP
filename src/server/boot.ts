import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { autoRegisterModules } from "../registry/auto-loader.js";

type TransportMode = "stdio" | "http";

// CRITICAL: Prevent any dependency (like dotenv) from writing to stdout
// and breaking the JSON-RPC over stdio transport.
const originalLog = console.log;
const originalStdoutWrite = process.stdout.write;

// Temporarily hijack stdout entirely during boot
console.log = console.error;
process.stdout.write = process.stderr.write.bind(process.stderr) as unknown as typeof process.stdout.write;

config();

// Once dotenv is done, it's safer to leave console.log redirected to stderr for stdio mode,
// but we MUST restore stdout.write so the MCP SDK can actually send JSON-RPC messages!
process.stdout.write = originalStdoutWrite;

export async function boot(
  mode?: TransportMode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  /* c8 ignore next */
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
    return { server, transport, mode: "stdio" };
  }

  // Restore console.log for HTTP mode
  console.log = originalLog;

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
    /* c8 ignore next */
    void transport.handleRequest(req, res, req.body);
  });

  const port = Number(process.env.PORT ?? 3000);
  const httpServer = app.listen(port, () => {
    /* c8 ignore next 4 */
    console.log(`Nansen Nexus MCP (HTTP) listening on http://localhost:${String(port)}/mcp`);
    console.log(`SSE endpoint: GET http://localhost:${String(port)}/mcp`);
    console.log(`JSON-RPC endpoint: POST http://localhost:${String(port)}/mcp`);
    console.log(`CORS origin: ${corsOrigin}`);
  });

  process.on("SIGINT", () => {
    /* c8 ignore start */
    console.log("Shutting down Nansen Nexus MCP...");
    void transport.close();
    httpServer.close(() => {
      process.exit(0);
    });
    /* c8 ignore stop */
  });

  return { server, transport, httpServer, mode: "http" };
}
