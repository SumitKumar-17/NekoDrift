# Verify Claude Code

Use this workflow when the user asks whether Claude Code is connected to NekoDrift.

## Steps

1. Check Claude is available:

```bash
claude --version
```

2. Check the NekoDrift MCP entry:

```bash
claude mcp list
claude mcp get nekodrift
```

3. If configuration is missing, configure it:

```bash
nekodrift configure --agent claude --pet <pet-id> --cwd <project-path> --yes
```

If the CLI is not installed globally, replace `nekodrift` with `npx -y @neko-drift/cli@latest`.

4. Ask the user to restart Claude Code.
5. Verify from Claude with the MCP tool `nekodrift_status`.

## Hooks

Claude hooks are optional. Do not install or modify hooks unless the user asks for automatic reactions/status behavior.

If hooks are requested, prefer the official NekoDrift configure flow or NekoDrift Claude tooling instead of manual edits.
