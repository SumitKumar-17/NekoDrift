import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { mapAsarPathToUnpacked } from "@neko-drift/claude";
import { doctorAgentGlobalSetup, parseAgentConfig, prepareAgentGlobalRemove, prepareAgentGlobalSetup, writePreparedAgentGlobalRemove, writePreparedAgentGlobalSetup } from "@neko-drift/agent";

const root = mkdtempSync(join(tmpdir(), "nekodrift-desktop-agent-"));

try {
  const globalDir = join(root, "opencode-global");
  const bundledCli = mapAsarPathToUnpacked(join(root, "NekoDrift.app", "Contents", "Resources", "app.asar", "node_modules", "@neko-drift", "cli", "dist", "index.js"));

  assert.equal(doctorAgentGlobalSetup(globalDir).status, "not_installed");

  const install = prepareAgentGlobalSetup({
    configDir: globalDir,
    petId: "fixer",
    cliVersion: "1.2.3",
    pluginVersion: "4.5.6",
    commandMode: "bundled",
    cliEntryPath: bundledCli,
  });

  assert.equal(install.configPath, join(globalDir, "opencode.jsonc"));
  assert.equal(install.instructionPath, join(globalDir, "nekodrift.md"));
  assert.match(install.configWrite.content, /app\.asar\.unpacked/);
  assert.doesNotMatch(install.configWrite.content, /app\.asar(?!\.unpacked)/);
  assert.match(install.configWrite.content, /@neko-drift/agent@4.5.6/);

  const preview = parseAgentConfig(install.configWrite.content);
  assert.equal(preview.ok, true, "desktop Agent preview must parse as JSONC without JSON.parse.");
  const previewConfig = preview.value as { readonly mcp?: { readonly nekodrift?: { readonly command?: readonly string[] } }; readonly plugin?: readonly unknown[] };
  assert.deepEqual(previewConfig.mcp?.nekodrift?.command, ["node", bundledCli, "mcp", "--pet", "fixer"]);
  assert.deepEqual(previewConfig.plugin, [["@neko-drift/agent@4.5.6", { pet: "fixer" }]]);

  writePreparedAgentGlobalSetup(install);
  assert.equal(doctorAgentGlobalSetup(globalDir).status, "installed");
  assert.match(readFileSync(join(globalDir, "nekodrift.md"), "utf8"), /NEKODRIFT:START/);

  const remove = prepareAgentGlobalRemove(globalDir);
  assert.equal(remove.configWrites.length, 1);
  writePreparedAgentGlobalRemove(remove);
  assert.equal(doctorAgentGlobalSetup(globalDir).status, "not_installed");

  const commentedGlobalDir = join(root, "commented-global");
  mkdirSync(commentedGlobalDir);
  writeFileSync(join(commentedGlobalDir, "opencode.jsonc"), `{
    // user comment must not block desktop preview planning
    "theme": "dark"
  }\n`, "utf8");
  const commented = prepareAgentGlobalSetup({ configDir: commentedGlobalDir, petId: "fixer", cliVersion: "1.2.3", pluginVersion: "4.5.6" });
  assert.equal(parseAgentConfig(commented.configWrite.content).ok, true);
  assert.match(commented.configWrite.content, /user comment/);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.error("Agent desktop setup validation passed.");
