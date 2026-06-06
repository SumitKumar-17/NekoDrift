import assert from "node:assert/strict";

import { buildClaudeMcpGetCommand, buildClaudeMcpPreview, classifyClaudeMcpStatus, formatCommandForDisplay, getBundledMcpEntryPath, getLocalMcpEntryPath, mapAsarPathToUnpacked, parseClaudeMcpGetOutput, parseClaudeMcpListOutput, validateNekoDriftPetArg } from "./claude-code.js";

const defaultPreview = buildClaudeMcpPreview();
assert.deepEqual(defaultPreview.add.args, ["mcp", "add", "--scope", "user", "nekodrift", "--", "npx", "-y", "@neko-drift/mcp"]);
assert.deepEqual(defaultPreview.remove.args, ["mcp", "remove", "--scope", "user", "nekodrift"]);
assert.deepEqual(defaultPreview.mcpJson.mcpServers.nekodrift.args, ["-y", "@neko-drift/mcp"]);
assert.equal(formatCommandForDisplay(defaultPreview.add), "claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp");

const petPreview = buildClaudeMcpPreview("snoopy");
assert.deepEqual(petPreview.add.args, ["mcp", "add", "--scope", "user", "nekodrift", "--", "npx", "-y", "@neko-drift/mcp", "--pet", "snoopy"]);
assert.deepEqual(petPreview.mcpJson.mcpServers.nekodrift.args, ["-y", "@neko-drift/mcp", "--pet", "snoopy"]);
assert.deepEqual(buildClaudeMcpGetCommand().args, ["mcp", "get", "nekodrift"]);

const localPreview = buildClaudeMcpPreview("snoopy", "local");
assert.deepEqual(localPreview.add.args, ["mcp", "add", "--scope", "user", "nekodrift", "--", "node", getLocalMcpEntryPath(), "--pet", "snoopy"]);
assert.equal(localPreview.mcpJson.mcpServers.nekodrift.command, "node");
assert.deepEqual(localPreview.mcpJson.mcpServers.nekodrift.args, [getLocalMcpEntryPath(), "--pet", "snoopy"]);

assert.throws(() => validateNekoDriftPetArg("Bad Pet"));
assert.throws(() => validateNekoDriftPetArg("bad/pet"));
assert.equal(validateNekoDriftPetArg("snoopy"), "snoopy");

assert.equal(parseClaudeMcpListOutput("nekodrift: npx -y @neko-drift/mcp").present, true);
assert.equal(parseClaudeMcpListOutput("No MCP servers configured").present, false);

const jsonGet = parseClaudeMcpGetOutput(JSON.stringify({ command: "npx", args: ["-y", "@neko-drift/mcp", "--pet", "snoopy"] }), "snoopy");
assert.equal(jsonGet.present, true);
assert.equal(jsonGet.verified, true);
assert.equal(jsonGet.matchesExpected, true);

const localGet = parseClaudeMcpGetOutput(JSON.stringify({ command: "node", args: [getLocalMcpEntryPath(), "--pet", "snoopy"] }), "snoopy", "local");
assert.equal(localGet.matchesExpected, true);

const bundledPreview = buildClaudeMcpPreview("snoopy", "bundled");
assert.deepEqual(bundledPreview.add.args, ["mcp", "add", "--scope", "user", "nekodrift", "--", "node", getBundledMcpEntryPath(), "--pet", "snoopy"]);
assert.equal(bundledPreview.mcpJson.mcpServers.nekodrift.command, "node");
assert.deepEqual(bundledPreview.mcpJson.mcpServers.nekodrift.args, [getBundledMcpEntryPath(), "--pet", "snoopy"]);
const bundledGet = parseClaudeMcpGetOutput(JSON.stringify({ command: "node", args: [getBundledMcpEntryPath(), "--pet", "snoopy"] }), "snoopy", "bundled");
assert.equal(bundledGet.matchesExpected, true);
const customNode = "/Users/test/Library/Application Support/Herd/config/nvm/versions/node/v22.22.2/bin/node";
const customNodePreview = buildClaudeMcpPreview("snoopy", "bundled", customNode);
assert.equal(customNodePreview.mcpJson.mcpServers.nekodrift.command, customNode);
assert.equal(parseClaudeMcpGetOutput(JSON.stringify({ command: customNode, args: [getBundledMcpEntryPath(), "--pet", "snoopy"] }), "snoopy", "bundled", customNode).matchesExpected, true);

const spacedPath = "/Applications/NekoDrift Test.app/Contents/Resources/app/node_modules/@neko-drift/mcp/dist/index.js";
assert.equal(formatCommandForDisplay({ command: "node", args: [spacedPath, "--pet", "snoopy"] }), 'node "/Applications/NekoDrift Test.app/Contents/Resources/app/node_modules/@neko-drift/mcp/dist/index.js" --pet snoopy');
const spacedTextGet = parseClaudeMcpGetOutput(`nekodrift\nCommand: node\nArgs: "${getBundledMcpEntryPath()}" --pet snoopy`, "snoopy", "bundled");
assert.equal(spacedTextGet.matchesExpected, true);
assert.equal(formatCommandForDisplay({ command: "node", args: ["C:\\Program Files\\NekoDrift\\resources\\app\\node_modules\\@neko-drift\\mcp\\dist\\index.js"] }), 'node "C:\\\\Program Files\\\\NekoDrift\\\\resources\\\\app\\\\node_modules\\\\@neko-drift\\\\mcp\\\\dist\\\\index.js"');
assert.equal(mapAsarPathToUnpacked("/Applications/NekoDrift.app/Contents/Resources/app.asar/node_modules/@neko-drift/mcp/dist/index.js"), "/Applications/NekoDrift.app/Contents/Resources/app.asar.unpacked/node_modules/@neko-drift/mcp/dist/index.js");
assert.equal(mapAsarPathToUnpacked("C:\\Program Files\\NekoDrift\\resources\\app.asar\\node_modules\\@neko-drift\\mcp\\dist\\index.js"), "C:\\Program Files\\NekoDrift\\resources\\app.asar.unpacked\\node_modules\\@neko-drift\\mcp\\dist\\index.js");
assert.equal(mapAsarPathToUnpacked("/Applications/app.asarish/NekoDrift.app/Contents/Resources/app.asar/node_modules/@neko-drift/mcp/dist/index.js"), "/Applications/app.asarish/NekoDrift.app/Contents/Resources/app.asar.unpacked/node_modules/@neko-drift/mcp/dist/index.js");
assert.equal(mapAsarPathToUnpacked("/tmp/app.asar.unpacked/node_modules/@neko-drift/mcp/dist/index.js"), "/tmp/app.asar.unpacked/node_modules/@neko-drift/mcp/dist/index.js");

const textGet = parseClaudeMcpGetOutput("nekodrift\nCommand: npx\nArgs: -y @neko-drift/mcp --pet snoopy", "snoopy");
assert.equal(textGet.present, true);
assert.equal(textGet.verified, true);
assert.equal(textGet.matchesExpected, true);

const different = parseClaudeMcpGetOutput(JSON.stringify({ command: "node", args: ["server.js"] }), "snoopy");
assert.equal(different.present, true);
assert.equal(different.verified, true);
assert.equal(different.matchesExpected, false);

const unverifiable = classifyClaudeMcpStatus("nekodrift", "Name: nekodrift\nTransport: stdio", "snoopy");
assert.equal(unverifiable.present, true);
assert.equal(unverifiable.verified, false);
assert.equal(unverifiable.matchesExpected, false);

console.error("Claude Code setup validation passed.");
