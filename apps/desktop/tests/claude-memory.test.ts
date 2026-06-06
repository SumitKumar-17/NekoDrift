import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ensureImportLine, ensureManagedImport, installClaudeNekoDriftMemory, openPetsClaudeImportLine, removeImportLine, removeNekoDriftMemoryBlock, uninstallClaudeNekoDriftMemory, upsertNekoDriftMemoryBlock } from "../src/claude-memory.js";

assert.equal(ensureImportLine("", openPetsClaudeImportLine), `${openPetsClaudeImportLine}\n`);
assert.equal(ensureImportLine("# User notes\n", openPetsClaudeImportLine), `# User notes\n\n${openPetsClaudeImportLine}\n`);
assert.equal(ensureImportLine(`# User notes\n${openPetsClaudeImportLine}\n${openPetsClaudeImportLine}\n`, openPetsClaudeImportLine), `# User notes\n\n${openPetsClaudeImportLine}\n`);
assert.equal(removeImportLine(`# User notes\n\n${openPetsClaudeImportLine}\n`, openPetsClaudeImportLine), "# User notes\n");
assert.match(upsertNekoDriftMemoryBlock("custom\n", "<!-- OPENPETS:START -->\nmanaged\n<!-- OPENPETS:END -->\n"), /custom[\s\S]*managed/);
assert.equal((upsertNekoDriftMemoryBlock("<!-- OPENPETS:START -->\nold\n<!-- OPENPETS:END -->\n\n<!-- OPENPETS:START -->\nolder\n<!-- OPENPETS:END -->\n", "<!-- OPENPETS:START -->\nnew\n<!-- OPENPETS:END -->\n").match(/OPENPETS:START/g) ?? []).length, 1);
assert.match(ensureManagedImport("# User notes\n"), /OPENPETS:IMPORT:START[\s\S]*@~\/\.claude\/nekodrift\.md[\s\S]*OPENPETS:IMPORT:END/);
assert.equal(ensureManagedImport(`${openPetsClaudeImportLine}\n`), `${openPetsClaudeImportLine}\n`, "user-owned import line should not be wrapped as managed.");
assert.equal(removeNekoDriftMemoryBlock("custom\n<!-- OPENPETS:START -->\nmanaged\n<!-- OPENPETS:END -->\n"), "custom\n");

const dir = mkdtempSync(join(tmpdir(), "nekodrift-claude-memory-"));
try {
  const claudeDir = join(dir, ".claude");
  const claudeMd = join(claudeDir, "CLAUDE.md");
  const nekodriftMd = join(claudeDir, "nekodrift.md");
  mkdirSync(claudeDir);
  writeFileSync(claudeMd, "# Existing Claude instructions\n\nKeep this.\n", "utf8");

  const installed = installClaudeNekoDriftMemory(dir);
  assert.equal(installed.changed, true);
  assert.match(readFileSync(claudeMd, "utf8"), /Keep this\.[\s\S]*@~\/\.claude\/nekodrift\.md/);
  assert.match(readFileSync(nekodriftMd, "utf8"), /nekodrift_say/);

  const reinstalled = installClaudeNekoDriftMemory(dir);
  assert.equal(reinstalled.changed, false);
  assert.equal((readFileSync(claudeMd, "utf8").match(/@~\/\.claude\/nekodrift\.md/g) ?? []).length, 1);
  assert.match(readFileSync(claudeMd, "utf8"), /OPENPETS:IMPORT:START/);

  writeFileSync(nekodriftMd, `${readFileSync(nekodriftMd, "utf8")}\nUser custom note.\n`, "utf8");
  const uninstalled = uninstallClaudeNekoDriftMemory(dir);
  assert.equal(uninstalled.changed, true);
  assert.doesNotMatch(readFileSync(claudeMd, "utf8"), /nekodrift\.md/);
  assert.equal(existsSync(nekodriftMd), true, "customized nekodrift.md should be preserved after managed block removal.");
  assert.match(readFileSync(nekodriftMd, "utf8"), /User custom note/);

  const userImportHome = join(dir, "user-import-home");
  const userClaudeDir = join(userImportHome, ".claude");
  mkdirSync(userClaudeDir, { recursive: true });
  writeFileSync(join(userClaudeDir, "CLAUDE.md"), `# User-owned import\n${openPetsClaudeImportLine}\n`, "utf8");
  writeFileSync(join(userClaudeDir, "nekodrift.md"), "User-owned content.\n", "utf8");
  installClaudeNekoDriftMemory(userImportHome);
  assert.doesNotMatch(readFileSync(join(userClaudeDir, "CLAUDE.md"), "utf8"), /OPENPETS:IMPORT:START/, "pre-existing import should remain user-owned.");
  uninstallClaudeNekoDriftMemory(userImportHome);
  assert.match(readFileSync(join(userClaudeDir, "CLAUDE.md"), "utf8"), /@~\/\.claude\/nekodrift\.md/, "user-owned import should not be removed.");
  assert.match(readFileSync(join(userClaudeDir, "nekodrift.md"), "utf8"), /User-owned content/, "user-owned nekodrift.md content should be preserved.");

  const symlinkHome = join(dir, "symlink-home");
  const symlinkTarget = join(dir, "outside");
  mkdirSync(symlinkHome);
  mkdirSync(symlinkTarget);
  symlinkSync(symlinkTarget, join(symlinkHome, ".claude"));
  assert.throws(() => installClaudeNekoDriftMemory(symlinkHome));

  const symlinkFileHome = join(dir, "symlink-file-home");
  mkdirSync(join(symlinkFileHome, ".claude"), { recursive: true });
  writeFileSync(join(dir, "outside-file"), "x", "utf8");
  symlinkSync(join(dir, "outside-file"), join(symlinkFileHome, ".claude", "CLAUDE.md"));
  assert.throws(() => installClaudeNekoDriftMemory(symlinkFileHome));

  const oversizedHome = join(dir, "oversized-home");
  mkdirSync(join(oversizedHome, ".claude"), { recursive: true });
  writeFileSync(join(oversizedHome, ".claude", "CLAUDE.md"), "x".repeat(1024 * 1024 + 1), "utf8");
  assert.throws(() => installClaudeNekoDriftMemory(oversizedHome));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("Claude memory validation passed.");
