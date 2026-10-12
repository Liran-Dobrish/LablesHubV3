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
      plugins: [azureDevOpsApiAmdPlugin],
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

const azureDevOpsApiAmdPlugin = {
  name: 'azure-devops-api-amd',
  setup(build) {
    build.onLoad(
      { filter: /node_modules[\\/]azure-devops-extension-api[\\/].*\.js$/ },
      async ({ path: filePath }) => {
        const source = await fs.promises.readFile(filePath, 'utf8');
        const defineStart = source.indexOf('define(');
        if (defineStart === -1) {
          return null;
        }

        const prefix = source.slice(0, defineStart);
        const amdModule = source.slice(defineStart);
        const match = amdModule.match(
          /^define\((\[[\s\S]*?\]),\s*function\s*\(([^)]*)\)\s*\{([\s\S]*)\}\);\s*$/,
        );
        if (!match) {
          throw new Error(`Unable to process AMD module: ${filePath}`);
        }

        const dependencies = JSON.parse(match[1]);
        const parameters = match[2];
        const argumentsList = dependencies.map((dependency) => {
          if (dependency === 'require') {
            return 'require';
          }
          if (dependency === 'exports') {
            return '__amdExports';
          }
          if (dependency === 'module') {
            return '__amdModule';
          }
          return `require(${JSON.stringify(dependency)})`;
        });

        return {
          contents: `${prefix}
const __amdExports = {};
const __amdModule = { exports: __amdExports };
(function (${parameters}) {${match[3]}
})(${argumentsList.join(', ')});
module.exports = __amdModule.exports;
`,
          loader: 'js',
        };
      },
    );
  },
};

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
