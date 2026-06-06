# packages/

Monorepo workspace containing all NekoDrift npm packages. Each package is independently publishable with its own versioning.

## Responsibility

Provides modular, reusable components for the NekoDrift ecosystem:
- **pet-format**: Package marker interface for type identification
- **agent-events**: Speech pools and validation for agent feedback messages
- **client**: Core IPC client for communicating with NekoDrift desktop app
- **cli**: Main CLI tool for configuring agents and managing pets
- **mcp**: MCP server implementation for agent integration
- **agent**: Agent editor integration (plugin, config management)
- **claude**: Claude Code integration (hooks, MCP config)
- **cursor**: Cursor editor integration (MCP config, project rules)
- **pi**: Pi coding-agent extension integration (event hooks, slash commands)
- **install-pet**: Standalone pet installer from gallery catalog

## Design/Patterns

**Workspace Pattern**: Uses pnpm workspaces with `workspace:*` dependencies for internal linking.

**Package Structure**: Each package follows consistent structure:
- `src/` - TypeScript source
- `dist/` - Compiled output (not committed)
- `package.json` - Standard npm metadata with exports map
- `contracts/` - Runtime contract validation tests (client package)
- Contract check files (`check-*.ts`) for runtime validation (other packages)

**ESM-First**: All packages are ESM (`"type": "module"`) with dual exports for types.

**Versioning**: Independent versioning per package (currently 2.1.x for active integrations).

## Flow

```
CLI Entry (packages/cli/src/index.ts)
    ├── Configures Claude → @neko-drift/claude
    ├── Configures Agent → @neko-drift/agent
    ├── Configures Cursor → @neko-drift/cursor
    ├── Spawns MCP server → @neko-drift/mcp
    └── Uses IPC client → @neko-drift/client

MCP Server (packages/mcp/src/index.ts)
    ├── Registers tools (status, react, say)
    └── Communicates via @neko-drift/client

Agent Plugin (packages/agent/src/plugin.ts)
    └── Hooks into editor events → @neko-drift/client

Claude Hooks (packages/claude/src/hooks.ts)
    └── Processes hook events → @neko-drift/client

Cursor Setup (packages/cursor/src/cursor-project-setup.ts)
    └── Writes MCP config + rules → @neko-drift/client

Pi Extension (packages/pi/src/extension.ts)
    └── Registers Pi extension hooks/commands → @neko-drift/client
```

## Integration Points

**Inter-Package Dependencies**:
- `cli` depends on: `client`, `claude`, `mcp`, `agent`, `cursor`
- `mcp` depends on: `client`
- `claude` depends on: `client`, `agent-events`
- `agent` depends on: `client`, `agent-events`
- `cursor` depends on: `client`
- `pi` depends on: `client`, `agent-events` and declares optional `@earendil-works/pi-coding-agent` peer support
- `install-pet` depends on: `client`

**External Integrations**:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `jsonc-parser` - JSON with comments parsing for agent configs
- `yauzl` - ZIP extraction for pet downloads
- `zod` - Schema validation in MCP tools

**Desktop App Communication**:
All packages ultimately communicate with the NekoDrift desktop app via the IPC protocol defined in `client/src/protocol.ts`, supporting Unix sockets, Windows named pipes, and TCP (for WSL cross-platform).
