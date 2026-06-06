# Troubleshoot NekoDrift

Use this workflow when setup or pet control is not working.

## Fast checklist

1. Is the desktop app installed and running?
2. Does CLI status connect?

```bash
nekodrift status
```

3. Are pets installed/listed?

```bash
nekodrift pets
```

4. Did the user restart Claude/OpenCode/MCP client after config changes?
5. Is the correct project path configured?
6. Is the selected pet id installed?
7. Can the machine reach `nekodrift.app` and `zip.nekodrift.app` for catalog/zip downloads?

## Common fixes

- Launch or relaunch the NekoDrift desktop app.
- Re-run the relevant `nekodrift configure ...` command.
- Restart the agent/client after changing MCP/plugin/hook config.
- Use the catalog API to confirm pet ids: https://nekodrift.app/pets/catalog.v3.json

If the CLI is not installed globally, replace `nekodrift` with `npx -y @neko-drift/cli@latest`.

## Bug reports

If normal troubleshooting does not resolve the issue, encourage the user to open an issue at:

https://github.com/alvinunreal/nekodrift/issues

Ask them to include OS, app version, agent/client, command attempted, and a short description of what happened. Do not ask them to paste secrets or private logs.
