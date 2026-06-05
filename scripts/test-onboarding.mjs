import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const SHOT_DIR = '/tmp/nekodrift-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron');
const wait = ms => new Promise(r => setTimeout(r, ms));

// Clean settings
fs.rmSync(path.join(process.env.HOME, '.config/nekodrift'), { recursive: true, force: true });

console.log('Launching...');
const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', APP_DIR],
  env: { ...process.env, DISPLAY: ':1' },
  timeout: 25_000,
});

await wait(3000);

const errors = [];
for (const w of app.windows()) {
  w.on('pageerror', e => errors.push(`[${w.url().split('/').pop()}] ${e.message}`));
  w.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
}

const onboarding = app.windows().find(w => w.url().includes('onboarding'));
const catWin = app.windows().find(w => w.url().includes('cat'));

// Screenshot step 1
await onboarding.screenshot({ path: '/tmp/nekodrift-shots/step1-name.png' });
console.log('step1 screenshot OK');

// Type name and go next
await onboarding.fill('#input-name', 'Alex');
await wait(300);
await onboarding.evaluate(() => document.getElementById('btn-next-1').click());
await wait(500);

// Screenshot step 2
await onboarding.screenshot({ path: '/tmp/nekodrift-shots/step2-color.png' });
console.log('step2 screenshot OK');

// Choose gray cat
await onboarding.evaluate(() => document.querySelector('.swatch[data-color="gray"]').click());
await wait(300);

// Go to step 3
await onboarding.evaluate(() => document.getElementById('btn-next-2').click());
await wait(500);

await onboarding.screenshot({ path: '/tmp/nekodrift-shots/step3-done.png' });
console.log('step3 screenshot OK');

// Cat window screenshot
await catWin.screenshot({ path: '/tmp/nekodrift-shots/cat-window.png' });
console.log('cat window screenshot OK');

// Complete onboarding
await onboarding.evaluate(() => document.getElementById('btn-start').click());
await wait(3000);

// Cat window after onboarding
const finalCat = app.windows().find(w => w.url().includes('cat'));
if (finalCat) {
  await finalCat.screenshot({ path: '/tmp/nekodrift-shots/cat-after-onboard.png' });
  console.log('cat after onboarding OK');
}

if (errors.length) console.error('ERRORS:', errors.join('\n'));
else console.log('✓ No errors!');

await app.close();
process.exit(0);
