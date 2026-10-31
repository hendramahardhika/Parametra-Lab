import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

const root = fileURLToPath(new URL('../', import.meta.url));
const sheets = JSON.parse(await readFile(path.join(root, 'lib/jobsheets.json'), 'utf8')).filter(s => s.stage === 'sketch');
assert.deepEqual(sheets.map(s => s.number), [1, 2]);
for (const sheet of sheets) {
  for (const [source, asset] of [[sheet.source, sheet.asset], [sheet.previewSource, sheet.previewAsset]]) {
    const original = await readFile(path.join(root, 'Dokumen', sheet.sourceRoot, source));
    const published = await readFile(path.join(root, 'public/jobsheets', asset));
    assert.ok(original.equals(published), `Aset harus sama dengan sumber: ${asset}`);
  }
}
for (const local of [true, false]) {
  const result = await build({
    absWorkingDir: root, entryPoints: ['app/components/sketch-preview.tsx'], bundle: true,
    write: false, platform: 'node', format: 'cjs', jsx: 'automatic', packages: 'external',
    define: { 'process.env.NEXT_PUBLIC_LOCAL_EDITION': JSON.stringify(String(local)) },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  const html = renderToStaticMarkup(createElement(module.exports.SketchPreview));
  assert.ok(html.includes('Preview Sketch 2D'));
  assert.ok(html.includes('Plat Sambungan') && html.includes('V Block'));
  const prefix = local ? 'public/jobsheets/' : '/jobsheets/';
  assert.ok(html.includes(`src="${prefix}sketch-1.png"`));
  assert.ok(html.includes(`href="${prefix}sketch-1.pdf"`));
  assert.ok(html.includes('aria-pressed="true"') && html.includes('aria-pressed="false"'));
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('Preview Sketch 2D') && html.includes('sketch-2.png'));
console.log('Lulus: urutan 2 jobsheet, 4 aset identik sumber, render preview lokal/server, dan bundle index.html.');
