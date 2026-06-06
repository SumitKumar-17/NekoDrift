import { buildOpenCodeInstructionPath, buildOpenCodeMcpEntry, buildOpenCodePluginPreview, openCodeMcpServerName, type OpenCodePreviewOptions } from "./opencode-previews.js";

export type OpenCodeEntryStatus = "not_installed" | "installed" | "needs_update" | "custom" | "conflict" | "error";

export interface OpenCodeStatusResult {
  readonly status: OpenCodeEntryStatus;
  readonly message: string;
  readonly matches: readonly string[];
}

export function classifyOpenCodeMcpStatus(configs: readonly Record<string, unknown>[], expected: OpenCodePreviewOptions): OpenCodeStatusResult {
  const entries = configs.flatMap((config, index) => {
    const mcp = isRecord(config.mcp) ? config.mcp : undefined;
    const entry = mcp?.[openCodeMcpServerName];
    return entry === undefined ? [] : [{ source: String(index), entry }];
  });
  if (entries.length === 0) return { status: "not_installed", message: "OpenCode NekoDrift MCP is not installed.", matches: [] };
  const expectedEntry = buildOpenCodeMcpEntry(expected);
  const current = entries.filter(({ entry }) => isSameMcpEntry(entry, expectedEntry));
  const managed = entries.filter(({ entry }) => isManagedNekoDriftMcpEntry(entry, expectedEntry.command));
  if (current.length === 1 && entries.length === 1) return { status: "installed", message: "OpenCode NekoDrift MCP is installed.", matches: [entries[0]?.source ?? "0"] };
  if (current.length > 0 || managed.length > 0) return { status: entries.length > 1 ? "conflict" : "needs_update", message: "OpenCode NekoDrift MCP needs update.", matches: entries.map((entry) => entry.source) };
  return { status: "custom", message: "OpenCode has a custom nekodrift MCP entry.", matches: entries.map((entry) => entry.source) };
}

export function classifyOpenCodeInstructionsStatus(configs: readonly Record<string, unknown>[], scope: "project" | "global", configDir?: string, instructionFiles: Record<string, string> = {}): OpenCodeStatusResult {
  const expected = buildOpenCodeInstructionPath(scope, configDir);
  const allEntries = configs.flatMap((config, index) => Array.isArray(config.instructions) ? config.instructions.filter((entry): entry is string => typeof entry === "string" && isNekoDriftLikeInstruction(entry)).map((entry) => ({ source: String(index), entry })) : []);
  const managedEntries = allEntries.filter(({ entry }) => entry === expected);
  const customEntries = allEntries.filter(({ entry }) => entry !== expected);
  if (allEntries.length === 0) return { status: "not_installed", message: "OpenCode NekoDrift instructions are not installed.", matches: [] };
  if (managedEntries.length > 1 || (managedEntries.length > 0 && customEntries.length > 0)) return { status: "conflict", message: "OpenCode has conflicting NekoDrift instruction entries.", matches: allEntries.map((entry) => entry.source) };
  if (managedEntries.length === 1 && hasManagedInstructionBlock(instructionFiles[expected])) return { status: "installed", message: "OpenCode NekoDrift instructions are installed.", matches: managedEntries.map((entry) => entry.source) };
  if (managedEntries.length === 1) return { status: "needs_update", message: "OpenCode NekoDrift instruction file needs managed block.", matches: managedEntries.map((entry) => entry.source) };
  return { status: "custom", message: "OpenCode has custom NekoDrift-like instruction entries.", matches: customEntries.map((entry) => entry.source) };
}

export function classifyOpenCodePluginStatus(configs: readonly Record<string, unknown>[], petId?: string, packageVersion?: string): OpenCodeStatusResult {
  const expected = buildOpenCodePluginPreview(petId, packageVersion);
  const pluginEntries = configs.flatMap((config, index) => Array.isArray(config.plugin) ? config.plugin.map((entry) => ({ source: String(index), entry })) : []);
  const current = pluginEntries.filter(({ entry }) => isExpectedPlugin(entry, expected));
  const recognizable = pluginEntries.filter(({ entry }) => isManagedNekoDriftPluginEntry(entry));
  const custom = pluginEntries.filter(({ entry }) => !isManagedNekoDriftPluginEntry(entry) && isNekoDriftLikePluginEntry(entry));
  if (current.length === 1 && recognizable.length === 1 && custom.length === 0) return { status: "installed", message: "OpenCode NekoDrift plugin is installed.", matches: current.map((entry) => entry.source) };
  if (recognizable.length > 0 && custom.length > 0) return { status: "conflict", message: "OpenCode has conflicting NekoDrift plugin entries.", matches: [...recognizable, ...custom].map((entry) => entry.source) };
  if (recognizable.length > 0) return { status: recognizable.length > 1 ? "conflict" : "needs_update", message: "OpenCode NekoDrift plugin needs update.", matches: recognizable.map((entry) => entry.source) };
  if (custom.length > 0) return { status: "custom", message: "OpenCode has custom NekoDrift-like plugin entries.", matches: custom.map((entry) => entry.source) };
  return { status: "not_installed", message: "OpenCode NekoDrift plugin is not installed.", matches: [] };
}

export function isManagedNekoDriftMcpEntry(value: unknown, expectedCommand?: readonly string[]): boolean {
  if (!isRecord(value) || value.type !== "local" || value.enabled !== true || !Array.isArray(value.command)) return false;
  const keys = Object.keys(value).sort();
  if (!hasManagedMcpKeys(keys) || !hasValidMcpEnvironment(value.environment)) return false;
  return isManagedNekoDriftMcpCommand(value.command, expectedCommand);
}

function isManagedNekoDriftMcpCommand(command: readonly unknown[], expectedCommand?: readonly string[]): boolean {
  if (!command.every((part) => typeof part === "string")) return false;
  const parts = command as readonly string[];
  if (expectedCommand && isSameCommand(parts, expectedCommand)) return true;
  if (expectedCommand && isExpectedNodeNekoDriftMcpCommand(parts, expectedCommand)) return true;
  return isPublishedNekoDriftMcpCommand(parts) || isNodeNekoDriftMcpCommand(parts);
}

function isExpectedNodeNekoDriftMcpCommand(command: readonly string[], expected: readonly string[]): boolean {
  return expected[0] === "node" && command.length >= 3 && command[0] === "node" && command[1] === expected[1] && command[2] === "mcp" && hasValidPetArgs(command.slice(3));
}

function isPublishedNekoDriftMcpCommand(command: readonly string[]): boolean {
  return command.length >= 4 && command[0] === "npx" && command[1] === "-y" && /^@neko-drift\/cli@\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/.test(command[2] ?? "") && command[3] === "mcp" && hasValidPetArgs(command.slice(4));
}

function isNodeNekoDriftMcpCommand(command: readonly string[]): boolean {
  return command.length >= 3 && command[0] === "node" && isNekoDriftCliEntryPath(command[1] ?? "") && command[2] === "mcp" && hasValidPetArgs(command.slice(3));
}

function isNekoDriftCliEntryPath(path: string): boolean {
  return /(?:^|[\\/])node_modules[\\/]@neko-drift[\\/]cli[\\/]dist[\\/]index\.js$/u.test(path) || /(?:^|[\\/])packages[\\/]cli[\\/]dist[\\/]index\.js$/u.test(path);
}

function hasValidPetArgs(args: readonly string[]): boolean {
  if (args.length === 0) return true;
  return args.length === 2 && args[0] === "--pet" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(args[1] ?? "");
}

function isSameCommand(command: readonly string[], expected: readonly string[]): boolean {
  return command.length === expected.length && command.every((part, index) => part === expected[index]);
}

function isExpectedPlugin(value: unknown, expected: string | readonly [string, { readonly pet?: string }]): boolean {
  if (typeof expected === "string") return value === expected;
  return Array.isArray(value) && value.length === 2 && value[0] === expected[0] && isSamePluginOptions(value[1], expected[1]);
}

export function isManagedNekoDriftPluginEntry(value: unknown): boolean {
  if (typeof value === "string") return /^@neko-drift\/opencode(?:@[^/]+)?$/.test(value);
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && /^@neko-drift\/opencode(?:@[^/]+)?$/.test(value[0]) && isPetPluginOptions(value[1]);
}

export function isNekoDriftLikePluginEntry(value: unknown): boolean {
  if (typeof value === "string") return /nekodrift|neko-drift/i.test(value);
  if (Array.isArray(value)) return value.some(isNekoDriftLikePluginEntry);
  return false;
}

function isPetPluginOptions(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === "pet" && typeof value.pet === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value.pet);
}

function isSameMcpEntry(value: unknown, expected: { readonly type: "local"; readonly command: readonly string[]; readonly enabled: true }): boolean {
  if (!isRecord(value) || value.type !== expected.type || value.enabled !== expected.enabled || !Array.isArray(value.command)) return false;
  const keys = Object.keys(value).sort();
  if (!hasManagedMcpKeys(keys) || !hasValidMcpEnvironment(value.environment)) return false;
  return value.command.length === expected.command.length && value.command.every((part, index) => part === expected.command[index]);
}

function hasManagedMcpKeys(keys: readonly string[]): boolean {
  return keys.length === 3 && keys[0] === "command" && keys[1] === "enabled" && keys[2] === "type"
    || keys.length === 4 && keys[0] === "command" && keys[1] === "enabled" && keys[2] === "environment" && keys[3] === "type";
}

function hasValidMcpEnvironment(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([key, envValue]) => /^[A-Z_][A-Z0-9_]*$/.test(key) && typeof envValue === "string");
}

function isSamePluginOptions(value: unknown, expected: { readonly pet?: string }): boolean {
  if (!isRecord(value)) return Object.keys(expected).length === 0;
  const keys = Object.keys(value);
  return keys.length === Object.keys(expected).length && value.pet === expected.pet;
}

function isNekoDriftLikeInstruction(value: string): boolean {
  return /nekodrift\.md$/i.test(value) || /@neko-drift\/opencode/i.test(value);
}

function hasManagedInstructionBlock(value: string | undefined): boolean {
  return typeof value === "string" && /<!-- OPENPETS:START -->[\s\S]*?<!-- OPENPETS:END -->/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
