import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const SHOT_DIR = '/tmp/comnyang-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron');

console.log('Launching Comnyang...');
console.log('electronBin:', electronBin);
console.log('APP_DIR:', APP_DIR);

let app;
try {
  app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', APP_DIR],
    env: { ...process.env, DISPLAY: ':1' },
    timeout: 20_000,
  });
  console.log('✓ App launched!');
} catch (err) {
  console.error('✗ Launch failed:', err.message);
  process.exit(1);
}

// Wait for windows
await new Promise(r => setTimeout(r, 5000));

const windows = app.windows();
console.log(`Windows: ${windows.length}`);
for (const [i, w] of windows.entries()) {
  console.log(`  [${i}] ${w.url()}`);
}

// Check for console errors in each window
for (const [i, w] of windows.entries()) {
  w.on('console', msg => {
    if (msg.type() === 'error') console.error(`[window ${i} error] ${msg.text()}`);
    else console.log(`[window ${i}] ${msg.text()}`);
  });
  w.on('pageerror', err => {
    console.error(`[window ${i} pageerror] ${err.message}`);
  });
}

// Wait a bit more for errors to surface
await new Promise(r => setTimeout(r, 3000));

// Screenshot all windows
for (const [i, w] of windows.entries()) {
  try {
    const f = path.join(SHOT_DIR, `window-${i}.png`);
    await w.screenshot({ path: f });
    console.log(`Screenshot saved: ${f}`);
  } catch (e) {
    console.log(`Screenshot [${i}] failed:`, e.message);
  }
}

console.log('\nAll done. Closing app...');
await app.close();
process.exit(0);
