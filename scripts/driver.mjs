import { _electron as electron } from 'playwright-core';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/nekodrift-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron');

let app = null;
let page = null;

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched');
    console.log('Launching NekoDrift...');
    app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', APP_DIR],
      env: { ...process.env, DISPLAY: process.env.DISPLAY || ':1' },
      timeout: 30_000,
    });
    await new Promise(r => setTimeout(r, 4000));

    const windows = app.windows();
    console.log(`launched. ${windows.length} window(s):`);
    for (const w of windows) console.log(' ', w.url());

    // Pick the onboarding or main cat window
    page = windows.find(w => w.url().includes('onboarding'))
        ?? windows.find(w => w.url().includes('cat'))
        ?? windows[0];
    if (page) console.log('active page:', page.url());
  },

  async windows() {
    if (!app) return console.log('ERROR: launch first');
    for (const w of app.windows()) console.log('window:', w.url());
    const wcs = await app.evaluate(({ webContents }) =>
      webContents.getAllWebContents().map(w => ({ id: w.id, type: w.getType(), url: w.getURL() })));
    console.log('webContents:');
    for (const w of wcs) console.log(` [${w.id}] ${w.type}: ${w.url}`);
  },

  async focus(url_fragment) {
    if (!app) return console.log('ERROR: launch first');
    const w = app.windows().find(w => w.url().includes(url_fragment));
    if (!w) return console.log('not found:', url_fragment);
    page = w;
    console.log('focused:', page.url());
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  async ss_all() {
    if (!app) return console.log('ERROR: launch first');
    for (const [i, w] of app.windows().entries()) {
      const f = path.join(SHOT_DIR, `window-${i}.png`);
      await w.screenshot({ path: f });
      console.log(`screenshot [${i}]:`, f, '—', w.url());
    }
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK';
    }, sel);
    console.log('click', sel, '→', r);
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(t => {
      const els = [...document.querySelectorAll('button, a, input, [role="button"]')];
      const el = els.find(e => e.textContent?.trim() === t) ?? els.find(e => e.textContent?.includes(t));
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK: ' + el.tagName;
    }, text);
    console.log('click-text', JSON.stringify(text), '→', r);
  },

  async type(text) {
    if (!page) return console.log('ERROR: launch first');
    await page.keyboard.type(text, { delay: 40 });
  },

  async press(key) {
    if (!page) return console.log('ERROR: launch first');
    await page.keyboard.press(key);
  },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try {
      await page.waitForSelector(sel, { timeout: 10_000 });
      console.log('found:', sel);
    } catch { console.log('TIMEOUT:', sel); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    const t = await page.evaluate(s => {
      const el = s ? document.querySelector(s) : document.body;
      return el?.innerText ?? '(null)';
    }, sel || null);
    console.log(t);
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async errors() {
    if (!page) return console.log('ERROR: launch first');
    const errs = await page.evaluate(() => window.__errors__ || []);
    console.log('page errors:', JSON.stringify(errs));
  },

  async quit() {
    if (app) await app.close().catch(() => {});
    app = null; page = null;
    console.log('quit');
  },

  help() {
    console.log('commands: launch, windows, focus <url>, ss [name], ss_all, click <sel>,');
    console.log('          click-text <text>, type <text>, press <key>, wait <sel>,');
    console.log('          text [sel], eval <js>, errors, quit');
  },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async line => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '— try: help'); return rl.prompt(); }
  try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});

rl.on('close', async () => { try { await COMMANDS.quit(); } catch {} process.exit(0); });

console.log('NekoDrift driver — "help" for commands, "launch" to start');
rl.prompt();
