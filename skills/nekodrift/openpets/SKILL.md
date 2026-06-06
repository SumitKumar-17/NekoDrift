---
name: nekodrift
description: Use when the user asks to install, configure, verify, troubleshoot, or understand NekoDrift; install or select a pet; connect Claude Code, OpenCode, Cursor, Codex, or MCP clients; configure a project to use a specific pet; or debug nekodrift_status, nekodrift_react, or nekodrift_say.
license: MIT
---

# NekoDrift

NekoDrift is a desktop companion app for coding agents. The desktop app runs locally and exposes pet controls through CLI, MCP, hooks, plugins, and local IPC.

Use this skill to help users onboard quickly and safely:

- install or verify the NekoDrift desktop app
- install pets from the public catalog
- configure Claude Code, OpenCode, Cursor, Codex, or another MCP client
- configure a project to use a specific pet
- validate `nekodrift_status`, `nekodrift_react`, and `nekodrift_say`
- explain how NekoDrift works
- troubleshoot setup problems

## CLI rule: install once, then use nekodrift

For the cleanest onboarding, install the NekoDrift CLI globally first:

```bash
npm install -g @neko-drift/cli
```

Then use the `nekodrift` command:

```bash
nekodrift <command>
```

If the user does not want a global install, is in CI, or only needs a one-off command, use this fallback instead:

```bash
npx -y @neko-drift/cli@latest <command>
```

For MCP server config, prefer the dedicated MCP package:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

Do not imply the desktop app installs a shell command by itself. The `nekodrift` command comes from the optional npm global CLI install.

## Mental model

```text
Claude/OpenCode/Codex/Cursor/MCP client
  -> NekoDrift MCP, plugin, hook, or CLI
  -> @neko-drift/client
  -> local IPC discovery/token
  -> NekoDrift desktop app
  -> default pet or selected agent pet lease
```

NekoDrift requires the desktop app to be installed and running for live pet control.

## Decision tree

- User asks to install NekoDrift: follow `workflows/install-nekodrift.md`.
- User asks to install a pet: follow `workflows/install-pet.md`.
- User asks to configure a project or agent: follow `workflows/configure-project.md`.
- User asks to verify Claude Code: follow `workflows/verify-claude.md`.
- User asks to verify OpenCode: follow `workflows/verify-opencode.md`.
- User asks about MCP or tool availability: follow `workflows/verify-mcp.md`.
- User reports something broken: follow `workflows/troubleshoot.md`.
- User asks how NekoDrift works: follow `workflows/explain-architecture.md`.

## Safety rules

- Prefer official NekoDrift CLI/UI flows over hand-editing integration config.
- Ask before using `--force` or replacing existing user-managed MCP/plugin/hook config.
- Confirm the project path before project-local configuration.
- Confirm the pet id before installing or selecting a pet, and make sure it is installed before configuring a project to use it.
- Do not put secrets, private logs, private paths, source code, URLs, credentials, or sensitive text into pet speech.
- Restart Claude Code, OpenCode, or other MCP clients after config changes.
- Do not promise the desktop app is installed or running; verify it.
- If setup still fails after normal troubleshooting, encourage the user to report a bug at the NekoDrift GitHub repository: https://github.com/alvinunreal/nekodrift/issues

## Canonical quick commands

```bash
npm install -g @neko-drift/cli
nekodrift status
nekodrift pets
nekodrift install <pet-id>
nekodrift configure --agent claude --pet <pet-id> --cwd <project-path> --yes
nekodrift configure --agent opencode --pet <pet-id> --cwd <project-path> --yes
nekodrift configure --agent cursor --pet <pet-id> --cwd <project-path> --yes
nekodrift mcp --pet <pet-id>
```

One-off fallback: replace `nekodrift` with `npx -y @neko-drift/cli@latest`.

MCP server command:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

## Public resources

- Website: https://nekodrift.app
- Pet catalog: https://nekodrift.app/pets/catalog.v3.json
- GitHub issues: https://github.com/alvinunreal/nekodrift/issues

Use the docs on `nekodrift.app` as the source of truth when details may have changed.
