import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { randomUUID } from "node:crypto";

import { executePlannedWrite, getProjectAgentConfigPaths, parseAgentConfig, planAgentConfigWrite, readAgentConfigFile, updateAgentConfigText, type PlannedWrite } from "./agent-config.js";
import { buildAgentInstructionPath, buildAgentMcpEntry, buildAgentPluginPreview, validateNekoDriftPetArg, type AgentCommandMode } from "./agent-previews.js";
import { classifyAgentInstructionsStatus, classifyAgentMcpStatus, classifyAgentPluginStatus, isManagedNekoDriftMcpEntry, isManagedNekoDriftPluginEntry } from "./agent-status.js";

export interface PrepareAgentProjectSetupOptions {
  readonly projectDir: string;
  readonly petId: string;
  readonly cliVersion: string;
  readonly commandMode?: AgentCommandMode;
  readonly cliEntryPath?: string;
}

export interface PreparedAgentProjectSetup {
  readonly projectDir: string;
  readonly petId: string;
  readonly configPath: string;
  readonly instructionPath: string;
  readonly configWrite: PlannedWrite;
  readonly instructionWrite: PlannedTextWrite;
}

export interface PlannedTextWrite {
  readonly targetPath: string;
  readonly backupPath?: string;
  readonly tempPath: string;
  readonly content: string;
}

const maxInstructionBytes = 1024 * 1024;
const nekoDriftStart = "<!-- NEKODRIFT:START -->";
const nekoDriftEnd = "<!-- NEKODRIFT:END -->";

export function prepareAgentProjectSetup(options: PrepareAgentProjectSetupOptions): PreparedAgentProjectSetup {
  const petId = validateNekoDriftPetArg(options.petId);
  const paths = getProjectAgentConfigPaths(options.projectDir);
  const existingConfigs = paths.candidates.flatMap((path) => {
    if (!existsSync(path)) return [];
    assertSafeProjectLocalPath(options.projectDir, path, "Agent config");
    const parsed = readAgentConfigFile(path);
    if (!parsed.ok) throw new Error(parsed.message);
    return [{ path, config: parsed.value }];
  });
  const configs = existingConfigs.map((entry) => entry.config);
  const instructionRelPath = buildAgentInstructionPath("project");
  const instructionPath = join(options.projectDir, instructionRelPath);
  assertSafeProjectLocalPath(options.projectDir, instructionPath, "Agent instruction");
  const instructionContent = existsSync(instructionPath) ? readSafeInstructionFile(instructionPath) : "";
  const mcpStatus = classifyAgentMcpStatus(configs, { cliVersion: options.cliVersion, petId, commandMode: options.commandMode, cliEntryPath: options.cliEntryPath });
  const instructionStatus = classifyAgentInstructionsStatus(configs, "project", undefined, { [instructionRelPath]: instructionContent });
  const pluginStatus = classifyAgentPluginStatus(configs, petId, options.cliVersion);
  for (const status of [mcpStatus, instructionStatus, pluginStatus]) {
    if (status.status === "custom" || status.status === "conflict" || status.status === "error") throw new Error(`${status.message} Edit or remove the custom NekoDrift Agent entry, then rerun setup.`);
  }

  const selectedPath = selectWriteTarget(paths.candidates, existingConfigs, paths.defaultCreatePath);
  const selectedText = existsSync(selectedPath) ? readFileSync(selectedPath, "utf8") : "{}\n";
  const parsedSelected = parseAgentConfig(selectedText);
  if (!parsedSelected.ok) throw new Error(parsedSelected.message);
  const nextConfig = buildNextConfig(parsedSelected.value, petId, options);
  const nextText = updateAgentConfigText(selectedText, [
    { path: ["mcp"], value: nextConfig.mcp },
    { path: ["instructions"], value: nextConfig.instructions },
    { path: ["plugin"], value: nextConfig.plugin },
  ]);
  if (typeof nextText !== "string") throw new Error(nextText.message);
  const configWrite = planAgentConfigWrite(options.projectDir, selectedPath, nextText);
  if ("ok" in configWrite) throw new Error(configWrite.message);
  const instructionWrite = planInstructionWrite(options.projectDir, instructionPath, upsertNekoDriftInstructionBlock(instructionContent));
  return { projectDir: options.projectDir, petId, configPath: selectedPath, instructionPath, configWrite, instructionWrite };
}

export function writePreparedAgentProjectSetup(prepared: PreparedAgentProjectSetup): void {
  executeTextWrite(prepared.instructionWrite);
  executePlannedWrite(prepared.configWrite);
}

export function createNekoDriftInstructionBlock(): string {
  return `${nekoDriftStart}\n## NekoDrift\n\nNekoDrift MCP tools may be available.\n\nUse NekoDrift as a short visible status channel for meaningful coding progress:\n- Use \`nekodrift_say\` when starting, completing, blocking, or needing review on non-trivial work.\n- Keep messages brief, user-facing, and non-sensitive.\n- Do not include code, logs, secrets, URLs, or file paths.\n- Use \`nekodrift_react\` for small visual or emotional feedback.\n- Use \`nekodrift_status\` only when checking availability or the targeted pet.\n- Do not spam every internal step.\n${nekoDriftEnd}\n`;
}

function buildNextConfig(config: Record<string, unknown>, petId: string, options: PrepareAgentProjectSetupOptions): { readonly mcp: Record<string, unknown>; readonly instructions: readonly string[]; readonly plugin: readonly unknown[] } {
  const mcp = isRecord(config.mcp) ? { ...config.mcp } : {};
  mcp.nekodrift = buildAgentMcpEntry({ cliVersion: options.cliVersion, petId, commandMode: options.commandMode, cliEntryPath: options.cliEntryPath });
  const instructionPath = buildAgentInstructionPath("project");
  const instructions = [...new Set([...(Array.isArray(config.instructions) ? config.instructions.filter((entry): entry is string => typeof entry === "string") : []), instructionPath])];
  const pluginSpec = buildAgentPluginPreview(petId, options.cliVersion);
  const plugin = [...(Array.isArray(config.plugin) ? config.plugin.filter((entry) => !isManagedNekoDriftPluginEntry(entry)) : []), pluginSpec];
  return { mcp, instructions, plugin };
}

function selectWriteTarget(candidates: readonly string[], existing: readonly { readonly path: string; readonly config: Record<string, unknown> }[], fallback: string): string {
  const owners = existing.filter((entry) => hasManagedNekoDriftEntry(entry.config)).map((entry) => entry.path);
  const uniqueOwners = [...new Set(owners)];
  if (uniqueOwners.length > 1) throw new Error("Agent has NekoDrift entries in multiple config files. Remove duplicates, then rerun setup.");
  if (uniqueOwners.length === 1) return uniqueOwners[0] ?? fallback;
  return candidates.find((candidate) => existing.some((entry) => entry.path === candidate)) ?? fallback;
}

function planInstructionWrite(projectDir: string, targetPath: string, content: string): PlannedTextWrite {
  assertSafeProjectLocalPath(projectDir, targetPath, "Agent instruction");
  if (existsSync(targetPath)) {
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Agent instruction path must be a safe regular file.");
    if (stat.size > maxInstructionBytes) throw new Error("Agent instruction file is too large.");
  }
  const parent = dirname(targetPath);
  if (existsSync(parent)) {
    const stat = lstatSync(parent);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Agent instruction directory is unsafe.");
  }
  const stamp = `${process.pid}-${Date.now()}-${randomUUID()}`;
  return { targetPath, backupPath: existsSync(targetPath) ? `${targetPath}.nekodrift-backup-${stamp}.md` : undefined, tempPath: join(parent, `.nekodrift-${stamp}.tmp`), content };
}

function executeTextWrite(plan: PlannedTextWrite): void {
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

function readSafeInstructionFile(path: string): string {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Agent instruction path must be a safe regular file.");
  if (stat.size > maxInstructionBytes) throw new Error("Agent instruction file is too large.");
  return readFileSync(path, "utf8");
}

function assertSafeProjectLocalPath(projectDir: string, targetPath: string, label: string): void {
  const rel = relative(projectDir, targetPath);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`${label} path escapes the project.`);
  const parts = rel.split(/[\\/]+/).filter(Boolean);
  let current = projectDir;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = join(current, parts[index] ?? "");
    if (!existsSync(current)) continue;
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} parent directory is unsafe.`);
  }
}

function upsertNekoDriftInstructionBlock(source: string): string {
  const withoutBlock = source.replace(new RegExp(`${escapeRegExp(nekoDriftStart)}[\\s\\S]*?${escapeRegExp(nekoDriftEnd)}\\n?`, "g"), "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/u, "");
  const block = createNekoDriftInstructionBlock();
  return withoutBlock ? `${withoutBlock}\n\n${block}` : block;
}

function hasManagedNekoDriftEntry(config: Record<string, unknown>): boolean {
  if (isRecord(config.mcp) && isManagedNekoDriftMcpEntry(config.mcp.nekodrift)) return true;
  if (Array.isArray(config.instructions) && config.instructions.some((entry) => entry === buildAgentInstructionPath("project"))) return true;
  if (Array.isArray(config.plugin) && config.plugin.some(isManagedNekoDriftPluginEntry)) return true;
  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
