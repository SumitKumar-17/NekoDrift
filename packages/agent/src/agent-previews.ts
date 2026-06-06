import { isAbsolute, join } from "node:path";

export const agentMcpServerName = "nekodrift";
export const nekoDriftCliPackageName = "@neko-drift/cli";
export type AgentCommandMode = "published" | "local" | "bundled";

export interface AgentMcpEntry {
  readonly type: "local";
  readonly command: readonly string[];
  readonly enabled: true;
  readonly environment?: Record<string, string>;
}

export interface AgentPreviewOptions {
  readonly cliVersion: string;
  readonly petId?: string;
  readonly commandMode?: AgentCommandMode;
  readonly cliEntryPath?: string;
  readonly environment?: Record<string, string>;
}

export function validateNekoDriftPetArg(value: string): string {
  const trimmed = value.trim();
  if (trimmed !== value || trimmed.length < 1) throw new Error("Invalid NekoDrift pet id.");
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(trimmed)) throw new Error("Invalid NekoDrift pet id.");
  return trimmed;
}

export function buildAgentMcpEntry(options: AgentPreviewOptions): AgentMcpEntry {
  const petArgs = options.petId === undefined ? [] : ["--pet", validateNekoDriftPetArg(options.petId)];
  const mode = options.commandMode ?? "published";
  const environment = options.environment && Object.keys(options.environment).length > 0 ? { environment: options.environment } : {};
  if (mode === "local" || mode === "bundled") {
    if (!options.cliEntryPath || !isAbsolute(options.cliEntryPath)) throw new Error("Agent local MCP preview requires an absolute CLI entry path.");
    return { type: "local", command: ["node", options.cliEntryPath, "mcp", ...petArgs], enabled: true, ...environment };
  }
  return { type: "local", command: ["npx", "-y", `${nekoDriftCliPackageName}@${options.cliVersion}`, "mcp", ...petArgs], enabled: true, ...environment };
}

export function buildAgentInstructionPath(scope: "project" | "global", configDir?: string): string {
  if (scope === "project") return ".opencode/nekodrift.md";
  if (!configDir) throw new Error("Global Agent instruction path requires config directory.");
  return join(configDir, "nekodrift.md");
}

export type AgentPluginSpec = string | readonly [string, { readonly pet?: string }];

export function buildAgentPluginPreview(petId?: string, packageVersion?: string): AgentPluginSpec {
  const spec = packageVersion ? `@neko-drift/agent@${packageVersion}` : "@neko-drift/agent";
  return petId === undefined ? spec : [spec, { pet: validateNekoDriftPetArg(petId) }];
}

export function formatAgentMcpConfig(options: AgentPreviewOptions): Record<string, unknown> {
  return { mcp: { [agentMcpServerName]: buildAgentMcpEntry(options) } };
}
