// esbuild bundling for the single hub entry point (dev + prod modes) — see plan.md / research.md §4.
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const mode = process.argv.includes('--mode=production') ? 'production' : 'development';
const isProd = mode === 'production';

// label-list is the extension's only registered hub; label-details is an internal view
// switched to client-side by App.tsx, not a separate bundle/contribution.
const hubs = [{ name: 'label-list', entry: 'src/hubs/label-list/index.ts' }];

async function build() {
  for (const hub of hubs) {
    const outDir = path.join(rootDir, 'dist', hub.name);
    fs.mkdirSync(outDir, { recursive: true });

    await esbuild.build({
      entryPoints: [path.join(rootDir, hub.entry)],
      bundle: true,
      outfile: path.join(outDir, 'index.js'),
      minify: isProd,
      sourcemap: !isProd,
      target: ['es2020'],
      format: 'iife',
      loader: {
        '.png': 'file',
        '.svg': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.eot': 'file',
      },
      define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    });

    const htmlSrc = path.join(rootDir, 'src', 'hubs', hub.name, `${toPascalCase(hub.name)}Page.html`);
    const htmlDest = path.join(outDir, 'index.html');
    if (fs.existsSync(htmlSrc)) {
      fs.copyFileSync(htmlSrc, htmlDest);
    }

    console.log(`Built ${hub.name} (${mode}) -> ${outDir}`);
  }
}

function toPascalCase(kebab) {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
