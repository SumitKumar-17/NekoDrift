# NekoDrift Commands

Recommended clean setup:

```bash
npm install -g @neko-drift/cli
nekodrift status
nekodrift pets
nekodrift install <pet-id>
nekodrift configure --agent claude --pet <pet-id> --cwd <project-path> --yes
nekodrift configure --agent agent --pet <pet-id> --cwd <project-path> --yes
nekodrift configure --agent cursor --pet <pet-id> --cwd <project-path> --yes
nekodrift mcp --pet <pet-id>
```

One-off fallback when the user does not want a global install:

```bash
npx -y @neko-drift/cli@latest status
```

MCP package:

```bash
npx -y @neko-drift/mcp@latest --pet <pet-id>
```

Pet catalog:

```text
https://nekodrift.app/pets/catalog.v3.json
```

For search, fetch `catalog.v3.json`, then fetch its `search` URL and the listed search pages. Use matching search entries' `catalogPage` values to fetch `catalog.v3/page-XXX.json` pages for install metadata.
