# Uninstalling NekoDrift

## macOS

```bash
rm -rf /Applications/NekoDrift.app
rm -rf ~/Library/Application\ Support/nekodrift
rm -rf ~/Library/Caches/nekodrift
rm -rf ~/Library/Logs/nekodrift
```

If you enabled **Start at login** — go to `System Settings → General → Login Items` and remove NekoDrift.

---

## Linux — AppImage

```bash
rm ~/Applications/NekoDrift-*.AppImage   # wherever you saved it
rm -rf ~/.config/nekodrift
```

---

## Linux — .deb

```bash
sudo apt-get remove nekodrift
rm -rf ~/.config/nekodrift
```

---

## Windows

`Settings → Apps → Installed apps` → find **NekoDrift** → Uninstall.

Then remove leftover data:

```
C:\Users\<you>\AppData\Roaming\nekodrift\
```

---

## Remove Claude Code hooks

Edit `~/.claude/settings.local.json` and delete the `PreToolUse` and `PostToolUse` entries, or delete the whole file if nothing else is in it.
