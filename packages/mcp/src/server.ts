import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { handleReact, handleSay, handleStatus, reactSchema, saySchema, type ToolContext } from "./tools.js";

export function createNekoDriftMcpServer(context: ToolContext): McpServer {
  const server = new McpServer({ name: "neko-drift", version: "0.0.0" }, {
    instructions: "Interact with the user's NekoDrift desktop companion. Use nekodrift_status first. Use nekodrift_say only for short status/personality messages, never code, logs, secrets, URLs, or file paths.",
  });

  server.registerTool("nekodrift_status", {
    title: "NekoDrift Status",
    description: "Check whether NekoDrift is reachable and which pet MCP events currently target.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async () => handleStatus(context));

  server.registerTool("nekodrift_react", {
    title: "NekoDrift React",
    description: "Set a short coding-oriented reaction on the NekoDrift desktop pet.",
    inputSchema: reactSchema,
    annotations: { readOnlyHint: false, idempotentHint: false },
  }, async (input) => handleReact(input, context));

  server.registerTool("nekodrift_say", {
    title: "NekoDrift Say",
    description: "Show a short safe message on the NekoDrift desktop pet. Do not send code, logs, secrets, URLs, or file paths.",
    inputSchema: saySchema,
    annotations: { readOnlyHint: false, idempotentHint: false },
  }, async (input) => handleSay(input, context));

  return server;
}
