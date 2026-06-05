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

const ss = async (page, name) => {
  const f = path.join(SHOT_DIR, name + '.png');
  await page.screenshot({ path: f });
  console.log('📸 screenshot:', f);
  return f;
};

console.log('Launching NekoDrift...');
const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', APP_DIR],
  env: { ...process.env, DISPLAY: ':1' },
  timeout: 25_000,
});
console.log('✓ Launched!');

await wait(3000);

// Collect console errors
for (const w of app.windows()) {
  w.on('pageerror', e => console.error('[PAGE ERROR]', w.url().split('/').pop(), ':', e.message));
  w.on('console', m => { if (m.type() === 'error') console.error('[CONSOLE ERROR]', m.text()); });
}

const onboarding = app.windows().find(w => w.url().includes('onboarding'));
const catWin     = app.windows().find(w => w.url().includes('cat'));

console.log('\n── Step 1: Name input ──');
await ss(onboarding, '01-onboarding-name');
await onboarding.click('#input-name');
await onboarding.fill('#input-name', 'Alex');
await wait(500);
await ss(onboarding, '02-name-filled');

console.log('\n── Step 2: Click Next ──');
await onboarding.evaluate(() => document.getElementById('btn-next-1').click());
await wait(600);
await ss(onboarding, '03-color-picker');

console.log('\n── Step 3: Pick pink coat ──');
await onboarding.evaluate(() => {
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  const pink = document.querySelector('.swatch[data-color="pink"]');
  pink?.classList.add('active');
  pink?.click();
});
await wait(500);
await ss(onboarding, '04-pink-selected');

console.log('\n── Step 4: Next → done screen ──');
await onboarding.evaluate(() => document.getElementById('btn-next-2').click());
await wait(600);
await ss(onboarding, '05-done-screen');

console.log('\n── Step 5: Cat window ──');
await ss(catWin, '06-cat-window');

console.log('\n── Step 6: Complete onboarding ──');
await onboarding.evaluate(() => document.getElementById('btn-start').click());
await wait(2000);

// Settings window should now be gone; check remaining windows
const remaining = app.windows();
console.log('Windows after onboarding:', remaining.map(w => w.url().split('/').pop()));

// Screenshot cat window again (it should show welcome speech now)
const updatedCat = app.windows().find(w => w.url().includes('cat'));
if (updatedCat) {
  await wait(2500); // wait for speech bubble
  await ss(updatedCat, '07-cat-with-speech');
}

console.log('\nAll screenshots saved to', SHOT_DIR);
await wait(1000);
await app.close();
process.exit(0);
