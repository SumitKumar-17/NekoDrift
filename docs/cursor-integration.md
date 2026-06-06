# Cursor Integration

NekoDrift supports Cursor through MCP configuration plus optional project rules. This document is the user and developer reference for the current integration, safety model, implementation files, and future phases.

## Current status

| Capability | Status | How it works |
| --- | --- | --- |
| Cursor MCP tools | Implemented | Cursor runs `@neko-drift/mcp` as a stdio MCP server. |
| Desktop global setup | Implemented | Desktop Agent Setup manages `~/.cursor/mcp.json`, only `mcpServers.nekodrift`. |
| CLI project setup | Implemented | `nekodrift configure --agent cursor` manages `<project>/.cursor/mcp.json`. |
| Project rules | Implemented | `nekodrift configure --agent cursor --rules-only` manages `<project>/.cursor/rules/nekodrift.mdc`. |
| Global/user rules | Not implemented | Cursor exposes user rules through Settings; NekoDrift does not assume a safe editable file path. |
| Hooks / ambient lifecycle reactions | Future phase | Requires a dedicated validation spike before writing hooks config. |
| Cursor extension/plugin | Future phase | Optional polish after config and hook behavior are proven. |

For now, Cursor integration is complete enough for MCP + project guidance. The next feature phase would be **Cursor hooks** for ambient reactions similar to Claude hooks/OpenCode plugin events.

## User setup

### Prerequisites

- NekoDrift desktop app is running.
- Cursor is installed.
- Node/npm are available for published `npx` mode, or the package is already cached.
- For project-local CLI setup, run commands from the project you want Cursor to use.

### Desktop: global Cursor MCP setup

Use this when you want Cursor to see NekoDrift tools in every Cursor project.

1. Open NekoDrift desktop.
2. Open **Integrations**.
3. Choose **Cursor**.
4. Pick a pet if desired.
5. Click **Install global setup**.
6. Restart/reload Cursor or start a fresh chat if Cursor does not pick up the server immediately.

Desktop writes only this global file:

```text
~/.cursor/mcp.json
```

It manages only:

```text
mcpServers.nekodrift
```

Unrelated Cursor MCP servers and top-level config are preserved.

### CLI: project-local Cursor MCP setup

Use this when you want the current repository to own its Cursor MCP config.

```bash
nekodrift configure --agent cursor --pet PET_ID
```

or from another directory:

```bash
nekodrift configure --agent cursor --cwd /path/to/project --pet PET_ID
```

The CLI writes:

```text
<project>/.cursor/mcp.json
```

`--pet` is optional. If omitted, the CLI may prompt from installed pets through the running desktop app.

### CLI: project Cursor rules

Cursor rules tell Cursor when and how to use the NekoDrift MCP tools safely. They are prompt guidance, not event hooks.

Install or update only the project rule:

```bash
nekodrift configure --agent cursor --rules-only
```

Install MCP config and rules together:

```bash
nekodrift configure --agent cursor --pet PET_ID --with-rules
```

Remove only the managed project rule:

```bash
nekodrift configure --agent cursor --remove-rules
```

The rules file is:

```text
<project>/.cursor/rules/nekodrift.mdc
```

`--rules-only` and `--remove-rules` do not need `--pet` and do not need the NekoDrift desktop app to be reachable.

### Force / conflict behavior

NekoDrift refuses to overwrite unknown user content by default.

Use `--force` only when you intentionally want to replace the dedicated NekoDrift entry/file:

```bash
nekodrift configure --agent cursor --rules-only --force
nekodrift configure --agent cursor --pet PET_ID --with-rules --force
```

`--force` is scoped:

- MCP replacement touches only `mcpServers.nekodrift`.
- Rules replacement touches only `.cursor/rules/nekodrift.mdc`.

Backups are created before replace/remove operations.

## What Cursor sees

### MCP tools

NekoDrift exposes these tools through `@neko-drift/mcp`:

- `nekodrift_status`
- `nekodrift_react`
- `nekodrift_say`

The expected Cursor MCP entry is strict JSON:

```json
{
  "mcpServers": {
    "nekodrift": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@neko-drift/mcp@VERSION", "--pet", "PET_ID"]
    }
  }
}
```

If no pet is selected, `--pet PET_ID` is omitted and NekoDrift routes to the default pet.

### Project rule content

NekoDrift writes a short `.mdc` rule with managed markers:

```mdc
---
description: Use NekoDrift MCP tools for lightweight coding-status feedback.
---

<!-- OPENPETS:CURSOR_RULES:START -->
# NekoDrift status feedback

You may use the NekoDrift MCP tools as a brief, safe status channel during meaningful coding work.

- Use `nekodrift_say` sparingly for major milestones, blocking states, completion, or when review is needed.
- Prefer `nekodrift_react` over speech for lightweight progress such as thinking, working, testing, success, or error.
- Keep messages short, user-facing, and safe.
- Do not send prompts, tool input/output, code, logs, stack traces, credentials, private file contents, URLs, file paths, or other sensitive content through NekoDrift.
- Do not spam every internal step; use NekoDrift only for meaningful progress changes and continue normally if a status update is unnecessary.
- If NekoDrift is unavailable, continue the coding task without failing.
<!-- OPENPETS:CURSOR_RULES:END -->
```

NekoDrift intentionally does **not** write `alwaysApply: true` by default to reduce context noise and tool spam.

## Cursor behavior and caveats

### Global vs project MCP config

Cursor documents:

- Global MCP config: `~/.cursor/mcp.json`
- Project MCP config: `.cursor/mcp.json`

Cursor merges global and project config. Project config takes priority for duplicate server names. NekoDrift uses the server name `nekodrift`, so a project-local `mcpServers.nekodrift` can override the global NekoDrift server.

### Restart/reload/new chat

Cursor MCP docs and behavior can vary by version and environment. If Cursor does not show NekoDrift tools after setup:

1. Start a new chat.
2. Reload Cursor.
3. Fully restart Cursor.
4. Verify Node/npm can run the configured `npx` command.

Rules are included as chat context. A new or refreshed chat may be needed for changed rules to be noticed.

### WSL, remote, and devcontainer caveats

NekoDrift desktop runs on the local OS and the MCP server connects to its local IPC endpoint. If Cursor runs MCP commands inside WSL, a remote host, or a devcontainer, the command may run somewhere that cannot reach the desktop app.

Symptoms:

- Cursor shows MCP connection failures.
- `nekodrift_status` reports the app is unreachable.
- The configured `npx` or `node` command is available in one environment but not the one Cursor uses.

Workarounds may require environment-specific command wrappers. NekoDrift does not currently write WSL/devcontainer-specific MCP entries automatically.

## Security and privacy model

NekoDrift treats Cursor config as user-owned.

### MCP config safety

The `@neko-drift/cursor` helpers:

- read strict JSON only;
- cap MCP config files at 256 KiB;
- reject symlinked config files;
- reject non-regular files;
- reject unsafe/symlinked parent paths;
- classify missing, installed, needs-update, conflict, invalid, and error states;
- preserve unrelated MCP servers and top-level fields;
- preview only the NekoDrift entry by default;
- redact sensitive fields if broader config previewing is needed;
- write with temp files and atomic rename;
- create backups before overwrite/remove operations;
- remove only recognized NekoDrift-managed entries.

### Rules safety

The rules helper:

- writes only `<project>/.cursor/rules/nekodrift.mdc`;
- treats the file as managed only when the exact NekoDrift frontmatter and a single ordered marker pair are present;
- classifies user-authored content as a conflict;
- caps rule file reads at 64 KiB;
- rejects symlinks, non-regular files, unsafe parents, and dangling symlinks;
- backs up before replacement/removal;
- removes only the managed `nekodrift.mdc` file and leaves `.cursor` directories in place.

### What NekoDrift does not do

NekoDrift does not:

- edit Cursor user/global rules settings;
- edit `~/.cursor/permissions.json`;
- add broad MCP/tool allowlists;
- write Cursor hooks yet;
- write project rules from desktop without a reviewed project picker;
- include prompts, tool input/output, code, logs, stack traces, credentials, private file contents, URLs, or paths in pet messages.

## Developer implementation map

### Shared package

`packages/cursor` is the pure Node.js package shared by CLI and desktop.

Key files:

- `packages/cursor/src/cursor-mcp.ts`
  - MCP entry builders.
  - Global/project MCP path helpers.
  - Pet id and version validation.
- `packages/cursor/src/cursor-status.ts`
  - MCP config safe read/classification/write/remove planning.
  - Managed NekoDrift MCP entry detection.
- `packages/cursor/src/cursor-previews.ts`
  - NekoDrift-only preview and secret redaction helpers.
- `packages/cursor/src/cursor-rules.ts`
  - Project rules content builder.
  - Rules status classification.
  - Safe rules install/replace/remove planning.
  - Atomic rules write/remove execution.
- `packages/cursor/src/check-cursor.ts`
  - Contract coverage for MCP config and rules behavior.

### CLI integration

Files:

- `packages/cli/src/index.ts`
- `packages/cli/src/check-cli-contract.ts`

Supported Cursor flags:

```bash
nekodrift configure --agent cursor --pet PET_ID
nekodrift configure --agent cursor --cwd /path/to/project --pet PET_ID
nekodrift configure --agent cursor --pet PET_ID --with-rules
nekodrift configure --agent cursor --rules-only
nekodrift configure --agent cursor --remove-rules
nekodrift configure --agent cursor --rules-only --force
```

Important semantics:

- Existing `configure --agent cursor` remains MCP-only.
- `--with-rules`, `--rules-only`, and `--remove-rules` are mutually exclusive.
- Cursor rules flags are rejected for non-Cursor agents.
- `--rules-only` and `--remove-rules` avoid pet resolution and desktop connectivity.
- `--with-rules` preflights MCP and rules plans before writing either file, preventing surprising partial setup.

### Desktop integration

Files:

- `apps/desktop/src/agent-setup.ts`
- `apps/desktop/src/windows.ts`
- `apps/desktop/preload.cjs`
- `apps/desktop/src/check-cursor-desktop.ts`
- `apps/desktop/src/check-packaging-contract.ts`

Desktop behavior:

- global Cursor MCP install/update/replace/remove in `~/.cursor/mcp.json`;
- Cursor detail pane with global warning;
- NekoDrift-only MCP preview;
- project rules preview and copy button;
- no desktop project rules writes;
- no new Cursor rules IPC actions.

### Release plumbing

`@neko-drift/cursor` is a public workspace package and is published before packages that consume it.

Relevant files:

- `packages/cursor/package.json`
- `packages/cli/package.json`
- `apps/desktop/package.json`
- `scripts/release-npm.mjs`
- `pnpm-lock.yaml`

## Validation and review history

### Phase 1 MCP

Validated:

- strict JSON assumption for MCP config;
- restart/reload guidance;
- global/project merge and project priority;
- documented stdio fields: `type`, `command`, `args`, optional `env`, optional `envFile`;
- direct pinned command strategy: `npx -y @neko-drift/mcp@VERSION`;
- real Cursor MCP smoke on 2026-05-14 with `@neko-drift/mcp@2.0.6`, showing connected with three tools enabled.

### Phase 2 rules

Validated from official docs:

- project rules live under `.cursor/rules`;
- `.md` and `.mdc` are documented;
- `.mdc` frontmatter supports `description`, `globs`, and `alwaysApply`;
- user rules are managed through Cursor Settings, not a documented editable file path;
- project rules do not require permissions file edits.

Implementation was reviewed with Oracle gates:

- Phase 2 spec review;
- core rules helper review;
- CLI phase review;
- desktop preview/copy review;
- final implementation review.

Checks passed during implementation:

```bash
pnpm --filter @neko-drift/cursor check
pnpm --filter @neko-drift/cli check
pnpm --filter @neko-drift/desktop check
pnpm check
```

## What is next?

Cursor MCP + project rules are done for now. The next integration phase would be **Cursor hooks** if we want automatic pet reactions during Cursor agent lifecycle events.

Before implementing hooks, run a validation spike and record:

- exact hook config file paths and schema;
- global/project hook precedence;
- payload fixtures for relevant events;
- stdout/stderr behavior;
- timeout behavior;
- fail-open/fail-closed behavior;
- workspace trust behavior;
- execution location for local, WSL, remote, and devcontainer setups;
- whether hook commands can avoid leaking prompt/tool/path data.

Until that spike is complete, NekoDrift should not write Cursor hook config.

## Official references

- Cursor MCP docs: https://cursor.com/docs/mcp
- Cursor MCP customization help: https://cursor.com/help/customization/mcp
- Cursor MCP CLI docs: https://cursor.com/docs/cli/mcp
- Cursor Rules docs: https://cursor.com/docs/rules
- Cursor Rules customization help: https://cursor.com/help/customization/rules
- Cursor permissions reference: https://cursor.com/docs/reference/permissions
- Cursor hooks docs: https://cursor.com/docs/hooks.md
- Cursor extension API: https://cursor.com/docs/extension-api
