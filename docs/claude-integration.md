# Claude Code Integration

NekoDrift can react to every Claude Code tool call in real time.

- While Claude is working → cat enters a **thinking pose**
- When Claude finishes → cat **jumps, celebrates, and meows**

---

## Setup

1. Open NekoDrift **Settings** → enable **Claude AI Integration**
2. Click **Copy config**
3. Paste into `~/.claude/settings.local.json` (create the file if it doesn't exist)

The config:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-thinking 2>/dev/null || true"
      }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-done 2>/dev/null || true"
      }]
    }]
  }
}
```

NekoDrift listens on `127.0.0.1:27182`. The `|| true` ensures a hook error never breaks Claude.

---

## Remove

Edit `~/.claude/settings.local.json` and remove the `PreToolUse` and `PostToolUse` entries.  
If that's the only thing in the file, delete it entirely.
