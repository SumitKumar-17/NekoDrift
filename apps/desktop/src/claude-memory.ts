import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export interface ClaudeNekoDriftMemoryResult {
  readonly changed: boolean;
  readonly claudeMdPath: string;
  readonly nekoDriftMemoryPath: string;
}

export interface ClaudeNekoDriftMemoryStatus {
  readonly status: "installed" | "not_installed" | "error";
  readonly message: string;
  readonly claudeMdPath: string;
  readonly nekoDriftMemoryPath: string;
}

export const nekoDriftClaudeImportLine = "@~/.claude/nekodrift.md";

const nekoDriftImportStart = "<!-- NEKODRIFT:IMPORT:START -->";
const nekoDriftImportEnd = "<!-- NEKODRIFT:IMPORT:END -->";
const nekoDriftMemoryStart = "<!-- NEKODRIFT:START -->";
const nekoDriftMemoryEnd = "<!-- NEKODRIFT:END -->";
const maxClaudeMemoryBytes = 1024 * 1024;

export function installClaudeNekoDriftMemory(homeDir: string): ClaudeNekoDriftMemoryResult {
  const paths = getClaudeMemoryPaths(homeDir);
  assertSafeClaudeMemoryPaths(paths.claudeDir, paths.claudeMdPath, paths.nekoDriftMemoryPath);
  mkdirSync(paths.claudeDir, { recursive: true, mode: 0o700 });
  assertSafeClaudeMemoryPaths(paths.claudeDir, paths.claudeMdPath, paths.nekoDriftMemoryPath);

  const currentNekoDriftMemory = readTextFile(paths.nekoDriftMemoryPath);
  const nextNekoDriftMemory = upsertNekoDriftMemoryBlock(currentNekoDriftMemory, createNekoDriftMemoryBlock());
  const openPetsChanged = currentNekoDriftMemory !== nextNekoDriftMemory;
  if (openPetsChanged) writePrivateTextFile(paths.nekoDriftMemoryPath, nextNekoDriftMemory);

  const currentClaudeMd = readTextFile(paths.claudeMdPath);
  const nextClaudeMd = ensureManagedImport(currentClaudeMd);
  const claudeMdChanged = currentClaudeMd !== nextClaudeMd;
  if (claudeMdChanged) writePrivateTextFile(paths.claudeMdPath, nextClaudeMd);

  return { changed: openPetsChanged || claudeMdChanged, claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
}

export function uninstallClaudeNekoDriftMemory(homeDir: string): ClaudeNekoDriftMemoryResult {
  const paths = getClaudeMemoryPaths(homeDir);
  assertSafeClaudeMemoryPaths(paths.claudeDir, paths.claudeMdPath, paths.nekoDriftMemoryPath);

  let changed = false;
  const currentClaudeMd = readTextFile(paths.claudeMdPath);
  const hasUserOwnedImport = hasImportLineOutsideManagedBlock(currentClaudeMd);
  const nextClaudeMd = removeManagedImport(currentClaudeMd);
  if (currentClaudeMd !== nextClaudeMd) {
    writePrivateTextFile(paths.claudeMdPath, nextClaudeMd);
    changed = true;
  }

  const currentNekoDriftMemory = readTextFile(paths.nekoDriftMemoryPath);
  if (currentNekoDriftMemory) {
    const nextNekoDriftMemory = removeNekoDriftMemoryBlock(currentNekoDriftMemory);
    if (nextNekoDriftMemory.trim().length === 0) {
      if (hasUserOwnedImport) {
        writePrivateTextFile(paths.nekoDriftMemoryPath, "");
      } else {
        rmSync(paths.nekoDriftMemoryPath, { force: true });
      }
      changed = true;
    } else if (nextNekoDriftMemory !== currentNekoDriftMemory) {
      writePrivateTextFile(paths.nekoDriftMemoryPath, nextNekoDriftMemory);
      changed = true;
    }
  }

  return { changed, claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
}

export function doctorClaudeNekoDriftMemory(homeDir: string): ClaudeNekoDriftMemoryStatus {
  const paths = getClaudeMemoryPaths(homeDir);
  try {
    assertSafeClaudeMemoryPaths(paths.claudeDir, paths.claudeMdPath, paths.nekoDriftMemoryPath);
    const claudeMd = readTextFile(paths.claudeMdPath);
    const openPetsMemory = readTextFile(paths.nekoDriftMemoryPath);
    const hasImport = hasManagedImport(claudeMd) || hasImportLineOutsideManagedBlock(claudeMd);
    const hasInstructions = createNekoDriftBlockPattern().test(openPetsMemory) || /nekodrift_say|NekoDrift MCP/i.test(openPetsMemory);
    if (hasImport && hasInstructions) {
      return { status: "installed", message: "Claude will load NekoDrift instructions from ~/.claude/nekodrift.md.", claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
    }
    if (hasImport) {
      return { status: "not_installed", message: "Claude imports NekoDrift instructions, but the NekoDrift memory file is missing or incomplete.", claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
    }
    if (hasInstructions) {
      return { status: "not_installed", message: "NekoDrift instructions exist, but Claude is not importing them yet.", claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
    }
    return { status: "not_installed", message: "Claude NekoDrift instructions are not installed.", claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Claude NekoDrift instruction status is unavailable.", claudeMdPath: paths.claudeMdPath, nekoDriftMemoryPath: paths.nekoDriftMemoryPath };
  }
}

export function getClaudeMemoryPaths(homeDir: string): { readonly claudeDir: string; readonly claudeMdPath: string; readonly nekoDriftMemoryPath: string } {
  const claudeDir = join(homeDir, ".claude");
  return {
    claudeDir,
    claudeMdPath: join(claudeDir, "CLAUDE.md"),
    nekoDriftMemoryPath: join(claudeDir, "nekodrift.md"),
  };
}

export function createNekoDriftMemoryBlock(): string {
  return `${nekoDriftMemoryStart}\n## NekoDrift\n\nNekoDrift MCP tools may be available.\n\nUse NekoDrift as a short visible status channel for meaningful coding progress:\n- Use \`nekodrift_say\` when starting, completing, blocking, or needing review on non-trivial work.\n- Keep messages brief, user-facing, and non-sensitive.\n- Do not include code, logs, secrets, URLs, or file paths.\n- Use \`nekodrift_react\` for small visual or emotional feedback.\n- Use \`nekodrift_status\` only when checking availability or the targeted pet.\n- Do not spam every internal step.\n${nekoDriftMemoryEnd}\n`;
}

export function ensureImportLine(source: string, importLine: string): string {
  const lines = source.split(/\r?\n/);
  const filtered = lines.filter((line) => line.trim() !== importLine);
  const base = filtered.join("\n").replace(/\s*$/u, "");
  return base ? `${base}\n\n${importLine}\n` : `${importLine}\n`;
}

export function ensureManagedImport(source: string): string {
  const withoutManagedImports = removeManagedImport(source).replace(/\s*$/u, "");
  if (withoutManagedImports.split(/\r?\n/).some((line) => line.trim() === nekoDriftClaudeImportLine)) {
    return withoutManagedImports ? `${withoutManagedImports}\n` : "";
  }
  const block = `${nekoDriftImportStart}\n${nekoDriftClaudeImportLine}\n${nekoDriftImportEnd}`;
  return withoutManagedImports ? `${withoutManagedImports}\n\n${block}\n` : `${block}\n`;
}

export function removeManagedImport(source: string): string {
  return source.replace(createManagedImportPattern(), "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/u, (match) => (match.includes("\n") ? "\n" : ""));
}

export function removeImportLine(source: string, importLine: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim() !== importLine)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*$/u, (match) => (match.includes("\n") ? "\n" : ""));
}

export function upsertNekoDriftMemoryBlock(source: string, block: string): string {
  const withoutBlocks = source.replace(createNekoDriftBlockPattern(), "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/u, "");
  return withoutBlocks ? `${withoutBlocks}\n\n${block}` : block;
}

export function removeNekoDriftMemoryBlock(source: string): string {
  const withoutBlock = source.replace(createNekoDriftBlockPattern(), "").replace(/\n{3,}/g, "\n\n").trim();
  return withoutBlock ? `${withoutBlock}\n` : "";
}

function createNekoDriftBlockPattern(): RegExp {
  return new RegExp(`${escapeRegExp(nekoDriftMemoryStart)}[\\s\\S]*?${escapeRegExp(nekoDriftMemoryEnd)}\\n?`, "g");
}

function createManagedImportPattern(): RegExp {
  return new RegExp(`${escapeRegExp(nekoDriftImportStart)}[\\s\\S]*?${escapeRegExp(nekoDriftImportEnd)}\\n?`, "g");
}

function hasManagedImport(source: string): boolean {
  return createManagedImportPattern().test(source);
}

function hasImportLineOutsideManagedBlock(source: string): boolean {
  return removeManagedImport(source).split(/\r?\n/).some((line) => line.trim() === nekoDriftClaudeImportLine);
}

function assertSafeClaudeMemoryPaths(claudeDir: string, claudeMdPath: string, nekoDriftMemoryPath: string): void {
  if (existsSync(claudeDir)) {
    const stat = lstatSync(claudeDir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Claude memory directory is not a safe directory.");
  }
  for (const path of [claudeMdPath, nekoDriftMemoryPath]) {
    if (!existsSync(path)) continue;
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Claude memory file is not a safe regular file.");
    if (stat.size > maxClaudeMemoryBytes) throw new Error("Claude memory file is too large for NekoDrift to update safely.");
  }
}

function readTextFile(path: string): string {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function writePrivateTextFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  assertSafeWriteTarget(path);
  const tempPath = join(dirname(path), `.${process.pid}.${randomUUID()}.tmp`);
  const fd = openSync(tempPath, "wx", 0o600);
  try {
    writeFileSync(fd, content, { encoding: "utf8" });
  } finally {
    closeSync(fd);
  }
  assertSafeWriteTarget(path);
  renameSync(tempPath, path);
  try { chmodSync(path, 0o600); } catch { /* best effort */ }
}

function assertSafeWriteTarget(path: string): void {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Claude memory file is not a safe regular file.");
  if (stat.size > maxClaudeMemoryBytes) throw new Error("Claude memory file is too large for NekoDrift to update safely.");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
