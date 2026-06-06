# Phase 07: Claude Code Detection and MCP Configuration

## Goal

Implement the first real Agent Setup experience for Claude Code: detect whether Claude Code appears available, show current NekoDrift MCP configuration status, preview the exact MCP configuration command/file shape, and apply/remove a safe MCP configuration only after explicit user confirmation.

This phase makes Claude Code usable with the Phase 06 MCP lease routing path. It does not implement Claude hooks yet.

## Non-goals

- No Claude hook install, uninstall, or hook event handling. That belongs in Phase 08.
- No Cursor, VS Code, Windsurf, OpenCode, or Antigravity configuration.
- No automatic silent edits during onboarding or app launch.
- No agent-managed pet installation/removal/default-pet changes.
- No attempt to parse or preserve every undocumented field in Claude's internal `~/.claude.json`; prefer official CLI commands for writes.
- No auto-launch of Claude Code itself.

## User-visible/manual outcome

From the tray menu, **Configure Agents...** opens a real Claude Code setup window instead of a placeholder. The user can:

- See Claude Code as detected, not detected, configured, needs setup, or error.
- See the NekoDrift MCP command that will be configured.
- Choose default-pet routing or an explicit installed pet for the Claude MCP server.
- Run a doctor/check to see actionable status.
- Click Configure only after seeing the planned change.
- Remove the NekoDrift MCP entry if it was configured by NekoDrift.

## Acceptance criteria

- Agent Setup window has a Claude Code card with clear status:
  - `Detected`
  - `Not detected`
  - `Configured`
  - `Needs setup`
  - `Error / needs attention`
- Detection is best-effort and non-invasive:
  - Check for a usable `claude` binary on `PATH` via `claude --version` with a short timeout.
  - Check MCP status using `claude mcp list` with a short timeout when Claude is available.
  - If Claude is missing or commands fail, report actionable text without crashing the app.
- Configuration target for Phase 07 is Claude Code user scope using the official CLI:
  - `claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp`
  - With explicit pet: `claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp --pet <petId>`
- Preview shows the exact command and the equivalent intended MCP JSON shape before applying.
- Configure requires an explicit button click in the UI.
- Removal requires an explicit button click in the UI and uses:
  - `claude mcp remove --scope user nekodrift`
- Remove is enabled only when Claude reports an `nekodrift` MCP entry. If the entry cannot be verified as NekoDrift-managed, the UI must warn that it will remove any Claude MCP server named `nekodrift`.
- Config operations are conservative and idempotent where Claude exposes enough detail:
  - If Claude reports an `nekodrift` MCP entry and a detail command/output lets NekoDrift verify the command/args match, Configure reports already configured / no change.
  - If Claude only reports `nekodrift` as present but does not expose reliable command/arg detail, Configure reports `Configured / needs manual verification` rather than replacing it.
  - If an `nekodrift` MCP entry exists but differs or cannot be verified, NekoDrift must not automatically remove it. The UI must show a separate Replace action with a strong warning before remove-then-add.
  - If Replace removes an entry but add fails, NekoDrift shows a clear failure and the action journal contains the previous detected summary and intended restore command; no OAuth/session config restoration is attempted.
- Backups/restore behavior is defined and implemented for the files NekoDrift directly edits.
  - Because Phase 07 writes via the Claude CLI rather than directly editing `~/.claude.json`, NekoDrift should not create a misleading full backup of that internal file by default.
  - NekoDrift records a local configuration action journal with timestamp, command preview, selected pet, and previous detected status where available.
  - Restore behavior for Phase 07 is removal of the NekoDrift MCP server entry through `claude mcp remove --scope user nekodrift`; it does not attempt to restore OAuth/session internals.
- Doctor/check reports:
  - Whether `claude` is found.
  - Whether `claude --version` works.
  - Whether `claude mcp list` works.
  - Whether an `nekodrift` MCP entry appears present.
  - What command NekoDrift expects.
  - That Claude Code may need restart/reload for MCP changes to take effect.
- UI is CSP-safe and uses Electron IPC handlers with sender checks.
- Renderer/main IPC is narrow: renderer sends only action names and `{ selectedPetId?: string }`; main constructs argv, revalidates selected pet against installed non-broken pets, and enforces sender checks for the Agent Setup window.
- Configure/remove/replace operations are serialized so concurrent clicks cannot run overlapping Claude CLI commands.
- Automated checks cover command construction, pet id argument handling, status parsing, and timeout/error classification.
- `pnpm check` passes.

## Proposed files/directories

- `packages/claude/src/index.ts`
  - Export Claude Code setup/detection helpers.
- `packages/claude/src/claude-code.ts`
  - `detectClaudeCode`, `buildClaudeMcpAddCommand`, `buildClaudeMcpRemoveCommand`, `parseClaudeMcpList`, status types.
- `packages/claude/src/check-claude-code.ts`
  - Node-based contract checks for command construction/status parsing.
- `packages/claude/package.json`
  - Include build/check script updates.
- `apps/desktop/src/agent-setup.ts`
  - Desktop orchestration for running Claude commands, timeouts, and local action journal.
- `apps/desktop/src/windows.ts`
  - Replace Agent Setup placeholder with real Claude setup UI and preload access.
- `apps/desktop/preload.cjs`
  - Expose narrow `nekodriftAgentSetup` methods to renderer, separate from broader app/window APIs.
- `apps/desktop/src/app-state.ts` or adjacent state helper
  - Persist lightweight agent setup status/action journal if needed.
- `docs/phases/phase-07-claude-detection-configuration.md`

## Technical approach

### Scope: Claude Code user-scope MCP only

Phase 07 configures the universal MCP path already built in Phase 06:

```text
Claude Code → @neko-drift/mcp → @neko-drift/client → desktop IPC → pet lease
```

Use a single MCP server name:

```text
nekodrift
```

Use user scope first because NekoDrift is a personal companion integration and should not silently create team/project files. Project-scoped `.mcp.json` and per-project pet choices can be documented later.

### Detection

Detection runs from the desktop main process, never from the sandboxed renderer.

Best-effort command sequence:

1. Resolve `claude` from `PATH` by running `claude --version`.
2. If `claude` is not found, try common platform locations only as non-invasive hints:
   - macOS GUI apps may have a reduced `PATH`; include common Homebrew/npm paths such as `/opt/homebrew/bin`, `/usr/local/bin`, and inherited `PATH` entries.
   - Windows may expose `claude.cmd`; command resolution should try `claude` and `claude.cmd` where appropriate.
3. Run `claude mcp list` if version works.
4. If an official/detail command is available and works (for example `claude mcp get nekodrift` or a future JSON output), use it to verify command/args. Otherwise treat list output as present/absent only.
5. Parse output conservatively for an `nekodrift` entry.
6. Return a structured result to the UI.

Each child process should:

- Have a short timeout, initially 3 seconds.
- Kill the child process on timeout and classify the result as timeout, not as a generic error.
- Capture bounded stdout/stderr.
- Avoid shell interpolation by using `spawn`/`execFile`-style argv arrays.
- Never include secrets in UI text.

### Command construction

Centralize command construction in `@neko-drift/claude` so tests can verify it without Electron:

Default pet:

```bash
claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp
```

Explicit pet:

```bash
claude mcp add --scope user nekodrift -- npx -y @neko-drift/mcp --pet snoopy
```

Removal:

```bash
claude mcp remove --scope user nekodrift
```

Pet id values come from installed NekoDrift pet ids in app state, not free-form UI entry. This avoids quoting/shell-injection complexity and aligns with the product rule that agents do not install/remove pets.

### Preview

Before applying, show:

- Human summary.
- Exact argv-style command.
- Equivalent intended MCP JSON shape:

```json
{
  "mcpServers": {
    "nekodrift": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@neko-drift/mcp"]
    }
  }
}
```

With explicit pet:

```json
"args": ["-y", "@neko-drift/mcp", "--pet", "snoopy"]
```

### Applying changes

Use Claude Code's official CLI rather than directly editing `~/.claude.json`:

- Configure new entry: `claude mcp add --scope user nekodrift -- ...`
- Update existing differing or unverifiable entry: only through a separate explicit Replace action with warning text.
- Remove NekoDrift entry: `claude mcp remove --scope user nekodrift`.

If configure/remove commands fail before making changes, show the sanitized stderr/stdout summary and leave state unchanged.

Exception: Replace is a two-step remove-then-add flow. If remove succeeds but add fails, Claude config has already changed; the UI must state that the previous `nekodrift` entry was removed and show the intended restore/add command from the action journal.

The UI should include a **Copy command** fallback so users can apply configuration manually if Claude CLI invocation from the Electron app fails because of PATH, permissions, or shell environment differences.

### Action journal and restore

Because user-scope MCP config lives inside Claude's internal `~/.claude.json`, which may include OAuth/session/private state, Phase 07 should not copy the whole file into NekoDrift backups by default.

Instead, persist an NekoDrift-local action journal entry for each attempted configuration/removal:

- timestamp
- action: configure/update/replace/remove
- selected pet id or default
- command argv preview
- detected previous NekoDrift status, if known
- success/failure and sanitized message

Location:

```text
<NekoDrift userData>/agent-setup-actions.json
```

Journal entries must be bounded and sanitized:

- Keep only the latest 20 entries.
- Store argv arrays and NekoDrift status labels.
- Store sanitized output summaries capped at 500 characters.
- Do not store raw Claude config files, OAuth/session data, full stdout/stderr, home-directory paths, tokens, or environment variables.

During implementation, verify current `claude mcp` CLI syntax against official docs/help output before wiring writes. If a detail/get command or output format is unavailable or unexpected, fail closed: classify the entry as present but unverifiable and require manual review/Replace rather than assuming ownership.

Restore path in Phase 07 is explicit uninstall/remove of the NekoDrift MCP entry via Claude CLI.

### UI shape

Agent Setup can stay lightweight and inline-data-URL based for now, matching existing Pet Manager/Settings style:

- Header: Configure Agents
- Claude Code card
- Status badge and details
- Pet selection dropdown: Default pet + installed non-broken pets
- Preview box
- Buttons: Refresh / Doctor, Configure, Remove
- If an existing `nekodrift` MCP entry is present but unverifiable/different, show a separate Replace action with stronger warning copy instead of silently changing it.
- Copy command fallback.
- Note: restart Claude Code if MCP changes do not appear immediately.

## Risks and tradeoffs

- Claude Code config behavior can change. Mitigation: use official CLI commands where possible and keep parsing conservative.
- `claude mcp list` output may not be stable. Mitigation: use it for status hints only; failed parsing reports needs manual check rather than corrupting config.
- Existing user config could be lost if NekoDrift blindly removes an `nekodrift` entry. Mitigation: no automatic replacement; require explicit Replace with warning and action journal.
- User-scope config is personal and may contain secrets. Mitigation: do not directly edit or back up full `~/.claude.json` in Phase 07.
- `npx -y @neko-drift/mcp` may use a published package in real installs, while local dev uses workspace packages. Mitigation: Phase 07 config preview targets the final product command; manual dev verification can inspect command preview without requiring published package behavior.
- Windows may need command resolution differences. Mitigation: command discovery tries platform variants, uses argv arrays, and includes Windows samples in checks.

## Security/privacy notes

- No shell string execution for user-controlled values.
- Pet choice is constrained to installed pet ids from app state.
- Renderer gets only narrow IPC methods for agent setup.
- Main process revalidates selected pet id and never trusts renderer-supplied command/argv.
- Sanitize child-process output before showing it in UI; bound max displayed length.
- Do not expose Claude config file contents or OAuth/session material in UI or logs.
- No silent configuration changes; user must click Configure/Remove.

## Test/check plan

- `packages/claude` contract checks:
  - command argv for default pet.
  - command argv for explicit pet.
  - remove argv.
  - equivalent JSON preview.
  - MCP list parsing for present/missing/error-ish samples.
  - unverifiable existing entry classification.
  - Windows/macOS command discovery/path sample helpers where factored.
  - invalid/free-form pet id rejection when using helper directly.
- Desktop checks:
  - Agent setup IPC renderer sender restrictions.
  - Command result timeout/error classification helper if factored separately.
  - Action journal redaction/bounds if factored separately.
- Workspace:
  - `pnpm check`

## Manual verification guide

After implementation:

1. Run `pnpm check`.
2. Start desktop: `pnpm --filter @neko-drift/desktop dev`.
3. Open tray → **Configure Agents...**.
4. Confirm Claude Code status appears and does not crash whether Claude is installed or not.
5. Choose default pet and inspect preview.
6. Choose an installed non-default pet and confirm preview adds `--pet <id>`.
7. Use Copy command to verify the manual fallback text is correct.
8. Click Configure only if you are comfortable modifying your Claude Code user MCP config.
9. Run `claude mcp list` separately and confirm `nekodrift` appears.
10. If using an unpublished local package, do not expect a real Claude session to load `npx -y @neko-drift/mcp` until the package is available; treat command/config preview and `claude mcp list` as the Phase 07 verification target.
11. Restart/open Claude Code and confirm NekoDrift MCP tools appear only if the package is published or your dev environment routes the package name locally.
12. Click Remove and confirm `claude mcp list` no longer shows `nekodrift`.
13. Optional safer test: create a fake `claude` executable earlier in `PATH` that records argv and returns sample `mcp list` output; launch the desktop app from that terminal so the modified `PATH` is inherited; use it to verify missing Claude, successful add, failed add, existing entry, replace warning, and remove flows without touching real Claude config.

Expected results:

- Detection and doctor statuses are actionable.
- Preview matches the command NekoDrift runs.
- Configure/remove are explicit and idempotent.
- NekoDrift does not edit Claude config silently.

## Oracle plan review

Reviewed. Oracle found the phase boundary and official-CLI direction sound, but flagged two blockers:

- Idempotency/update detection was underspecified because `claude mcp list` may not reliably prove command/args match.
- Remove-then-add could lose an existing user `nekodrift` config if add fails.

Oracle also requested clearer remove semantics, platform command discovery, stricter renderer/main IPC rules, action journal schema/location, operation locking/timeouts, safer manual verification, and not promising real MCP tools appear before package publishing/dev override exists.

## Oracle feedback disposition

Fixed:

- Weakened idempotency to verified-detail-only and present/absent otherwise.
- Added explicit Replace action for unverifiable/different existing entries; no automatic remove-then-add.
- Defined Remove warning semantics for unverifiable entries.
- Added macOS GUI PATH and Windows `claude.cmd` discovery considerations.
- Tightened renderer/main IPC boundary and main-process pet revalidation.
- Added action journal location/schema/redaction/bounds.
- Added `replace` to the action journal action schema and clarified Replace add-failure state.
- Added operation serialization and timeout kill behavior.
- Added Copy command fallback and safer fake-CLI/manual verification guidance.
- Clarified that real Claude MCP tools require published package or dev package routing.

Fixed after re-review:

- Clarified that Replace can change Claude config if remove succeeds and add fails, and must show restore/add guidance rather than claiming state is unchanged.
- Required implementation-time verification of current `claude mcp` CLI syntax/help and fail-closed behavior for unavailable/unexpected detail output.
- Clarified Agent Setup preload should be narrow/separate and fake-CLI testing requires launching desktop from a terminal with modified `PATH`.
