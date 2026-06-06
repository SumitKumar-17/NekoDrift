# packages/claude/src/

## Files

- **index.ts**: Barrel export (6 lines). Re-exports all public modules.
- **cli.ts**: CLI entry (51 lines). Command routing for `hook`, `doctor-hooks`, `install-hooks`, `uninstall-hooks`.
- **hooks.ts**: Hook execution engine (229 lines). `runClaudeHookFromStdin()`, `handleClaudeHookPayload()`, `mapClaudeHookEvent()`, `classifyToolReaction()`, throttling, project-local detection.
- **hook-settings.ts**: Settings management (248 lines). `installClaudeHooks()`, `uninstallClaudeHooks()`, `doctorClaudeHooks()`, `addNekoDriftHooks()`, `removeNekoDriftHooks()`, path safety, backup logic.
- **hook-messages.ts**: Speech re-exports (1 line). Re-exports from `@neko-drift/agent-events`.
- **claude-code.ts**: MCP configuration (265 lines). `buildClaudeMcpPreview()`, `buildNekoDriftMcpServerCommand()`, `parseClaudeMcpGetOutput()`, `classifyClaudeMcpStatus()`, path validation, asar handling.
- **check-claude-code.ts**: MCP contract validation (excluded from detailed documentation).
- **check-claude-hooks.ts**: Hooks contract validation (excluded from detailed documentation).
