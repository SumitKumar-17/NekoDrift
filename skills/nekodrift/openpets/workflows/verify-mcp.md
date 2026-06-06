# Verify MCP

Use this workflow when MCP tools are missing or unavailable.

## Expected tools

NekoDrift MCP exposes:

```text
nekodrift_status
nekodrift_react
nekodrift_say
```

## Server command

For MCP client configuration, use:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

or through the CLI:

```bash
nekodrift mcp --pet <pet-id>
```

If the CLI is not installed globally, replace `nekodrift` with `npx -y @neko-drift/cli@latest`.

## Checklist

1. Confirm the desktop app is running.
2. Confirm the MCP client has an NekoDrift server entry.
3. Confirm the server command uses `npx -y @neko-drift/mcp@latest --pet <pet-id>` or equivalent.
4. Restart the MCP client.
5. Call `nekodrift_status`.

If `nekodrift_status` says the desktop app or local IPC is unavailable, focus on the desktop app/runtime rather than MCP config.
