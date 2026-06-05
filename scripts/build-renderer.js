const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../dist/renderer');

// Clean renderer dist
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const entries = [
  { in: 'src/renderer/cat/cat.ts',               out: 'cat/cat' },
  { in: 'src/renderer/settings/settings.ts',     out: 'settings/settings' },
  { in: 'src/renderer/onboarding/onboarding.ts', out: 'onboarding/onboarding' },
];

async function build() {
  for (const entry of entries) {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', entry.in)],
      outfile: path.join(OUT, entry.out + '.js'),
      bundle: true,
      platform: 'browser',
      target: ['chrome112'],   // Electron 29 uses Chrome 122, keep conservative
      format: 'esm',
      sourcemap: true,
      logLevel: 'info',
    });
    console.log(`  ✓ Built ${entry.out}.js`);
  }

  // Copy HTML files
  const htmlSrc = path.join(__dirname, '../src/renderer');
  copyHtml(htmlSrc, OUT);
  console.log('✓ Renderer build complete');
}

function copyHtml(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyHtml(s, d);
    } else if (entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name.endsWith('.png')) {
      fs.copyFileSync(s, d);
    }
  }
}

build().catch((e) => { console.error(e); process.exit(1); });
