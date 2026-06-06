# packages/agent/src/

## Files

- **index.ts**: Barrel export (6 lines). Re-exports all public modules.
- **plugin.ts**: Agent plugin definition (10 lines). Default export with `id` and `server` factory.
- **agent-plugin-runtime.ts**: Plugin hook implementations (229 lines). `createNekoDriftAgentHooks()`, event classification, tool reaction mapping, lease management, throttling.
- **agent-config.ts**: Config file management (221 lines). Path resolution, JSONC parsing, safe file operations, atomic writes with backups.
- **agent-project-setup.ts**: Project-level setup (182 lines). `prepareAgentProjectSetup()`, `writePreparedAgentProjectSetup()`, instruction block management.
- **agent-global-setup.ts**: Global setup management (354 lines). `prepareAgentGlobalSetup()`, `prepareAgentGlobalRemove()`, cleanup writes, doctor command, config precedence handling, global state classification.
- **agent-status.ts**: Status classification (147 lines). `classifyAgentMcpStatus()`, `classifyAgentInstructionsStatus()`, `classifyAgentPluginStatus()`, managed MCP/plugin/instruction detection helpers, NekoDrift-like entry detection.
- **agent-previews.ts**: Config entry builders (55 lines). `buildAgentMcpEntry()`, `buildAgentPluginPreview()`, `buildAgentInstructionPath()`, `formatAgentMcpConfig()`, `validateNekoDriftPetArg()`.
- **check-agent-foundation.ts**: Contract validation (excluded from detailed documentation).
- **check-agent-plugin.ts**: Plugin contract validation (excluded from detailed documentation).
