import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Absolute path to agentmesh's node_modules (process.cwd() = agentmesh/ at runtime)
const NM = path.join(process.cwd(), "node_modules");

// Map domain to its specific MCP server configuration
const MCP_SERVERS: Record<string, McpServerConfig> = {
  crypto_monad: {
    command: "node",
    // Built from the monad-mcp-tutorial directory (sibling of agentmesh)
    args: [path.join(process.cwd(), "..", "monad-mcp-tutorial", "build", "index.js")],
  },
  github: {
    command: "node",
    args: [path.join(NM, "@modelcontextprotocol", "server-github", "dist", "index.js")],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "" },
  },
  filesystem: {
    command: "node",
    args: [
      path.join(NM, "@modelcontextprotocol", "server-filesystem", "dist", "index.js"),
      path.join(process.cwd(), ".."), // allow full monad-maestro repo root
    ],
  },
  web_search: {
    command: "node",
    args: [path.join(NM, "@modelcontextprotocol", "server-brave-search", "dist", "index.js")],
    env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY || "" },
  },
};

export async function runDomainMcpServer(
  domain: string,
  toolName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const config = MCP_SERVERS[domain];
  if (!config) {
    throw new Error(`No MCP Server configured for domain: ${domain}`);
  }

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: { ...(process.env as Record<string, string>), ...(config.env || {}) },
  });

  const client = new Client(
    { name: "agentmesh-worker", version: "0.1.0" },
    { capabilities: {} }
  );

  console.log(`[MCP] Connecting to server for domain: ${domain}...`);
  await client.connect(transport);
  console.log(`[MCP] Connected to ${domain}! Executing ${toolName}...`);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    return result;
  } catch (err) {
    console.error(`[MCP] Tool execution failed on ${domain}:`, err);
    throw err;
  } finally {
    await transport.close();
  }
}

/**
 * Fetch schema of all available tools from an MCP server.
 * Used to inject tool capabilities into the LLM worker prompt.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDomainTools(domain: string): Promise<any[]> {
  const config = MCP_SERVERS[domain];
  if (!config) return [];

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: { ...(process.env as Record<string, string>), ...(config.env || {}) },
  });

  const client = new Client(
    { name: "agentmesh-worker", version: "0.1.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    const response = await client.listTools();
    return response.tools || [];
  } finally {
    await transport.close();
  }
}
