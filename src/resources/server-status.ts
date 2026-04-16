import * as os from "os";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const serverStatusModule: RegisterableModule = {
  type: "resource",
  name: "server-status",
  description: "Get Nansen Nexus MCP server status, uptime, and registered skills",
  register(server: McpServer) {
    server.resource(
      "server-status",
      "nexus://status",
      {
        description: "Current status of the Nansen Nexus MCP server",
      },
      () => {
        return {
          contents: [
            {
              uri: "nexus://status",
              mimeType: "application/json",
              text: JSON.stringify({
                name: "nansen-nexus-mcp",
                version: "1.0.0",
                status: "running",
                platform: os.platform(),
                architecture: os.arch(),
                nodeVersion: process.version,
                uptime: os.uptime(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                nansenApiConfigured: process.env.NANSEN_API_KEY !== undefined,
              }, null, 2),
            },
          ],
        };
      }
    );
  }
};

export default serverStatusModule;
