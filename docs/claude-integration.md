# Claude integration

This document describes how NekoDrift Desktop integrates with Claude Code, what files are configured, how Claude reaches the desktop app, and which Claude events trigger pet reactions or speech.

## Integration surfaces

Claude support has three related surfaces:

1. **MCP tools** — Claude gets the `nekodrift_status`, `nekodrift_react`, and `nekodrift_say` tools.
2. **Claude memory instructions** — Claude is told when it should use those tools.
3. **Claude hooks** — Claude lifecycle and tool events automatically trigger NekoDrift reactions.

The desktop setup UI for these surfaces is implemented in `apps/desktop/src/agent-setup.ts` and exposed to the renderer through `nekodrift:agent-setup-snapshot` and `nekodrift:agent-setup-action`.

This document primarily describes **Desktop user/global setup**. The CLI also supports **project-local Claude setup**; see [Project-local Claude setup](#project-local-claude-setup).

## Files managed by NekoDrift

### Claude MCP entry

The MCP entry is installed into Claude Code by running a Claude command shaped like:

```sh
claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp
```

If the user selected a specific pet in the desktop setup UI, the command includes that pet:

```sh
claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp --pet <petId>
```

In local development or packaged desktop mode, NekoDrift can use `node <local-or-bundled-entry>` instead of `npx`.

Packaged and local `node <entry>` commands require `node` to be available on Claude Code's `PATH`. Desktop setup reports an error instead of installing a bundled command if `node --version` cannot run from the agent environment.

### Claude memory

NekoDrift writes two user-level Claude memory files:

```text
~/.claude/CLAUDE.md
~/.claude/nekodrift.md
```

`~/.claude/CLAUDE.md` receives a managed import block:

```md
<!-- OPENPETS:IMPORT:START -->
@~/.claude/nekodrift.md
<!-- OPENPETS:IMPORT:END -->
```

`~/.claude/nekodrift.md` receives the managed instruction block:

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

The memory installer is idempotent. It updates only the managed blocks, avoids symlinks and unsafe files, writes private files, and uses atomic temp-file writes.

### Claude hooks

Claude hooks are installed into:

```text
~/.claude/settings.json
```

NekoDrift-managed hook commands include this marker:

```text
--nekodrift-managed
```

The normal published hook command is:

```sh
npx -y @neko-drift/claude hook --nekodrift-managed
```

If a pet is selected:

```sh
npx -y @neko-drift/claude hook --nekodrift-managed --pet <petId>
```

NekoDrift installs the command for these Claude hook events:

```text
UserPromptSubmit
PreToolUse
PermissionRequest
Notification
Stop
StopFailure
```

Each hook entry is a Claude command hook with a short timeout and async execution enabled:

```json
{
  "type": "command",
  "command": "npx -y @neko-drift/claude hook --nekodrift-managed",
  "timeout": 3,
  "async": true,
  "asyncRewake": false
}
```

NekoDrift backs up `settings.json` before changing it and removes only hooks containing the `--nekodrift-managed` marker.

## Project-local Claude setup

The `@neko-drift/cli` package can configure a project-local Claude integration from a project directory:

```sh
nekodrift configure --agent claude --pet <petId>
```

Project-local setup differs from Desktop user/global setup:

- It uses `claude mcp add-json nekodrift ... --scope local` from the target project directory.
- It writes hooks to `<project>/.claude/settings.local.json`.
- Hook commands include both `--nekodrift-managed` and `--project-local`.
- Project-local hook entries use `timeout: 10`, `async: true`, and `asyncRewake: false`.
- The MCP and hooks are always configured with a selected `--pet <petId>`.

When a global NekoDrift Claude hook runs, it checks whether the current Claude project already has a project-local NekoDrift hook. If it finds one, the global hook does not send a duplicate reaction. This avoids double pet events when both global Desktop setup and project-local CLI setup exist.

Project-local files live inside the project and may be committed depending on the user's repository policy. They can contain the selected pet id.

## Runtime path

When Claude calls an NekoDrift tool or when a Claude hook fires, the runtime path is:

```text
Claude Code
  -> @neko-drift/mcp or @neko-drift/claude hook
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

Claude sees these tools when the MCP server is configured:

| Tool | Purpose | Desktop IPC method |
| --- | --- | --- |
| `nekodrift_status` | Check whether NekoDrift is reachable and which pet is targeted. | `status` |
| `nekodrift_react` | Set a short reaction on the target pet. | `pet.react` |
| `nekodrift_say` | Show a short safe speech bubble, optionally with a reaction. | `pet.say` |

`nekodrift_say` is validated before it reaches the desktop app. Messages must be short, single-line, and must not look like code, logs, secrets, URLs, or file paths.

## Pet targeting

If the MCP server or hook command was configured without `--pet`, events target the desktop default pet.

If it was configured with `--pet <petId>`, the process asks the desktop app for a lease. A valid installed non-default pet opens as an explicit agent pet window. Missing, invalid, broken, built-in, or default pet requests fall back to the default pet.

Explicit leases expire after a short TTL unless refreshed. When the last explicit lease for a pet expires or is released, NekoDrift clears and closes that agent pet window.

## Claude hook reaction and speech mapping

Claude hooks are decorative and best-effort. They must not block, approve, deny, or change Claude's behavior. If NekoDrift is closed or IPC is unavailable, the hook exits successfully and silently.

| Claude event | Trigger condition | Reaction | Speech bubble |
| --- | --- | --- | --- |
| `UserPromptSubmit` | User submits a prompt to Claude. | `thinking`, throttled. | None. |
| `PreToolUse` | Tool name is `Edit`, `Write`, or `MultiEdit`. | `editing` | None. |
| `PreToolUse` | Tool name is `Bash` and command text looks test-like. | `testing` | None. |
| `PreToolUse` | Tool name is `Bash` and command text does not look test-like. | None. | None. |
| `PreToolUse` | Any other tool. | None. | None. |
| `PermissionRequest` | Claude asks for approval. | `waiting` | `Approval needed`, throttled with a short cooldown. |
| `Notification` | Claude emits a notification hook event. | None. | None. |
| `Stop` | Claude finishes a response. | `success`, throttled. | None. |
| `StopFailure` | Claude stop/finalization fails. | `error` | One error-pool message, throttled. |
| Unknown event | Event is not recognized. | None | None. |

Test-like Bash detection is intentionally coarse and private. It may inspect only a bounded command string to classify the reaction. The command text is never sent to speech.

Claude hooks do **not** use the left/right walking animations or the `running` reaction. The `running-right` and `running-left` sprite rows are reserved for pet drag/move motion, and generic Bash/shell activity is silent by default. Hook reactions use quieter phase changes instead: editing maps to the generic active-work row, thinking maps to `review`, waiting/testing maps to `waiting`, success maps to `jumping`, and errors map to `failed`.

## Hook speech pools

When a hook is allowed to speak, it chooses one static local message from the matching pool:

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

Normal thinking and success hooks no longer speak, so their speech pools are retained for shared/static message support but are not used by Claude's default quiet hook policy. Reaction-only hooks are also deduped, with the same reaction suppressed for about 10 seconds.

Throttle state stores only speech-category and reaction timestamp keys, never prompts, commands, tool input, output, code, logs, or transcripts.

## Safety rules

- Hook stdout stays empty so Claude does not ingest accidental context.
- Hook errors are swallowed unless debug logging is enabled.
- Hook debug logs sanitize path-like values. MCP/client-side validation separately rejects secret-looking speech.
- Speech is static and local; it does not include model-generated text.
- Tool input and command text are used only for coarse reaction classification.
- Managed setup refuses unsafe symlinks and non-regular files. Claude memory files also have an oversized-file safety limit before NekoDrift edits them.
