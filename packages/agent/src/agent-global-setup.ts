import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { randomUUID } from "node:crypto";

import { parseAgentConfig, readAgentConfigFile, updateAgentConfigText, type AgentConfigPaths, type PlannedWrite } from "./agent-config.js";
import { buildAgentInstructionPath, buildAgentMcpEntry, buildAgentPluginPreview, validateNekoDriftPetArg, type AgentCommandMode } from "./agent-previews.js";
import { classifyAgentInstructionsStatus, classifyAgentMcpStatus, classifyAgentPluginStatus, isManagedNekoDriftMcpEntry, isManagedNekoDriftPluginEntry, isNekoDriftLikePluginEntry } from "./agent-status.js";
import { createNekoDriftInstructionBlock } from "./agent-project-setup.js";

export interface PrepareAgentGlobalSetupOptions {
  readonly configDir: string;
  readonly petId?: string;
  readonly cliVersion: string;
  readonly pluginVersion?: string;
  readonly commandMode?: AgentCommandMode;
  readonly cliEntryPath?: string;
}

export interface PreparedAgentGlobalSetup {
  readonly configDir: string;
  readonly petId?: string;
  readonly configPath: string;
  readonly instructionPath: string;
  readonly configWrite: PlannedWrite;
  readonly cleanupConfigWrites: readonly PlannedWrite[];
  readonly instructionWrite: GlobalPlannedTextWrite;
}

export interface GlobalPlannedTextWrite {
  readonly targetPath: string;
  readonly backupPath?: string;
  readonly tempPath: string;
  readonly content: string;
}

export interface AgentGlobalState {
  readonly status: "not_installed" | "installed" | "custom" | "conflict" | "error";
  readonly message: string;
}

const maxInstructionBytes = 1024 * 1024;
const nekoDriftStart = "<!-- NEKODRIFT:START -->";
const nekoDriftEnd = "<!-- NEKODRIFT:END -->";

export function getExplicitGlobalAgentConfigPaths(configDir: string): AgentConfigPaths {
  assertSafeDirectoryRoot(configDir, true);
  return { candidates: [join(configDir, "config.json"), join(configDir, "opencode.json"), join(configDir, "opencode.jsonc")], defaultCreatePath: join(configDir, "opencode.jsonc") };
}

export function prepareAgentGlobalSetup(options: PrepareAgentGlobalSetupOptions): PreparedAgentGlobalSetup {
  const petId = options.petId === undefined ? undefined : validateNekoDriftPetArg(options.petId);
  const paths = getExplicitGlobalAgentConfigPaths(options.configDir);
  const existingConfigs = readExistingGlobalConfigs(options.configDir, paths.candidates);
  const configs = existingConfigs.map((entry) => entry.config);
  const instructionPath = buildAgentInstructionPath("global", options.configDir);
  assertSafeGlobalPath(options.configDir, instructionPath, "Agent instruction");
  const instructionContent = existsSync(instructionPath) ? readSafeInstructionFile(instructionPath) : "";
  const mcpStatus = classifyAgentMcpStatus(configs, { cliVersion: options.cliVersion, petId, commandMode: options.commandMode, cliEntryPath: options.cliEntryPath });
  const instructionStatus = classifyAgentInstructionsStatus(configs, "global", options.configDir, { [instructionPath]: instructionContent });
  const pluginStatus = classifyAgentPluginStatus(configs, petId, options.pluginVersion ?? options.cliVersion);
  for (const status of [mcpStatus, instructionStatus, pluginStatus]) {
    if (status.status === "custom" || status.status === "conflict" || status.status === "error") throw new Error(`${status.message} Edit or remove the custom NekoDrift Agent entry, then rerun setup.`);
  }
  const selectedPath = selectWriteTarget(options.configDir, paths.candidates, existingConfigs, paths.defaultCreatePath);
  const selectedText = existsSync(selectedPath) ? readFileSync(selectedPath, "utf8") : "{}\n";
  const parsed = parseAgentConfig(selectedText);
  if (!parsed.ok) throw new Error(parsed.message);
  const nextConfig = buildNextGlobalConfig(parsed.value, petId, options);
  const nextText = updateAgentConfigText(selectedText, [
    { path: ["mcp"], value: nextConfig.mcp },
    { path: ["instructions"], value: nextConfig.instructions },
    { path: ["plugin"], value: nextConfig.plugin },
  ]);
  if (typeof nextText !== "string") throw new Error(nextText.message);
  const configWrite = planGlobalConfigWrite(options.configDir, selectedPath, nextText);
  const cleanupConfigWrites = planSetupCleanupWrites(options.configDir, selectedPath, existingConfigs);
  const instructionWrite = planTextWrite(options.configDir, instructionPath, upsertNekoDriftBlock(instructionContent));
  return { configDir: options.configDir, petId, configPath: selectedPath, instructionPath, configWrite, cleanupConfigWrites, instructionWrite };
}

export function writePreparedAgentGlobalSetup(prepared: PreparedAgentGlobalSetup): void {
  executeTextWrite(prepared.instructionWrite);
  for (const write of prepared.cleanupConfigWrites) executeGlobalConfigWrite(write);
  executeGlobalConfigWrite(prepared.configWrite);
}

export function prepareAgentGlobalRemove(configDir: string): { readonly configWrites: readonly PlannedWrite[]; readonly instructionWrite?: GlobalPlannedTextWrite } {
  const paths = getExplicitGlobalAgentConfigPaths(configDir);
  const existingConfigs = readExistingGlobalConfigs(configDir, paths.candidates);
  const state = classifyGlobalState(configDir, existingConfigs);
  if (state.status === "custom" || state.status === "conflict" || state.status === "error") throw new Error(state.message);
  const owners = existingConfigs.filter((entry) => hasManagedNekoDriftEntry(configDir, entry.config));
  if (owners.length === 0) return { configWrites: [] };
  if (owners.length > 1) throw new Error("Agent has NekoDrift entries in multiple global config files. Remove duplicates manually.");
  const owner = owners[0];
  if (!owner) return { configWrites: [] };
  const text = readFileSync(owner.path, "utf8");
  const next = removeManagedConfig(configDir, owner.config);
  const nextText = updateAgentConfigText(text, [
    { path: ["mcp"], value: next.mcp },
    { path: ["instructions"], value: next.instructions },
    { path: ["plugin"], value: next.plugin },
  ]);
  if (typeof nextText !== "string") throw new Error(nextText.message);
  const configWrite = planGlobalConfigWrite(configDir, owner.path, nextText);
  const instructionPath = buildAgentInstructionPath("global", configDir);
  const instructionContent = existsSync(instructionPath) ? readSafeInstructionFile(instructionPath) : "";
  const instructionWrite = hasManagedInstructionBlock(instructionContent) ? planTextWrite(configDir, instructionPath, removeNekoDriftBlock(instructionContent)) : undefined;
  return { configWrites: [configWrite], instructionWrite };
}

export function writePreparedAgentGlobalRemove(prepared: { readonly configWrites: readonly PlannedWrite[]; readonly instructionWrite?: GlobalPlannedTextWrite }): void {
  for (const write of prepared.configWrites) executeGlobalConfigWrite(write);
  if (prepared.instructionWrite) executeTextWrite(prepared.instructionWrite);
}

export function doctorAgentGlobalSetup(configDir: string): AgentGlobalState {
  try {
    const paths = getExplicitGlobalAgentConfigPaths(configDir);
    return classifyGlobalState(configDir, readExistingGlobalConfigs(configDir, paths.candidates));
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Agent global setup status is unavailable." };
  }
}

function readExistingGlobalConfigs(configDir: string, candidates: readonly string[]): Array<{ readonly path: string; readonly config: Record<string, unknown> }> {
  return candidates.flatMap((path) => {
    if (!existsSync(path)) return [];
    assertSafeGlobalPath(configDir, path, "Agent config");
    const parsed = readAgentConfigFile(path);
    if (!parsed.ok) throw new Error(parsed.message);
    return [{ path, config: parsed.value }];
  });
}

function buildNextGlobalConfig(config: Record<string, unknown>, petId: string | undefined, options: PrepareAgentGlobalSetupOptions): { readonly mcp: Record<string, unknown>; readonly instructions: readonly string[]; readonly plugin: readonly unknown[] } {
  const mcp = isRecord(config.mcp) ? { ...config.mcp } : {};
  mcp.nekodrift = buildAgentMcpEntry({ cliVersion: options.cliVersion, petId, commandMode: options.commandMode, cliEntryPath: options.cliEntryPath });
  const instructionPath = buildAgentInstructionPath("global", options.configDir);
  const instructions = [...new Set([...(Array.isArray(config.instructions) ? config.instructions.filter((entry): entry is string => typeof entry === "string") : []), instructionPath])];
  const plugin = [...(Array.isArray(config.plugin) ? config.plugin.filter((entry) => !isManagedNekoDriftPluginEntry(entry)) : []), buildAgentPluginPreview(petId, options.pluginVersion ?? options.cliVersion)];
  return { mcp, instructions, plugin };
}

function removeManagedConfig(configDir: string, config: Record<string, unknown>): { readonly mcp?: Record<string, unknown>; readonly instructions?: readonly string[]; readonly plugin?: readonly unknown[] } {
  const mcp = isRecord(config.mcp) ? { ...config.mcp } : {};
  if (isManagedNekoDriftMcpEntry(mcp.nekodrift)) delete mcp.nekodrift;
  const instructionPath = buildAgentInstructionPath("global", configDir);
  const instructions = Array.isArray(config.instructions) ? config.instructions.filter((entry) => typeof entry === "string" && entry !== instructionPath) : [];
  const plugin = Array.isArray(config.plugin) ? config.plugin.filter((entry) => !isManagedNekoDriftPluginEntry(entry)) : [];
  return { mcp: Object.keys(mcp).length > 0 ? mcp : undefined, instructions: instructions.length > 0 ? instructions : undefined, plugin: plugin.length > 0 ? plugin : undefined };
}

function selectWriteTarget(configDir: string, candidates: readonly string[], existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[], fallback: string): string {
  const owners = existing.filter((entry) => hasManagedNekoDriftEntry(configDir, entry.config)).map((entry) => entry.path);
  const uniqueOwners = [...new Set(owners)];
  if (uniqueOwners.length > 1) throw new Error("Agent has NekoDrift entries in multiple global config files. Remove duplicates manually.");
  const arrayOwner = selectArrayFieldOwner(configDir, candidates, existing);
  if (arrayOwner) return arrayOwner;
  if (uniqueOwners.length === 1) return uniqueOwners[0] ?? fallback;
  const highestPrecedenceExisting = [...candidates].reverse().find((candidate) => existing.some((entry) => entry.path === candidate));
  if (highestPrecedenceExisting) return highestPrecedenceExisting;
  return fallback;
}

function planSetupCleanupWrites(configDir: string, selectedPath: string, existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[]): readonly PlannedWrite[] {
  return existing.flatMap((entry) => {
    if (entry.path === selectedPath || !hasManagedNekoDriftEntry(configDir, entry.config)) return [];
    const source = readFileSync(entry.path, "utf8");
    const next = removeManagedConfig(configDir, entry.config);
    const nextText = updateAgentConfigText(source, [
      { path: ["mcp"], value: next.mcp },
      { path: ["instructions"], value: next.instructions },
      { path: ["plugin"], value: next.plugin },
    ]);
    if (typeof nextText !== "string") throw new Error(nextText.message);
    return [planGlobalConfigWrite(configDir, entry.path, nextText)];
  });
}

function selectArrayFieldOwner(configDir: string, candidates: readonly string[], existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[]): string | undefined {
  const pluginOwner = findEffectiveArrayOwner(candidates, existing, "plugin", (entry) => !isManagedNekoDriftPluginEntry(entry), isManagedNekoDriftPluginEntry);
  const instructionPath = buildAgentInstructionPath("global", configDir);
  const instructionOwner = findEffectiveArrayOwner(candidates, existing, "instructions", (entry) => typeof entry === "string" && entry !== instructionPath, (entry) => entry === instructionPath);
  const owners = [...new Set([pluginOwner, instructionOwner].filter((value): value is string => typeof value === "string"))];
  if (owners.length > 1) throw new Error("Agent global plugin and instruction arrays live in different config files. Consolidate them before installing NekoDrift.");
  return owners[0];
}

function findEffectiveArrayOwner(candidates: readonly string[], existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[], field: "plugin" | "instructions", isUserEntry: (entry: unknown) => boolean, isManagedEntry: (entry: unknown) => boolean): string | undefined {
  const entries = [...candidates].reverse().flatMap((candidate) => {
    const entry = existing.find((item) => item.path === candidate);
    const value = entry?.config[field];
    return entry && Array.isArray(value) ? [{ path: entry.path, values: value as readonly unknown[] }] : [];
  });
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    if (entry.values.some(isUserEntry)) return entry.path;
    const lowerUserOwner = entries.slice(index + 1).find((item) => item.values.some(isUserEntry))?.path;
    if (entry.values.some(isManagedEntry)) return lowerUserOwner ?? entry.path;
    if (lowerUserOwner) throw new Error(`Agent global ${field} array in a higher-precedence config shadows user ${field} entries in a lower-precedence config. Consolidate them before installing NekoDrift.`);
    return entry.path;
  }
  return undefined;
}

function hasManagedNekoDriftEntry(configDir: string, config: Record<string, unknown>): boolean {
  if (isRecord(config.mcp) && isManagedNekoDriftMcpEntry(config.mcp.nekodrift)) return true;
  if (Array.isArray(config.instructions) && config.instructions.some((entry) => entry === buildAgentInstructionPath("global", configDir))) return true;
  if (Array.isArray(config.plugin) && config.plugin.some(isManagedNekoDriftPluginEntry)) return true;
  return false;
}

function hasCustomNekoDriftEntry(configDir: string, config: Record<string, unknown>): boolean {
  if (isRecord(config.mcp) && config.mcp.nekodrift !== undefined && !isManagedNekoDriftMcpEntry(config.mcp.nekodrift)) return true;
  if (Array.isArray(config.instructions) && config.instructions.some((entry) => typeof entry === "string" && /nekodrift\.md$/i.test(entry) && entry !== buildAgentInstructionPath("global", configDir))) return true;
  if (Array.isArray(config.plugin) && config.plugin.some((entry) => isNekoDriftLikePluginEntry(entry) && !isManagedNekoDriftPluginEntry(entry))) return true;
  return false;
}

function classifyGlobalState(configDir: string, existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[]): AgentGlobalState {
  if (existing.some((entry) => hasCustomNekoDriftEntry(configDir, entry.config))) return { status: "custom", message: "Agent has custom NekoDrift-like global entries. Edit or remove them manually." };
  const owners = existing.filter((entry) => hasManagedNekoDriftEntry(configDir, entry.config));
  if (owners.length > 1) return { status: "conflict", message: "Agent has NekoDrift entries in multiple global config files. Remove duplicates manually." };
  if (owners.length === 1) return { status: "installed", message: "Agent global NekoDrift setup is installed." };
  return { status: "not_installed", message: "Agent global NekoDrift setup is not installed." };
}

function planTextWrite(root: string, targetPath: string, content: string): GlobalPlannedTextWrite {
  assertSafeGlobalPath(root, targetPath, "Agent instruction");
  if (existsSync(targetPath)) {
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Agent instruction path must be a safe regular file.");
    if (stat.size > maxInstructionBytes) throw new Error("Agent instruction file is too large.");
  }
  const stamp = `${process.pid}-${Date.now()}-${randomUUID()}`;
  return { targetPath, backupPath: existsSync(targetPath) ? `${targetPath}.nekodrift-backup-${stamp}.md` : undefined, tempPath: join(dirname(targetPath), `.nekodrift-${stamp}.tmp`), content };
}

function executeTextWrite(plan: GlobalPlannedTextWrite): void {
  const parent = dirname(plan.targetPath);
  if (existsSync(parent)) {
    const parentStat = lstatSync(parent);
    if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) throw new Error("Agent instruction directory is unsafe.");
  }
  if (existsSync(plan.targetPath)) {
    const targetStat = lstatSync(plan.targetPath);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) throw new Error("Agent instruction path must be a safe regular file.");
    if (targetStat.size > maxInstructionBytes) throw new Error("Agent instruction file is too large.");
  }
  if (plan.backupPath && dirname(plan.backupPath) !== parent) throw new Error("Agent instruction backup path is unsafe.");
  if (dirname(plan.tempPath) !== parent) throw new Error("Agent instruction temp path is unsafe.");
  mkdirSync(dirname(plan.targetPath), { recursive: true, mode: 0o700 });
  if (plan.backupPath && existsSync(plan.targetPath)) {
    const backup = openSync(plan.backupPath, "wx", 0o600);
    try { writeFileSync(backup, readFileSync(plan.targetPath)); } finally { closeSync(backup); }
  }
  const fd = openSync(plan.tempPath, "wx", 0o600);
  try { writeFileSync(fd, plan.content, "utf8"); } finally { closeSync(fd); }
  renameSync(plan.tempPath, plan.targetPath);
  try { chmodSync(plan.targetPath, 0o600); } catch { /* best effort */ }
}

function planGlobalConfigWrite(rootPath: string, targetPath: string, content: string): PlannedWrite {
  assertSafeGlobalPath(rootPath, targetPath, "Agent config");
  const parsed = parseAgentConfig(content);
  if (!parsed.ok) throw new Error(parsed.message);
  const stamp = `${process.pid}-${Date.now()}-${randomUUID()}`;
  return { rootPath, targetPath, backupPath: existsSync(targetPath) ? `${targetPath}.nekodrift-backup-${stamp}.json` : undefined, tempPath: join(dirname(targetPath), `.nekodrift-${stamp}.tmp`), content };
}

function executeGlobalConfigWrite(plan: PlannedWrite): void {
  const parent = dirname(plan.targetPath);
  assertSafeGlobalPath(plan.rootPath, plan.targetPath, "Agent config");
  if (existsSync(plan.targetPath)) {
    const targetStat = lstatSync(plan.targetPath);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) throw new Error("Agent config path must be a safe regular file.");
  }
  if (plan.backupPath && (dirname(plan.backupPath) !== parent || existsSync(plan.backupPath))) throw new Error("Agent config backup path is unsafe.");
  if (dirname(plan.tempPath) !== parent || existsSync(plan.tempPath)) throw new Error("Agent config temp path is unsafe.");
  const parsed = parseAgentConfig(plan.content);
  if (!parsed.ok) throw new Error(parsed.message);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  if (plan.backupPath && existsSync(plan.targetPath)) {
    const backup = openSync(plan.backupPath, "wx", 0o600);
    try { writeFileSync(backup, readFileSync(plan.targetPath)); } finally { closeSync(backup); }
  }
  const fd = openSync(plan.tempPath, "wx", 0o600);
  try { writeFileSync(fd, plan.content, "utf8"); } finally { closeSync(fd); }
  renameSync(plan.tempPath, plan.targetPath);
  try { chmodSync(plan.targetPath, 0o600); } catch { /* best effort */ }
}

function readSafeInstructionFile(path: string): string {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Agent instruction path must be a safe regular file.");
  if (stat.size > maxInstructionBytes) throw new Error("Agent instruction file is too large.");
  return readFileSync(path, "utf8");
}

function upsertNekoDriftBlock(source: string): string {
  const withoutBlock = source.replace(new RegExp(`${escapeRegExp(nekoDriftStart)}[\\s\\S]*?${escapeRegExp(nekoDriftEnd)}\\n?`, "g"), "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/u, "");
  const block = createNekoDriftInstructionBlock();
  return withoutBlock ? `${withoutBlock}\n\n${block}` : block;
}

function removeNekoDriftBlock(source: string): string {
  return source.replace(new RegExp(`${escapeRegExp(nekoDriftStart)}[\\s\\S]*?${escapeRegExp(nekoDriftEnd)}\\n?`, "g"), "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/u, (match) => (match.includes("\n") ? "\n" : ""));
}

function hasManagedInstructionBlock(value: string): boolean {
  return new RegExp(`${escapeRegExp(nekoDriftStart)}[\\s\\S]*?${escapeRegExp(nekoDriftEnd)}`).test(value);
}

function assertSafeDirectoryRoot(root: string, allowMissing: boolean): void {
  if (!isAbsolute(root)) throw new Error("Agent global config directory must be absolute.");
  if (!existsSync(root)) {
    if (allowMissing) return;
    throw new Error("Agent global config directory does not exist.");
  }
  const stat = lstatSync(root);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Agent global config directory is unsafe.");
}

function assertSafeGlobalPath(root: string, targetPath: string, label: string): void {
  assertSafeNearestExistingRoot(root);
  const rel = relative(root, targetPath);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`${label} path escapes global config directory.`);
  let current = root;
  for (const part of rel.split(/[\\/]+/).filter(Boolean).slice(0, -1)) {
    current = join(current, part);
    if (!existsSync(current)) continue;
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} parent directory is unsafe.`);
  }
}

function assertSafeNearestExistingRoot(root: string): void {
  if (!isAbsolute(root)) throw new Error("Agent global config directory must be absolute.");
  let current = root;
  while (!existsSync(current)) current = dirname(current);
  const stat = statSync(current);
  if (!stat.isDirectory()) throw new Error("Agent global config parent is unsafe.");
  if (lstatSync(current).isSymbolicLink()) throw new Error("Agent global config parent must not be a symlink.");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
