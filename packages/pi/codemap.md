# packages/pi/

Publishable npm package for the NekoDrift Pi coding-agent integration.

## Responsibility

- Exposes `@neko-drift/pi` as a Pi package with a Pi extension resource.
- Maps Pi session/tool activity to safe NekoDrift reactions through `@neko-drift/client`.
- Registers a user slash command namespace, `/nekodrift`, for status, test, react, and say commands.
- Keeps MVP behavior default-pet-only and non-blocking; no Pi model-callable tools are registered.

## Design/Patterns

- **Package structure**: Standard npm package with `main`/`types` pointing to `dist/index.js`, Pi extension declared in `pi.extensions` array.
- **Dual exports**: Main package exports (`index.ts`) and dedicated extension entry (`extension.ts`) for Pi loader consumption.
- **Peer dependency**: Declares optional peer dependency on `@earendil-works/pi-coding-agent` for type safety without hard coupling.
- **Fire-and-forget scheduling**: All automatic event handlers use non-blocking scheduling with swallowed IPC failures to prevent Pi execution disruption.
- **Privacy-first**: Prompt text, assistant text, tool output, command output, file paths, URLs, and secrets are never forwarded to NekoDrift.

## Flow

```text
Pi extension loader
  -> packages/pi/src/extension.ts
  -> packages/pi/src/runtime.ts
  -> @neko-drift/client
  -> NekoDrift desktop local IPC
```

**Automatic event flow**:
1. Pi emits lifecycle events (`session_start`, `agent_start`, `turn_start`, etc.)
2. `extension.ts` receives event via `api.on()` and wraps in `PiEventEnvelope`
3. `runtime.ts` classifies event to determine appropriate reaction
4. Reaction dispatched to NekoDrift client via scheduled non-blocking call
5. IPC failures logged (if debug enabled) but never thrown to Pi

**Command flow**:
1. User types `/nekodrift <command>` in Pi
2. `registerCommand()` handler invoked with args string
3. `parseNekoDriftCommand()` validates and structures command
4. `executeCommand()` performs synchronous NekoDrift client calls
5. UI notifications sent via `ctx.ui.notify()`

## Integration

- **Upstream**: Consumes `@neko-drift/agent-events` for speech validation and `@neko-drift/client` for IPC.
- **Downstream**: Pi coding agent loads extension via `pi.extensions` manifest entry.
- **Desktop**: Communicates with NekoDrift desktop app through local socket IPC (via `@neko-drift/client`).
- **Commands**: `/nekodrift status`, `/nekodrift test`, `/nekodrift react <reaction>`, `/nekodrift say <message>`.

## Safety notes

- Automatic events use reactions and fixed message pools only.
- Prompt text, assistant text, tool output, command output, file paths, URLs, and secrets are not forwarded.
- NekoDrift IPC failures are swallowed by automatic event handlers so Pi execution continues.
