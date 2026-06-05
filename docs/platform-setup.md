# Platform Setup

## macOS

On first launch, NekoDrift needs **Accessibility permission** to detect typing.

A dialog will appear — click **Open Settings** and enable NekoDrift under:

`System Settings → Privacy & Security → Accessibility`

Then restart the app. Without it, the cat won't react to typing (everything else still works).

If macOS blocks the app with "unidentified developer" — right-click the `.app` → **Open**.

---

## Linux

NekoDrift runs under XWayland automatically on Wayland desktops.

Global keyboard/mouse tracking works on X11 sessions. On a **pure Wayland session** (no XWayland), typing detection may not work — the cat still follows the cursor and all other features are fine.

Two startup messages in the terminal are **safe to ignore**:

```
load_input_helper: XkbGetKeyboard failed to locate a valid keyboard!
hook_thread_proc: Could not set thread priority 49
```

These come from the `uiohook-napi` C library and don't affect functionality.

---

## Windows

The NSIS installer handles everything automatically.

If Windows SmartScreen warns about an unknown publisher — click **More info → Run anyway**.
