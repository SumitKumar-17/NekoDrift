import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { hookSpeechPools, validateHookSpeech } from "@neko-drift/agent-events";

import { createAgentExecutableDetection, executePlannedWrite, getGlobalAgentConfigDir, getGlobalAgentConfigPaths, getProjectAgentConfigPaths, parseAgentConfig, planAgentConfigWrite, selectProjectAgentConfigPath, updateAgentConfigText } from "./agent-config.js";
import { buildAgentInstructionPath, buildAgentMcpEntry, buildAgentPluginPreview, formatAgentMcpConfig } from "./agent-previews.js";
import { doctorAgentGlobalSetup, prepareAgentGlobalRemove, prepareAgentGlobalSetup, writePreparedAgentGlobalRemove, writePreparedAgentGlobalSetup } from "./agent-global-setup.js";
import { classifyAgentInstructionsStatus, classifyAgentMcpStatus, classifyAgentPluginStatus } from "./agent-status.js";

const root = mkdtempSync(join(tmpdir(), "nekodrift-agent-"));
try {
  const project = join(root, "project");
  mkdirSync(project);
  const paths = getProjectAgentConfigPaths(project);
  assert.deepEqual(paths.candidates.map((path) => path.slice(project.length + 1)), ["opencode.json", "opencode.jsonc", ".opencode/opencode.json", ".opencode/opencode.jsonc"]);
  assert.equal(selectProjectAgentConfigPath(project), join(project, ".opencode", "opencode.jsonc"));
  mkdirSync(join(project, ".opencode"));
  writeFileSync(join(project, ".opencode", "opencode.jsonc"), "{}\n");
  assert.equal(selectProjectAgentConfigPath(project), join(project, ".opencode", "opencode.jsonc"));
  writeFileSync(join(project, "opencode.json"), "{}\n");
  assert.equal(selectProjectAgentConfigPath(project), join(project, "opencode.json"));

  assert.equal(getGlobalAgentConfigDir({ AGENT_CONFIG_DIR: join(root, "custom") }, root, "linux"), join(root, "custom"));
  assert.equal(getGlobalAgentConfigDir({ XDG_CONFIG_HOME: join(root, "xdg") }, root, "linux"), join(root, "xdg", "opencode"));
  assert.equal(getGlobalAgentConfigDir({ APPDATA: join(root, "appdata") }, root, "win32"), join(root, "appdata", "opencode"));
  assert.deepEqual(getGlobalAgentConfigPaths({ AGENT_CONFIG_DIR: join(root, "global") }, root, "linux").candidates.map((path) => path.slice(join(root, "global").length + 1)), ["config.json", "opencode.json", "opencode.jsonc"]);
  assert.deepEqual(createAgentExecutableDetection({ platform: "win32" }).command, "opencode.cmd");
  assert.deepEqual(createAgentExecutableDetection({ platform: "darwin" }).command, "opencode");

  assert.deepEqual(formatAgentMcpConfig({ cliVersion: "0.0.0", petId: "fixer" }), { mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: true } } });
  assert.deepEqual(buildAgentMcpEntry({ cliVersion: "0.0.0" }), { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp"], enabled: true });
  assert.deepEqual(buildAgentMcpEntry({ cliVersion: "0.0.0", environment: { NEKODRIFT_DISCOVERY_FILE: "/mnt/c/Users/alvin/AppData/Roaming/NekoDrift/runtime/ipc.json" } }), { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp"], enabled: true, environment: { NEKODRIFT_DISCOVERY_FILE: "/mnt/c/Users/alvin/AppData/Roaming/NekoDrift/runtime/ipc.json" } });
  assert.deepEqual(buildAgentMcpEntry({ cliVersion: "0.0.0", commandMode: "local", cliEntryPath: join(root, "cli.js"), petId: "fixer" }), { type: "local", command: ["node", join(root, "cli.js"), "mcp", "--pet", "fixer"], enabled: true });
  assert.throws(() => buildAgentMcpEntry({ cliVersion: "0.0.0", commandMode: "local", cliEntryPath: "relative.js" }));
  assert.throws(() => buildAgentMcpEntry({ cliVersion: "0.0.0", petId: "bad/pet" }));
  assert.equal(buildAgentInstructionPath("project"), ".opencode/nekodrift.md");
  assert.equal(buildAgentInstructionPath("global", join(root, "global")), join(root, "global", "nekodrift.md"));
  assert.deepEqual(buildAgentPluginPreview("fixer"), ["@neko-drift/agent", { pet: "fixer" }]);
  assert.deepEqual(buildAgentPluginPreview("fixer", "0.0.0"), ["@neko-drift/agent@0.0.0", { pet: "fixer" }]);

  const jsonc = `{
    // keep this comment
    "theme": "dark",
    "mcp": { "other": { "type": "local", "command": ["x"] } },
  }`;
  const parsed = parseAgentConfig(jsonc);
  assert.equal(parsed.ok, true);
  const updated = updateAgentConfigText(jsonc, [{ path: ["mcp", "nekodrift"], value: buildAgentMcpEntry({ cliVersion: "0.0.0", petId: "fixer" }) }]);
  assert.equal(typeof updated, "string");
  assert.match(String(updated), /keep this comment/);
  assert.match(String(updated), /"nekodrift"/);
  assert.match(String(updated), /"other"/);
  assert.equal(parseAgentConfig("{").ok, false);
  assert.equal(parseAgentConfig("[]").ok, false);
  assert.equal(parseAgentConfig(JSON.stringify({ mcp: [] })).ok, false);
  assert.equal(parseAgentConfig(JSON.stringify({ instructions: "x" })).ok, false);
  assert.equal(parseAgentConfig(JSON.stringify({ plugin: {} })).ok, false);
  assert.equal(parseAgentConfig(JSON.stringify({ instructions: [1] })).ok, false);
  assert.equal(parseAgentConfig(`{"x":"${"a".repeat(1024 * 1024)}"}`).ok, false);

  const expected = { cliVersion: "0.0.0", petId: "fixer" };
  assert.equal(classifyAgentMcpStatus([], expected).status, "not_installed");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: buildAgentMcpEntry(expected) } }], expected).status, "installed");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { ...buildAgentMcpEntry(expected), environment: { NEKODRIFT_DISCOVERY_FILE: "/mnt/c/Users/alvin/AppData/Roaming/NekoDrift/runtime/ipc.json" } } } }], expected).status, "installed");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: true, type: "local" } } }], expected).status, "installed");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: buildAgentMcpEntry({ cliVersion: "0.0.0", petId: "helper" }) } }], expected).status, "needs_update");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: buildAgentMcpEntry({ cliVersion: "0.0.0", commandMode: "local", cliEntryPath: join(root, "cli.js"), petId: "helper" }) } }], { cliVersion: "0.0.0", commandMode: "local", cliEntryPath: join(root, "cli.js"), petId: "fixer" }).status, "needs_update");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: false } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "remote", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: true } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@file:../cli", "mcp", "--pet", "fixer"], enabled: true } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@workspace:*", "mcp", "--pet", "fixer"], enabled: true } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: true, timeout: 10 } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: { type: "local", command: ["my-nekodrift-wrapper"] } } }], expected).status, "custom");
  assert.equal(classifyAgentMcpStatus([{ mcp: { nekodrift: buildAgentMcpEntry(expected) } }, { mcp: { nekodrift: buildAgentMcpEntry({ cliVersion: "0.0.0", petId: "helper" }) } }], expected).status, "conflict");
  assert.equal(classifyAgentInstructionsStatus([{ instructions: [".opencode/nekodrift.md"] }], "project", undefined, { ".opencode/nekodrift.md": "<!-- NEKODRIFT:START -->\nHi\n<!-- NEKODRIFT:END -->\n" }).status, "installed");
  assert.equal(classifyAgentInstructionsStatus([{ instructions: [".opencode/nekodrift.md"] }], "project").status, "needs_update");
  assert.equal(classifyAgentInstructionsStatus([{ instructions: [".opencode/nekodrift.md"] }, { instructions: ["old-nekodrift.md"] }], "project", undefined, { ".opencode/nekodrift.md": "<!-- NEKODRIFT:START -->\nHi\n<!-- NEKODRIFT:END -->\n" }).status, "conflict");
  assert.equal(classifyAgentInstructionsStatus([{ instructions: ["old-nekodrift.md"] }], "project").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent", { pet: "fixer" }]] }], "fixer").status, "installed");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@0.0.0", { pet: "fixer" }]] }], "fixer", "0.0.0").status, "installed");
  assert.equal(classifyAgentPluginStatus([{ plugin: ["@neko-drift/agent"] }], "fixer").status, "needs_update");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@old", { pet: "helper" }], "./nekodrift-custom-plugin.js"] }], "fixer", "0.0.0").status, "conflict");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@0.0.0"]] }], "fixer", "0.0.0").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@0.0.0", {}]] }], "fixer", "0.0.0").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@0.0.0", { pet: "fixer" }, "extra"]] }], "fixer", "0.0.0").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent@0.0.0", { pet: "fixer", extra: true }]] }], "fixer", "0.0.0").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: ["./nekodrift-custom-plugin.js"] }], "fixer").status, "custom");
  assert.equal(classifyAgentPluginStatus([{ plugin: [["@neko-drift/agent", { pet: "fixer" }], "./nekodrift-custom-plugin.js"] }], "fixer").status, "conflict");

  const writeTarget = join(root, "write", "opencode.jsonc");
  const writePlan = planAgentConfigWrite(root, writeTarget, "{\"mcp\":{}}\n");
  if ("targetPath" in writePlan) {
    executePlannedWrite(writePlan);
    assert.equal(existsSync(writeTarget), true);
    const second = planAgentConfigWrite(root, writeTarget, "{\"mcp\":{}}\n");
    assert.equal("backupPath" in second && Boolean(second.backupPath), true);
    if ("targetPath" in second && second.backupPath) {
      writeFileSync(second.backupPath, "already exists");
      assert.throws(() => executePlannedWrite(second));
    }
    assert.throws(() => executePlannedWrite({ ...writePlan, rootPath: join(root, "missing-root") }));
    assert.throws(() => executePlannedWrite({ ...writePlan, tempPath: join(tmpdir(), "nekodrift-unsafe.tmp") }));
    assert.throws(() => executePlannedWrite({ ...writePlan, backupPath: join(tmpdir(), "nekodrift-unsafe.backup") }));
  }
  const outsidePlan = planAgentConfigWrite(root, join(tmpdir(), "outside-opencode.jsonc"), "{}\n");
  assert.equal("ok" in outsidePlan ? outsidePlan.ok : true, false);
  const linkTarget = join(root, "link-target");
  mkdirSync(linkTarget);
  symlinkSync(linkTarget, join(root, "link-parent"));
  const linkParentPlan = planAgentConfigWrite(root, join(root, "link-parent", "opencode.jsonc"), "{}\n");
  assert.equal("ok" in linkParentPlan ? linkParentPlan.ok : true, false);
  const linkedFile = join(root, "linked-file.jsonc");
  writeFileSync(join(root, "real-file.jsonc"), "{}\n");
  symlinkSync(join(root, "real-file.jsonc"), linkedFile);
  const linkedFilePlan = planAgentConfigWrite(root, linkedFile, "{}\n");
  assert.equal("ok" in linkedFilePlan ? linkedFilePlan.ok : true, false);
  symlinkSync(project, join(root, "project-link"));
  assert.throws(() => getProjectAgentConfigPaths(join(root, "project-link")));

  const globalDir = join(root, "global-missing");
  const globalPrepared = prepareAgentGlobalSetup({ configDir: globalDir, petId: "fixer", cliVersion: "0.0.0" });
  writePreparedAgentGlobalSetup(globalPrepared);
  assert.equal(existsSync(join(globalDir, "opencode.jsonc")), true);
  assert.equal(doctorAgentGlobalSetup(globalDir).status, "installed");
  const globalConfig = readFileSync(join(globalDir, "opencode.jsonc"), "utf8");
  assert.match(globalConfig, /@neko-drift/agent@0.0.0/);
  assert.match(readFileSync(join(globalDir, "nekodrift.md"), "utf8"), /NEKODRIFT:START/);
  const globalRemove = prepareAgentGlobalRemove(globalDir);
  writePreparedAgentGlobalRemove(globalRemove);
  assert.equal(doctorAgentGlobalSetup(globalDir).status, "not_installed");

  const globalLower = join(root, "global-lower");
  mkdirSync(globalLower);
  writeFileSync(join(globalLower, "config.json"), JSON.stringify({ theme: "keep" }), "utf8");
  writeFileSync(join(globalLower, "opencode.jsonc"), JSON.stringify({ plugin: [["@neko-drift/agent@old", { pet: "helper" }]] }), "utf8");
  writePreparedAgentGlobalSetup(prepareAgentGlobalSetup({ configDir: globalLower, petId: "fixer", cliVersion: "0.0.0" }));
  assert.equal(readFileSync(join(globalLower, "config.json"), "utf8").includes("@neko-drift/agent"), false);
  assert.match(readFileSync(join(globalLower, "opencode.jsonc"), "utf8"), /@neko-drift/agent@0.0.0/);

  const globalExistingJson = join(root, "global-existing-json");
  mkdirSync(globalExistingJson);
  writeFileSync(join(globalExistingJson, "opencode.json"), JSON.stringify({ plugin: ["user-plugin"], instructions: ["USER.md"] }, null, 2), "utf8");
  const existingJsonPrepared = prepareAgentGlobalSetup({ configDir: globalExistingJson, petId: "fixer", cliVersion: "0.0.0" });
  assert.equal(existingJsonPrepared.configPath, join(globalExistingJson, "opencode.json"));
  writePreparedAgentGlobalSetup(existingJsonPrepared);
  assert.equal(existsSync(join(globalExistingJson, "opencode.jsonc")), false, "desktop global setup must not create a higher-precedence opencode.jsonc over an existing opencode.json");
  const existingJsonConfig = JSON.parse(readFileSync(join(globalExistingJson, "opencode.json"), "utf8")) as { readonly plugin?: readonly unknown[]; readonly instructions?: readonly string[] };
  assert.deepEqual(existingJsonConfig.plugin?.[0], "user-plugin");
  assert.ok(existingJsonConfig.instructions?.includes("USER.md"));

  const globalExistingMultiple = join(root, "global-existing-multiple");
  mkdirSync(globalExistingMultiple);
  writeFileSync(join(globalExistingMultiple, "config.json"), JSON.stringify({ theme: "base" }, null, 2), "utf8");
  writeFileSync(join(globalExistingMultiple, "opencode.json"), JSON.stringify({ plugin: ["user-plugin"] }, null, 2), "utf8");
  const existingMultiplePrepared = prepareAgentGlobalSetup({ configDir: globalExistingMultiple, petId: "fixer", cliVersion: "0.0.0" });
  assert.equal(existingMultiplePrepared.configPath, join(globalExistingMultiple, "opencode.json"));
  assert.equal(readFileSync(join(globalExistingMultiple, "config.json"), "utf8").includes("nekodrift"), false);

  const globalLowerPluginOwner = join(root, "global-lower-plugin-owner");
  mkdirSync(globalLowerPluginOwner);
  writeFileSync(join(globalLowerPluginOwner, "config.json"), JSON.stringify({ plugin: ["user-plugin"] }, null, 2), "utf8");
  writeFileSync(join(globalLowerPluginOwner, "opencode.json"), JSON.stringify({ theme: "dark" }, null, 2), "utf8");
  const lowerPluginPrepared = prepareAgentGlobalSetup({ configDir: globalLowerPluginOwner, petId: "fixer", cliVersion: "0.0.0" });
  assert.equal(lowerPluginPrepared.configPath, join(globalLowerPluginOwner, "config.json"));
  writePreparedAgentGlobalSetup(lowerPluginPrepared);
  const lowerPluginConfig = JSON.parse(readFileSync(join(globalLowerPluginOwner, "config.json"), "utf8")) as { readonly plugin?: readonly unknown[] };
  assert.deepEqual(lowerPluginConfig.plugin?.[0], "user-plugin");
  assert.equal(readFileSync(join(globalLowerPluginOwner, "opencode.json"), "utf8").includes("nekodrift"), false);

  const globalSplitArrayOwners = join(root, "global-split-array-owners");
  mkdirSync(globalSplitArrayOwners);
  writeFileSync(join(globalSplitArrayOwners, "config.json"), JSON.stringify({ plugin: ["user-plugin"] }, null, 2), "utf8");
  writeFileSync(join(globalSplitArrayOwners, "opencode.json"), JSON.stringify({ instructions: ["USER.md"] }, null, 2), "utf8");
  assert.throws(() => prepareAgentGlobalSetup({ configDir: globalSplitArrayOwners, petId: "fixer", cliVersion: "0.0.0" }), /different config files/);

  const globalEmptyPluginShadow = join(root, "global-empty-plugin-shadow");
  mkdirSync(globalEmptyPluginShadow);
  writeFileSync(join(globalEmptyPluginShadow, "config.json"), JSON.stringify({ plugin: ["user-plugin"] }, null, 2), "utf8");
  writeFileSync(join(globalEmptyPluginShadow, "opencode.json"), JSON.stringify({ plugin: [] }, null, 2), "utf8");
  assert.throws(() => prepareAgentGlobalSetup({ configDir: globalEmptyPluginShadow, petId: "fixer", cliVersion: "0.0.0" }), /higher-precedence config shadows user plugin/);

  const globalEmptyInstructionShadow = join(root, "global-empty-instruction-shadow");
  mkdirSync(globalEmptyInstructionShadow);
  writeFileSync(join(globalEmptyInstructionShadow, "config.json"), JSON.stringify({ instructions: ["USER.md"] }, null, 2), "utf8");
  writeFileSync(join(globalEmptyInstructionShadow, "opencode.json"), JSON.stringify({ instructions: [] }, null, 2), "utf8");
  assert.throws(() => prepareAgentGlobalSetup({ configDir: globalEmptyInstructionShadow, petId: "fixer", cliVersion: "0.0.0" }), /higher-precedence config shadows user instructions/);

  const globalEmptyArrayOwner = join(root, "global-empty-array-owner");
  mkdirSync(globalEmptyArrayOwner);
  writeFileSync(join(globalEmptyArrayOwner, "opencode.json"), JSON.stringify({ plugin: [] }, null, 2), "utf8");
  const emptyArrayOwnerPrepared = prepareAgentGlobalSetup({ configDir: globalEmptyArrayOwner, petId: "fixer", cliVersion: "0.0.0" });
  assert.equal(emptyArrayOwnerPrepared.configPath, join(globalEmptyArrayOwner, "opencode.json"));

  const globalStaleOverlay = join(root, "global-stale-overlay");
  mkdirSync(globalStaleOverlay);
  writeFileSync(join(globalStaleOverlay, "opencode.json"), JSON.stringify({ plugin: ["user-plugin"], instructions: ["USER.md"] }, null, 2), "utf8");
  writeFileSync(join(globalStaleOverlay, "opencode.jsonc"), JSON.stringify({ plugin: [["@neko-drift/agent@0.0.0", { pet: "helper" }]], instructions: [buildAgentInstructionPath("global", globalStaleOverlay)] }, null, 2), "utf8");
  const stalePrepared = prepareAgentGlobalSetup({ configDir: globalStaleOverlay, petId: "fixer", cliVersion: "0.0.1" });
  assert.equal(stalePrepared.configPath, join(globalStaleOverlay, "opencode.json"));
  assert.equal(stalePrepared.cleanupConfigWrites.length, 1);
  writePreparedAgentGlobalSetup(stalePrepared);
  const staleOwnerConfig = JSON.parse(readFileSync(join(globalStaleOverlay, "opencode.json"), "utf8")) as { readonly plugin?: readonly unknown[]; readonly instructions?: readonly string[] };
  assert.deepEqual(staleOwnerConfig.plugin?.[0], "user-plugin");
  assert.ok(staleOwnerConfig.instructions?.includes("USER.md"));
  const staleOverlayText = readFileSync(join(globalStaleOverlay, "opencode.jsonc"), "utf8");
  assert.doesNotMatch(staleOverlayText, /plugin/);
  assert.doesNotMatch(staleOverlayText, /instructions/);

  const globalStaleRemove = join(root, "global-stale-remove");
  mkdirSync(globalStaleRemove);
  writeFileSync(join(globalStaleRemove, "opencode.json"), JSON.stringify({ plugin: ["user-plugin"] }, null, 2), "utf8");
  writeFileSync(join(globalStaleRemove, "opencode.jsonc"), JSON.stringify({ plugin: [["@neko-drift/agent@0.0.0", { pet: "fixer" }]] }, null, 2), "utf8");
  writePreparedAgentGlobalRemove(prepareAgentGlobalRemove(globalStaleRemove));
  assert.doesNotMatch(readFileSync(join(globalStaleRemove, "opencode.jsonc"), "utf8"), /plugin/);
  assert.match(readFileSync(join(globalStaleRemove, "opencode.json"), "utf8"), /user-plugin/);

  const globalPublishedToBundled = join(root, "global-published-to-bundled");
  mkdirSync(globalPublishedToBundled);
  writeFileSync(join(globalPublishedToBundled, "opencode.jsonc"), JSON.stringify({ mcp: { nekodrift: buildAgentMcpEntry({ cliVersion: "0.0.0", petId: "helper" }) } }), "utf8");
  const bundledCli = join(root, "app.asar.unpacked", "node_modules", "@neko-drift", "cli", "dist", "index.js");
  const migrated = prepareAgentGlobalSetup({ configDir: globalPublishedToBundled, petId: "fixer", cliVersion: "0.0.1", pluginVersion: "0.0.2", commandMode: "bundled", cliEntryPath: bundledCli });
  assert.equal(migrated.configPath, join(globalPublishedToBundled, "opencode.jsonc"));
  assert.match(migrated.configWrite.content, /app\.asar\.unpacked/);
  assert.doesNotMatch(migrated.configWrite.content, /app\.asar(?!\.unpacked)/);
  assert.match(migrated.configWrite.content, /@neko-drift/agent@0.0.2/);

  const globalNoInstructionMarkers = join(root, "global-no-instruction-markers");
  mkdirSync(globalNoInstructionMarkers);
  writeFileSync(join(globalNoInstructionMarkers, "opencode.jsonc"), JSON.stringify({ instructions: [buildAgentInstructionPath("global", globalNoInstructionMarkers)] }), "utf8");
  writeFileSync(join(globalNoInstructionMarkers, "nekodrift.md"), "user owned\n", "utf8");
  const noMarkerRemove = prepareAgentGlobalRemove(globalNoInstructionMarkers);
  assert.equal(noMarkerRemove.instructionWrite, undefined);

  const globalCustomPluginOptions = join(root, "global-custom-plugin-options");
  mkdirSync(globalCustomPluginOptions);
  writeFileSync(join(globalCustomPluginOptions, "opencode.jsonc"), JSON.stringify({ plugin: [["@neko-drift/agent@0.0.0", { pet: "fixer", extra: true }]] }), "utf8");
  assert.throws(() => prepareAgentGlobalSetup({ configDir: globalCustomPluginOptions, petId: "fixer", cliVersion: "0.0.0" }));

  const globalCustom = join(root, "global-custom");
  mkdirSync(globalCustom);
  writeFileSync(join(globalCustom, "opencode.jsonc"), JSON.stringify({ mcp: { nekodrift: { type: "local", command: ["custom", "mcp"] } } }), "utf8");
  assert.throws(() => prepareAgentGlobalSetup({ configDir: globalCustom, petId: "fixer", cliVersion: "0.0.0" }));
  assert.throws(() => prepareAgentGlobalRemove(globalCustom));

  const globalManagedMcpEnvironment = join(root, "global-managed-mcp-environment");
  mkdirSync(globalManagedMcpEnvironment);
  writeFileSync(join(globalManagedMcpEnvironment, "opencode.jsonc"), JSON.stringify({ mcp: { nekodrift: { type: "local", command: ["npx", "-y", "@neko-drift/cli@0.0.0", "mcp", "--pet", "fixer"], enabled: true, environment: { NEKODRIFT_DEBUG: "1" } } } }), "utf8");
  assert.doesNotThrow(() => prepareAgentGlobalSetup({ configDir: globalManagedMcpEnvironment, petId: "fixer", cliVersion: "0.0.0" }));

  const globalSymlink = join(root, "global-symlink");
  const globalOutside = join(root, "global-outside");
  mkdirSync(globalOutside);
  writeFileSync(join(globalOutside, "opencode.jsonc"), "{}\n", "utf8");
  symlinkSync(globalOutside, globalSymlink);
  assert.equal(doctorAgentGlobalSetup(globalSymlink).status, "error");

  for (const [category, messages] of Object.entries(hookSpeechPools) as Array<[string, readonly string[]]>) {
    for (const message of messages) {
      assert.match(message, /^[A-Z]/, `${category} hook speech must start uppercase`);
      validateHookSpeech(message);
    }
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.error("Agent foundation validation passed.");
