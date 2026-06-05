# NekoDrift

A pixel cat that lives on your desktop, reacts to your typing, follows your cursor, and integrates with Claude Code.

---

## Install

### Option A — Download a release (recommended)

1. Go to the [Releases page](https://github.com/SumitKumar-17/nekodrift/releases)
2. Download the file for your OS:
   - **macOS** → `.dmg`
   - **Windows** → `.exe` (NSIS installer) or the portable `.exe`
   - **Linux** → `.AppImage` or `.deb`
3. Install and run.

### Option B — Build from source

**Requirements:** Node.js 20+, npm

```bash
git clone https://github.com/SumitKumar-17/nekodrift.git
cd nekodrift
npm install
npm run build
npm start
```

To produce a distributable package:

```bash
npm run package          # auto-detects your OS
npm run package:mac
npm run package:win
npm run package:linux
```

Output is in `dist-electron/`.

---

## Platform setup

### Linux

Install these native libraries before `npm install`:

```bash
sudo apt-get install -y \
  libx11-dev libxtst-dev libpng-dev \
  libxcb-xfixes0-dev libxcb-image0-dev \
  libglib2.0-dev libgtk-3-dev
```

> **Wayland note:** NekoDrift runs under XWayland automatically. Global keyboard/mouse tracking via `uiohook-napi` works on X11 sessions. On a pure Wayland session it may not detect typing (the cat will still follow the cursor and all other features work).

> **Startup warnings** you may see in the terminal are benign and can be ignored:
> ```
> load_input_helper: XkbGetKeyboard failed to locate a valid keyboard!
> hook_thread_proc: Could not set thread priority 49
> ```

### macOS

On first launch, macOS will ask for **Accessibility permission** so NekoDrift can detect typing. A dialog will appear — click **Open Settings** and enable NekoDrift in:

`System Settings → Privacy & Security → Accessibility`

Then restart the app. Without this, the cat won't react to typing (all other features work fine).

If the app is blocked by Gatekeeper ("unidentified developer"), right-click the `.app` and choose **Open**.

### Windows

The NSIS installer handles everything. If SmartScreen warns about an unknown publisher, click **More info → Run anyway**.

---

## Claude Code integration

NekoDrift can react to every Claude Code tool call in real time — the cat goes into a thinking pose while Claude works, then celebrates when it finishes.

### Setup

1. Open **Settings** in NekoDrift → enable **Claude AI Integration**
2. Click **Copy config** to copy the hooks JSON
3. Paste it into `~/.claude/settings.local.json` (create the file if it doesn't exist)

The config to paste:

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

NekoDrift listens on `127.0.0.1:27182`. The hooks fire automatically whenever Claude uses a tool, and the `|| true` ensures Claude Code never fails because of a hook error.

### Remove the integration

Delete or edit `~/.claude/settings.local.json` to remove the hooks entries. The cat will stop reacting to Claude but everything else keeps working.

---

## Features

| Feature | Description |
|---|---|
| Cursor follow | Cat follows your cursor with smooth lag |
| Eye tracking | Eyes look toward the cursor |
| Typing detection | Cat types along with you; WPM drives heat level |
| Overheat | Type fast enough and the cat overheats (steam + speech) |
| Idle detection | Cat gets sleepy and shows Zzz when you step away |
| Scroll reaction | Quick tail flick on scroll |
| Mouse shake | Shake the cursor to wobble the cat |
| Mochi drag | Click and drag the cat to reposition it |
| Pomodoro timer | 25/5 focus–break cycle shown on the cat |
| Stretch reminders | Periodic reminders to stand up |
| Daily reminder | One scheduled reminder per day |
| Pinned message | Always-visible speech bubble |
| Pixel coat editor | 16×16 grid editor for custom coat patterns |
| Mood system | Cat mood (happy/content/tired/lonely) affects animations |
| Sound engine | Purr, meow, chime, alert — pure Web Audio, no audio files |
| Claude integration | Cat reacts to every Claude Code tool call |

---

## Settings

Open Settings from the system tray icon. Changes are saved immediately.

| Section | What it controls |
|---|---|
| Identity | Your name and the cat's name |
| Appearance | Color, pattern, size, custom pixel coat |
| Interactions | Sound on/off |
| Stretch | Enable reminders, set interval (minutes) |
| Pomodoro | Enable, set focus/break duration, start/pause/reset |
| Pinned message | Always-visible speech bubble text |
| Daily reminder | Time + message for a once-daily notification |
| Claude AI Integration | Enable HTTP server + copy hooks config |
| System | Always on top, start at login, quit |

---

## Uninstall

### macOS

```bash
# Remove the app
rm -rf /Applications/NekoDrift.app

# Remove all data (settings, cache)
rm -rf ~/Library/Application\ Support/nekodrift
rm -rf ~/Library/Logs/nekodrift
rm -rf ~/Library/Caches/nekodrift

# Remove login item (if you enabled start at login)
# Open System Settings → General → Login Items and remove NekoDrift
```

### Linux (AppImage)

```bash
# Delete the AppImage file (wherever you put it)
rm ~/Applications/NekoDrift-*.AppImage

# Remove all data
rm -rf ~/.config/nekodrift
rm -rf ~/.local/share/nekodrift

# Remove desktop entry if you created one
rm -f ~/.local/share/applications/nekodrift.desktop
```

### Linux (.deb)

```bash
sudo apt-get remove nekodrift
# Or
sudo dpkg -r nekodrift

# Remove all data
rm -rf ~/.config/nekodrift
```

### Windows

1. **Settings → Apps → Installed apps** → find NekoDrift → Uninstall
2. Or run the uninstaller from `C:\Users\<you>\AppData\Local\Programs\NekoDrift\`
3. Remove leftover data:
   - `C:\Users\<you>\AppData\Roaming\nekodrift\`

### Remove Claude Code hooks (all platforms)

Edit `~/.claude/settings.local.json` and remove the `PreToolUse` and `PostToolUse` hook entries, or delete the file entirely if it has nothing else in it.

---

## Development

```bash
npm run build    # compile TypeScript via esbuild
npm start        # build + launch Electron

# Build only main process
node scripts/build-main.js

# Build only renderer
node scripts/build-renderer.js
```

Source layout:

```
src/
  main/          Electron main process (Node.js)
  renderer/      Browser-side code (cat, settings, onboarding)
  shared/        Types and constants shared between both
assets/          Icons and entitlements
scripts/         Build scripts
.github/         CI/CD (GitHub Actions matrix: macOS / Windows / Linux)
```

---

## License

MIT
