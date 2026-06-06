import { isAbsolute, join } from "node:path";

export const cursorMcpServerName = "nekodrift";
export const openPetsMcpPackageName = "@neko-drift/mcp";
export type CursorCommandMode = "published" | "local" | "bundled";

export interface CursorMcpEntry {
  readonly type: "stdio";
  readonly command: string;
  readonly args: readonly string[];
}

export interface CursorMcpConfig {
  readonly mcpServers?: {
    readonly nekodrift?: CursorMcpEntry | unknown;
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export interface CursorMcpPreviewOptions {
  readonly mcpVersion: string;
  readonly petId?: string;
  readonly commandMode?: CursorCommandMode;
  readonly mcpEntryPath?: string;
}

export function validateNekoDriftPetId(value: string): string {
  const trimmed = value.trim();
  if (trimmed !== value || trimmed.length < 1) throw new Error("Invalid NekoDrift pet id.");
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(trimmed)) throw new Error("Invalid NekoDrift pet id.");
  return trimmed;
}

export function isValidPetId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value);
}

export function buildCursorMcpEntry(options: CursorMcpPreviewOptions): CursorMcpEntry {
  const petArgs = options.petId === undefined ? [] : ["--pet", validateNekoDriftPetId(options.petId)];
  const mode = options.commandMode ?? "published";
  if (mode === "local" || mode === "bundled") {
    if (!options.mcpEntryPath || !isAbsolute(options.mcpEntryPath)) {
      throw new Error("Cursor local MCP preview requires an absolute MCP entry path.");
    }
    return { type: "stdio", command: "node", args: [options.mcpEntryPath, ...petArgs] };
  }
  validateNekoDriftPackageVersion(options.mcpVersion);
  return { type: "stdio", command: "npx", args: ["-y", `${openPetsMcpPackageName}@${options.mcpVersion}`, ...petArgs] };
}

export function validateNekoDriftPackageVersion(value: string): string {
  if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/.test(value)) {
    throw new Error("Invalid NekoDrift package version.");
  }
  return value;
}

export function formatCursorMcpConfig(options: CursorMcpPreviewOptions): CursorMcpConfig {
  return { mcpServers: { [cursorMcpServerName]: buildCursorMcpEntry(options) } };
}

export function getCursorGlobalMcpPath(homeDir: string): string {
  return join(homeDir, ".cursor", "mcp.json");
}

export function getCursorProjectMcpPath(projectDir: string): string {
  return join(projectDir, ".cursor", "mcp.json");
}
