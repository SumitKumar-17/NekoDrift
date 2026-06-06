# Explain NekoDrift Architecture

Use this workflow when the user asks how NekoDrift works.

## Short explanation

NekoDrift is a local desktop companion app. Coding agents do not directly draw pets; they call local tools or CLI commands. Those commands talk to the desktop app over local IPC, and the desktop app controls the visible pet.

## Flow

```text
Agent/client
  -> MCP server, plugin, hook, or CLI
  -> @neko-drift/client
  -> local IPC discovery/token
  -> NekoDrift desktop app
  -> pet window and animation state
```

## Integration roles

- MCP exposes `nekodrift_status`, `nekodrift_react`, and `nekodrift_say`.
- CLI performs setup, pet installation, status checks, and MCP server launch.
- Claude/OpenCode integrations add the right MCP/plugin/hook configuration and instructions.
- The desktop app owns pet display, catalog installs, IPC, and routing to the selected/default pet.

## Privacy note

Pet controls are intended to be local. Avoid sending sensitive text as pet speech.
