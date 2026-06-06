# Integrations

## MCP

NekoDrift MCP exposes:

```text
nekodrift_status
nekodrift_react
nekodrift_say
```

Server command:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

## Claude Code

Use the CLI configure flow:

```bash
nekodrift configure --agent claude --pet <pet-id> --cwd <project-path> --yes
```

Claude hooks are optional and should not be changed without user approval.

## OpenCode

Use the CLI configure flow:

```bash
nekodrift configure --agent opencode --pet <pet-id> --cwd <project-path> --yes
```

OpenCode usually requires restart after config changes.

## Cursor and other MCP clients

Prefer the official configure flow when available. Otherwise configure an MCP server using:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

If the CLI is not installed globally, replace `nekodrift` with `npx -y @neko-drift/cli@latest`.
