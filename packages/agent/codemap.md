# packages/agent/

Agent editor integration for NekoDrift.

## Responsibility

Provides comprehensive Agent editor integration including: MCP server configuration, plugin runtime with event hooks, project/global setup management/removal, and instruction file generation.

## Design

**Plugin Architecture** (`plugin.ts`):
- Default export: `{ id, server }` object
- Server factory: `createNekoDriftAgentHooks(options)`
- Plugin ID: `neko-drift-agent`

**Plugin Runtime** (`agent-plugin-runtime.ts`):
- Event hooks: `event`, `chat.message`, `tool.execute.before`, `tool.execute.after`
- Event classification: Maps Agent bus events to reactions/speech
- Tool classification: Edit → "editing", Bash test commands → "testing"
- Lease management: Acquires on first use, 2s buffer before expiry
- Throttling: 20s speech cooldown, 3s permission cooldown, 10s reaction cooldown
- Async scheduling via `queueMicrotask`

**Config Management** (`agent-config.ts`):
- JSONC parsing with `jsonc-parser` (comments, trailing commas)
- Config path resolution (project: `.agent/`, global: `~/.config/agent/`)
- Safe file operations: atomic writes, backups, permission checks (0o600/0o700)
- Path traversal prevention (relative path validation)
- Symlink detection and rejection

**Project Setup** (`agent-project-setup.ts`):
- Status classification: `not_installed`, `installed`, `needs_update`, `custom`, `conflict`, `error`
- Managed block detection in instruction files (`<!-- NEKODRIFT:START/END -->`)
- Config field updates: `mcp`, `instructions`, `plugin` arrays
- Instruction file: `.agent/nekodrift.md` with usage guidelines

**Global Setup** (`agent-global-setup.ts`):
- Similar to project setup but for `~/.config/agent/`
- Setup cleanup writes: Removes managed duplicate entries from other config files
- Remove support: `prepareAgentGlobalRemove()` / `writePreparedAgentGlobalRemove()` remove managed MCP, instruction, and plugin entries plus the managed instruction block
- Doctor command: `doctorAgentGlobalSetup()` for status checking
- Config precedence handling: chooses the effective config file across `config.json`, `agent.json`, and `agent.jsonc`, preserving existing user arrays when safe

**Status Classification** (`agent-status.ts`):
- MCP entry detection: `isManagedNekoDriftMcpEntry()`
- Plugin entry detection: `isManagedNekoDriftPluginEntry()`
- Command pattern matching (npx, node, local paths)
- Version comparison for update detection

**Previews** (`agent-previews.ts`):
- MCP entry builder: `buildAgentMcpEntry()` (published/local/bundled modes)
- Plugin spec builder: `buildAgentPluginPreview()`
- Instruction path builder: `buildAgentInstructionPath()`
- Pet ID validation: `validateNekoDriftPetArg()`
- MCP config formatter: `formatAgentMcpConfig()`

## Flow

```
prepareAgentProjectSetup({ projectDir, petId, cliVersion })
    ↓
readExistingConfigs() → Parse all candidate config files
    ↓
classifyAgentMcpStatus() → Check if installed/needs update/conflict
    ↓
classifyAgentInstructionsStatus() → Check instruction file
    ↓
classifyAgentPluginStatus() → Check plugin array
    ↓
buildNextConfig() → Merge mcp/instructions/plugin updates
    ↓
planAgentConfigWrite() → Atomic write plan with backup
    ↓
planInstructionWrite() → Upsert managed instruction block
    ↓
writePreparedAgentProjectSetup() → Execute writes atomically
```

## Integration Points

**Dependencies**:
- `@neko-drift/client` - IPC for plugin runtime
- `@neko-drift/agent-events` - Speech pools and validation
- `jsonc-parser` - JSONC config parsing and editing

**Package Surface**:
- Package version: `2.1.1`
- Main export (`.`): setup, config, preview, status, and runtime APIs from `dist/index.js`
- Server export (`./server`): Agent plugin default export from `dist/plugin.js`

**Consumers**:
- `@neko-drift/cli` - `configure` command for Agent projects

**Exports**:
- `plugin.ts` - Default plugin export for Agent
- `prepareAgentProjectSetup()`, `writePreparedAgentProjectSetup()`
- `prepareAgentGlobalSetup()`, `writePreparedAgentGlobalSetup()`
- `prepareAgentGlobalRemove()`, `writePreparedAgentGlobalRemove()`
- Config management utilities
