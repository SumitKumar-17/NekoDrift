# OpenCode integration

This document describes how NekoDrift Desktop integrates with OpenCode, what files are configured, how OpenCode reaches the desktop app, and which OpenCode events trigger pet reactions or speech.

## Integration surfaces

OpenCode support has three related surfaces:

1. **MCP tools** — OpenCode gets the `nekodrift_status`, `nekodrift_react`, and `nekodrift_say` tools through `@neko-drift/cli mcp`.
2. **OpenCode instructions** — OpenCode loads a managed `nekodrift.md` instruction file telling agents when to use the tools.
3. **OpenCode plugin hooks** — `@neko-drift/opencode` turns OpenCode activity into automatic pet reactions and short safe speech.

The desktop setup UI for OpenCode is implemented in `apps/desktop/src/agent-setup.ts`. It previews, installs, doctors, and removes global OpenCode setup through `@neko-drift/opencode` helpers.

This document covers **Desktop global setup** first. The CLI also supports **project-local OpenCode setup**; see [Project-local OpenCode setup](#project-local-opencode-setup).

## Global config location

NekoDrift uses OpenCode's global config directory:

```text
OPENCODE_CONFIG_DIR, if set
Windows: %APPDATA%/opencode
macOS/Linux: $XDG_CONFIG_HOME/opencode, or ~/.config/opencode fallback
```

Inside that directory NekoDrift considers these config files, in order:

```text
config.json
opencode.json
opencode.jsonc
```

If no file exists, the default creation target is:

```text
opencode.jsonc
```

NekoDrift also writes a global instruction file:

```text
<opencode-config-dir>/nekodrift.md
```

## Files and config managed by NekoDrift

OpenCode global setup writes or updates three config fields.

### MCP entry

Published setup creates an MCP entry like:

```jsonc
{
  "mcp": {
    "nekodrift": {
      "type": "local",
      "command": ["npx", "-y", "@neko-drift/cli@<version>", "mcp"],
      "enabled": true
    }
  }
}
```

If a pet is selected, the command includes it:

```jsonc
"command": ["npx", "-y", "@neko-drift/cli@<version>", "mcp", "--pet", "<petId>"]
```

In local development or packaged desktop mode, NekoDrift can use:

```jsonc
"command": ["node", "<local-or-bundled-cli-entry>", "mcp", ...]
```

Packaged and local `node <entry>` commands require `node` to be available on OpenCode's `PATH`. Desktop setup reports an error instead of installing a bundled command if `node --version` cannot run from the agent environment.

### Instructions

NekoDrift adds the managed instruction file to OpenCode's `instructions` array:

```jsonc
{
  "instructions": ["<opencode-config-dir>/nekodrift.md"]
}
```

That file contains:

```md
<!-- OPENPETS:START -->
## NekoDrift

NekoDrift MCP tools may be available.

Use NekoDrift as a short visible status channel for meaningful coding progress:
- Use `nekodrift_say` when starting, completing, blocking, or needing review on non-trivial work.
- Keep messages brief, user-facing, and non-sensitive.
- Do not include code, logs, secrets, URLs, or file paths.
- Use `nekodrift_react` for small visual or emotional feedback.
- Use `nekodrift_status` only when checking availability or the targeted pet.
- Do not spam every internal step.
<!-- OPENPETS:END -->
```

### Plugin

NekoDrift adds the OpenCode plugin:

```jsonc
{
  "plugin": ["@neko-drift/opencode@<version>"]
}
```

If a pet is selected, the plugin entry includes options:

```jsonc
{
  "plugin": [["@neko-drift/opencode@<version>", { "pet": "<petId>" }]]
}
```

The plugin id is:

```text
neko-drift-opencode
```

## Setup behavior

NekoDrift global setup is conservative:

- It parses OpenCode config as JSONC, not strict JSON.
- It preserves unrelated user config.
- It avoids unsafe symlinks and oversized files.
- It writes temp files and backups before replacing existing files.
- It refuses to overwrite custom NekoDrift-like config entries that it cannot prove are managed by NekoDrift.
- It cleans up stale managed entries from any non-selected global config file when one selected config file becomes the owner.

NekoDrift chooses one global config file as the owner for the managed MCP, instructions, and plugin entries. It first prefers the effective owner of relevant array fields such as `plugin` or `instructions`, then reuses an existing managed NekoDrift owner, then uses the highest-precedence existing global config file, and finally creates `opencode.jsonc` if none exists. Setup refuses ambiguous cases, such as plugin and instruction arrays living in different files, managed NekoDrift entries appearing in multiple global files, or higher-precedence arrays shadowing lower-precedence user entries.

Removal deletes only NekoDrift-managed MCP, instructions, and plugin entries. It leaves unrelated OpenCode config intact.

## Project-local OpenCode setup

The `@neko-drift/cli` package can configure OpenCode inside a project:

```sh
nekodrift configure --agent opencode --pet <petId>
```

Project-local setup writes inside the current project directory:

```text
.opencode/opencode.jsonc
.opencode/nekodrift.md
```

If another supported OpenCode project config already exists, NekoDrift updates that file instead of creating `.opencode/opencode.jsonc`. Project-local setup adds the same three kinds of entries as global setup:

- `mcp.nekodrift` using `@neko-drift/cli mcp --pet <petId>`.
- `instructions` pointing to `.opencode/nekodrift.md`.
- `plugin` using `@neko-drift/opencode` with `{ "pet": "<petId>" }`.

Project-local config and instructions can be committed to the repository and include the selected pet id. That is useful for shared project identity, but users should review those files before committing.

## Runtime path

When OpenCode calls an NekoDrift MCP tool or when the OpenCode plugin reacts to an event, the runtime path is:

```text
OpenCode
  -> @neko-drift/cli mcp or @neko-drift/opencode plugin
  -> @neko-drift/client
  -> NekoDrift desktop local IPC discovery file
  -> NekoDrift desktop IPC socket/pipe
  -> default pet controller or explicit agent pet controller
```

The desktop app writes a discovery file such as:

```text
macOS: ~/Library/Application Support/NekoDrift/runtime/ipc.json
Windows: %APPDATA%/NekoDrift/runtime/ipc.json
Linux: $XDG_RUNTIME_DIR/nekodrift/ipc.json, or ~/.config/NekoDrift/runtime/ipc.json fallback
```

That file contains the IPC endpoint and a per-run token. Clients must send that token with every request.

## MCP tools

OpenCode sees these tools when the MCP entry is enabled:

| Tool | Purpose | Desktop IPC method |
| --- | --- | --- |
| `nekodrift_status` | Check whether NekoDrift is reachable and which pet is targeted. | `status` |
| `nekodrift_react` | Set a short reaction on the target pet. | `pet.react` |
| `nekodrift_say` | Show a short safe speech bubble, optionally with a reaction. | `pet.say` |

Depending on OpenCode's MCP naming, tool names may appear with a server prefix, for example `nekodrift_nekodrift_say`. The OpenCode plugin explicitly ignores NekoDrift tool calls so the pet does not react to its own status messages.

`nekodrift_say` is validated before it reaches the desktop app. Messages must be short, single-line, and must not look like code, logs, secrets, URLs, or file paths.

## Pet targeting

If the MCP command or plugin was configured without a pet, events target the desktop default pet.

If configured with a pet, NekoDrift asks the desktop app for a lease:

```text
lease.acquire({ requestedPetId: "<petId>" })
```

Routing rules:

- Missing `pet` option -> default pet.
- Requested pet is the default pet or built-in pet -> default pet.
- Invalid, missing, or broken pet -> default pet with a fallback reason.
- Valid installed non-default pet -> explicit agent pet window.

Explicit leases expire after a short TTL unless refreshed. The plugin caches and reuses a lease while it is still valid. When the last explicit lease for a pet expires or is released, NekoDrift clears and closes that agent pet window.

## OpenCode plugin reaction and speech mapping

The OpenCode plugin is decorative and best-effort. It schedules NekoDrift work in the background and returns immediately so it does not slow down OpenCode hooks. If NekoDrift is closed or IPC is unavailable, the plugin swallows the error.

| OpenCode event/hook | Trigger condition | Reaction | Speech bubble |
| --- | --- | --- | --- |
| `chat.message` | OpenCode receives a chat message. | `thinking`, throttled. | None. |
| `tool.execute.before` | Tool name contains `edit`, `write`, `patch`, or `apply_patch`. | `editing` | None. |
| `tool.execute.before` | Tool name contains `bash`, `shell`, or `terminal`, and command args look test-like. | `testing` | None. |
| `tool.execute.before` | Tool name contains `bash`, `shell`, or `terminal`, and command args do not look test-like. | None. | None. |
| `tool.execute.before` | Any other non-NekoDrift tool. | None. | None. |
| `event` | Bus event type is `permission.asked` for a non-NekoDrift tool. | `waiting` | `Approval needed`, throttled with a short cooldown. |
| `event` | Bus event type is `session.error`. | `error` | One error-pool message, throttled. |
| `event` | Bus event type is `session.status` and status type is `idle`. | `success`, throttled. | None. |
| `tool.execute.after` | Any tool completed. | None | None. |
| NekoDrift MCP tool | Tool name is `nekodrift_status`, `nekodrift_say`, `nekodrift_react`, or server-prefixed equivalent. | None | None. |
| Unknown event | Event is not recognized. | None | None. |

Test-like command detection is intentionally coarse and private. It may inspect only a bounded command string to classify the reaction. The command text is never sent to speech.

OpenCode hooks do **not** use the left/right walking animations or the `running` reaction. The `running-right` and `running-left` sprite rows are reserved for pet drag/move motion, and generic shell activity is silent by default. Hook reactions use quieter phase changes instead: editing maps to the generic active-work row, thinking maps to `review`, waiting/testing maps to `waiting`, success maps to `jumping`, and errors map to `failed`.

## Plugin speech pools

When the plugin is allowed to speak, it chooses one static local message from the matching pool:

| Category | Possible messages |
| --- | --- |
| `thinking` | `Thinking it through`, `Let me check`, `On it`, `Working it out` |
| `success` | `Done`, `That worked`, `All set`, `Nice, finished` |
| `error` | `Something failed`, `Needs another look`, `Hit a snag`, `Not quite there` |
| `permission` | `Approval needed` |

Speech is throttled by category so hooks do not spam bubbles. Current speech cooldowns are:

| Category | Cooldown |
| --- | --- |
| `permission` | 3 seconds |
| `thinking`, `success`, `error` | 20 seconds each |

Normal thinking and success hooks no longer speak, so their speech pools are retained for shared/static message support but are not used by OpenCode's default quiet plugin policy. Reaction-only hooks are also deduped, with the same reaction suppressed for about 10 seconds.

OpenCode stores throttle state separately from Claude in an OpenCode-specific file, for example:

```text
Windows: %LOCALAPPDATA%/NekoDrift/opencode-hook-throttle.json
macOS/Linux: ${XDG_STATE_HOME:-~/.local/state}/nekodrift/opencode-hook-throttle.json
fallback: os.tmpdir()/nekodrift-<uid>/opencode-hook-throttle.json
```

Throttle state stores only speech-category and reaction timestamp keys, never prompts, commands, tool input, output, code, logs, or transcripts.

## Safety rules

- Plugin hooks return immediately and never await NekoDrift IPC directly.
- Plugin errors are swallowed unless debug logging is enabled.
- Debug logs sanitize paths and secret-looking values.
- Speech is static and local; it does not include model-generated text.
- Tool args and command text are used only for coarse reaction classification.
- The plugin ignores NekoDrift MCP tools to avoid feedback loops.
- Managed setup refuses unsafe symlinks, non-regular files, oversized config files, and conflicting custom NekoDrift-like config.
