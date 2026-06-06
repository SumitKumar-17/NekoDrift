// Renders the sprite preview grid to a PNG using offscreen Electron.
const { app, BrowserWindow } = require('electron');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const DIR = __dirname;

async function bundle() {
  await esbuild.build({
    entryPoints: [path.join(DIR, 'preview-entry.ts')],
    outfile: path.join(DIR, 'preview-entry.js'),
    bundle: true, platform: 'browser', format: 'esm',
    target: ['chrome112'], logLevel: 'error',
  });
}

async function run() {
  await bundle();
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1100, height: 800, show: false,
    webPreferences: { offscreen: true },
  });
  await win.loadFile(path.join(DIR, 'preview.html'));
  // wait for render flag
  for (let i = 0; i < 60; i++) {
    const ready = await win.webContents.executeJavaScript('window.__READY__ === true').catch(() => false);
    if (ready) break;
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 300));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(DIR, 'preview.png'), img.toPNG());
  console.log('wrote', path.join(DIR, 'preview.png'));
  app.quit();
}

run().catch(e => { console.error(e); app.quit(); process.exit(1); });
