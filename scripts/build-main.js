const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../dist/main');

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

async function build() {
  // Main process
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/main/index.ts')],
    outfile: path.join(OUT, 'index.js'),
    bundle: true,
    platform: 'node',
    target: ['node18'],
    format: 'cjs',
    sourcemap: true,
    external: [
      'electron',
      'electron-store',
      'uiohook-napi',
    ],
    logLevel: 'info',
  });
  console.log('  ✓ Built main/index.js');

  // Preload (must be separate, no bundling of electron internals)
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/main/preload.ts')],
    outfile: path.join(OUT, 'preload.js'),
    bundle: true,
    platform: 'node',
    target: ['node18'],
    format: 'cjs',
    sourcemap: true,
    external: ['electron'],
    logLevel: 'info',
  });
  console.log('  ✓ Built main/preload.js');

  console.log('✓ Main build complete');
}

build().catch((e) => { console.error(e); process.exit(1); });
