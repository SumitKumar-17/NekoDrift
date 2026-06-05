# Installing NekoDrift

## Download a release

Go to the [Releases page](https://github.com/SumitKumar-17/nekodrift/releases) and grab the file for your OS:

| OS | File |
|---|---|
| macOS | `.dmg` |
| Windows | `.exe` (installer) |
| Linux | `.AppImage` or `.deb` |

The **Nightly** pre-release is rebuilt automatically on every push to `main` — always has the latest changes.

---

## Build from source

Requires Node.js 20+.

```bash
git clone https://github.com/SumitKumar-17/nekodrift.git
cd nekodrift
npm install
npm run build
npm start
```

To build a distributable:

```bash
npm run package:mac
npm run package:win
npm run package:linux
```

Output goes to `dist-electron/`.

---

## Linux — required system libraries

Run this before `npm install`:

```bash
sudo apt-get install -y \
  libx11-dev libxtst-dev libpng-dev \
  libxcb-xfixes0-dev libxcb-image0-dev \
  libglib2.0-dev libgtk-3-dev
```
