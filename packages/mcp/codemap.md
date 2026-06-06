# packages/mcp/

MCP (Model Context Protocol) server for NekoDrift integration.

## Responsibility

Implements an MCP server exposing NekoDrift functionality to AI agents via the Model Context Protocol. Provides tools for checking status, setting reactions, and displaying messages on the desktop pet.

## Design

**MCP Server Setup** (`server.ts`):
- `McpServer` from `@modelcontextprotocol/sdk`
- Three registered tools: `nekodrift_status`, `nekodrift_react`, `nekodrift_say`
- Tool annotations for read-only/idempotent hints
- Instructions for AI agents (safety guidelines)

**Tool Implementations** (`tools.ts`):
- Zod schemas for input validation (`saySchema`, `reactSchema`)
- Lease-aware operations (acquires lease on startup, heartbeat every 5s)
- Throttling integration for speech/reactions
- Error sanitization (hides IPC paths, tokens)

**Lifecycle Management** (`index.ts`):
- Startup lease acquisition (async, non-blocking)
- Heartbeat timer (5s interval, unref'd)
- Graceful shutdown on SIGINT/SIGTERM (release lease, close server)
- Stdio transport via `StdioServerTransport`

**Argument Parsing** (`args.ts`):
- `--pet <id>` for targeted pet selection
- `--help`, `--version` flags
- Pet ID validation (regex: `^[a-z0-9][a-z0-9_-]{0,63}$`)

**Build Integration** (`ensure-executable.ts`):
- Post-build chmod 0o755 for Unix binaries

## Flow

```
main()
    ↓
parseMcpArgs() → { petId?, help, version }
    ↓
createToolContext() → { client, configuredPetId }
    ↓
acquireStartupLease() → lease.lease set on success
    ↓
createNekoDriftMcpServer() → Register 3 tools
    ↓
server.connect(StdioServerTransport)
    ↓
[Heartbeat] Every 5s: client.heartbeatLease()
    ↓
[Shutdown] SIGINT/SIGTERM → releaseLease() → server.close()
```

## Integration Points

**Dependencies**:
- `@neko-drift/client` - IPC communication
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation

**CLI Integration**: Spawned by `@neko-drift/cli` via `runMcp()` which forwards stdio and signals.

**Exports**:
- Binary: `neko-drift-mcp` (stdio MCP server)
- No programmatic exports (MCP server is standalone)
