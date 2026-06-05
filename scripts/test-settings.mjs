import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const SHOT_DIR = '/tmp/nekodrift-shots';
const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron');
const wait = ms => new Promise(r => setTimeout(r, ms));

// Settings exist from previous test — skip onboarding
console.log('Launching (post-onboarding)...');
const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', APP_DIR],
  env: { ...process.env, DISPLAY: ':1' },
  timeout: 25_000,
});

await wait(3000);
const errors = [];
for (const w of app.windows()) {
  w.on('pageerror', e => errors.push(e.message));
}

const catWin = app.windows().find(w => w.url().includes('cat'));
console.log('windows:', app.windows().map(w => w.url().split('/').pop()));

// Trigger open settings via IPC
await catWin.evaluate(() => window.nekodrift.openSettings());
await wait(2000);

const settingsWin = app.windows().find(w => w.url().includes('settings'));
if (settingsWin) {
  await settingsWin.screenshot({ path: path.join(SHOT_DIR, 'settings-window.png') });
  console.log('settings screenshot OK');
} else {
  console.log('settings window not found. windows:', app.windows().map(w => w.url()));
}

// Screenshot cat at this point
await catWin.screenshot({ path: path.join(SHOT_DIR, 'cat-final.png') });
console.log('cat final screenshot OK');

if (errors.length) console.error('ERRORS:', errors);
else console.log('✓ No errors!');

await app.close();
process.exit(0);
