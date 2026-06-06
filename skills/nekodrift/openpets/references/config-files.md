# Config Files

Prefer official NekoDrift configure commands over manual edits.

## Claude Code

```text
~/.claude/settings.json
~/.claude/CLAUDE.md
~/.claude/nekodrift.md
<project>/.claude/settings.local.json
```

Project command:

```bash
nekodrift configure --agent claude --pet <pet-id> --cwd <project-path> --yes
```

## OpenCode

```text
~/.config/opencode/opencode.json
~/.config/opencode/opencode.jsonc
<project>/.opencode/opencode.jsonc
<project>/.opencode/nekodrift.md
```

Project command:

```bash
nekodrift configure --agent opencode --pet <pet-id> --cwd <project-path> --yes
```

If the CLI is not installed globally, replace `nekodrift` with `npx -y @neko-drift/cli@latest`.

## Restart required

After MCP/plugin/hook/config changes, ask the user to restart Claude Code, OpenCode, Cursor, Codex, or their MCP client.
