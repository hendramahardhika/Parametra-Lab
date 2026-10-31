// Component-state test only; does not simulate browser PDF rendering or WebGL.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = (await readFile(path.join(root, 'app/components/part-preview.tsx'), 'utf8'))
  .replace("import { useEffect, useState, type ReactNode } from 'react';", '');
for (const local of [true, false]) {
  const result = await build({
    absWorkingDir: root, stdin: { contents: source, loader: 'tsx', resolveDir: path.join(root, 'app/components') },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', packages: 'external',
    define: { 'process.env.NEXT_PUBLIC_LOCAL_EDITION': JSON.stringify(String(local)) },
    plugins: [{ name: 'skip-webgl', setup(b) {
      b.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default () => function ViewerStub(){return null}' }));
    } }],
  });
  let cursor = 0;
  const state = [];
  function useState(initial) {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
  }
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'useState', 'useEffect', result.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, useState, () => {});
  function render() {
    cursor = 0;
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object' || !node.props) return;
      nodes.push(node); visit(node.props.children);
    }
    visit(mod.exports.PartPreview());
    return nodes;
  }
  const toggle = nodes => nodes.find(n => n.type === 'button' && n.props['aria-controls'] === 'part-jobsheet-preview');
  let nodes = render();
  assert.ok(!nodes.some(n => n.type === 'iframe'));
  assert.equal(toggle(nodes).props['aria-expanded'], false);
  toggle(nodes).props.onClick();
  nodes = render();
  assert.equal(toggle(nodes).props['aria-expanded'], true);
  const prefix = local ? 'public/jobsheets/' : '/jobsheets/';
  assert.equal(nodes.find(n => n.type === 'iframe').props.src, prefix + 'part-3.pdf#view=FitH');
  assert.ok(nodes.some(n => n.props.jobsheetId === 'part-3'), '3D viewer stays mounted alongside PDF');
  nodes.filter(n => n.type === 'button' && 'aria-pressed' in n.props)[1].props.onClick();
  nodes = render();
  assert.equal(nodes.find(n => n.type === 'iframe').props.src, prefix + 'part-4.pdf#view=FitH');
  assert.ok(nodes.some(n => n.props.jobsheetId === 'part-4'));
  const positionGroup = nodes.find(n => n.props['aria-label'] === 'Posisi pratinjau PDF');
  positionGroup.props.children[2].props.onClick();
  nodes = render();
  assert.ok(nodes.some(n => n.props.className === 'part-preview-layout is-side-by-side'));
  assert.equal(nodes.find(n => n.type === 'iframe').props.src, prefix + 'part-4.pdf#view=FitH');
  assert.ok(nodes.some(n => n.props.jobsheetId === 'part-4'));
  nodes.find(n => n.props['aria-label'] === 'Posisi pratinjau PDF').props.children[1].props.onClick();
  nodes = render();
  assert.ok(nodes.some(n => n.props.className === 'part-preview-layout'));
  assert.ok(nodes.some(n => n.type === 'iframe'));
  toggle(nodes).props.onClick();
  assert.ok(!render().some(n => n.type === 'iframe'));
  nodes = render();
  nodes.find(n => n.props['aria-label'] === 'Posisi pratinjau PDF').props.children[2].props.onClick();
  assert.ok(render().some(n => n.type === 'iframe'), 'Selecting right opens a closed PDF');
}
console.log('Lulus: buka/tutup PDF, posisi bawah/kanan, model tetap ada, PDF mengikuti pilihan part, URL lokal/server benar.');
