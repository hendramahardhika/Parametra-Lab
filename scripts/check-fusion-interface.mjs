// Component-state checks, separate from visual browser QA.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = (await readFile(path.join(root, 'app/components/fusion-interface.tsx'), 'utf8'))
  .replace("import { useState } from 'react';", '');
const publishedImage = await readFile(path.join(root, 'public/learning/fusion-interface.jpg'));
assert.equal(publishedImage.subarray(0, 3).toString('hex'), 'ffd8ff', 'Interface image must be a JPEG');
if (process.argv[2]) assert.ok((await readFile(process.argv[2])).equals(publishedImage), 'Teacher image must remain unchanged');

for (const local of [true, false]) {
  const result = await build({ absWorkingDir: root,
    stdin: { contents: source, loader: 'tsx', resolveDir: path.join(root, 'app/components') },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', packages: 'external',
    define: { 'process.env.NEXT_PUBLIC_LOCAL_EDITION': JSON.stringify(String(local)) },
  });
  let selected = 1;
  const mod = { exports: {} };
  const useState = () => [selected, value => { selected = typeof value === 'function' ? value(selected) : value; }];
  new Function('require', 'module', 'exports', 'useState', result.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, useState);
  function render() {
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object' || !node.props) return;
      nodes.push(node); visit(node.props.children);
    }
    visit(mod.exports.FusionInterface());
    return nodes;
  }
  let nodes = render();
  assert.equal(nodes.find(n => n.type === 'img').props.src, (local ? 'public/' : '/') + 'learning/fusion-interface.jpg');
  assert.equal(nodes.filter(n => n.type === 'button' && 'aria-pressed' in n.props).length, 9);
  const pager = () => render().find(n => n.props.className === 'fusion-interface-paging').props.children;
  assert.equal(pager()[0].props.disabled, true);
  const names = ['Application Bar', 'Data Panel', 'Profile and Help', 'Toolbar', 'Browser', 'ViewCube', 'Canvas and Marking Menu', 'Navigation Bar and Display Settings', 'Timeline'];
  for (let index = 0; index < names.length; index++) {
    nodes.filter(n => n.type === 'button' && 'aria-pressed' in n.props)[index].props.onClick();
    nodes = render();
    assert.equal(nodes.find(n => n.type === 'h3').props.children, 'Bagian antarmuka');
    const detail = nodes.find(n => n.props.className === 'fusion-interface-detail-heading');
    assert.equal(detail.props.children[1].props.children[0].props.children, names[index]);
    assert.equal(nodes.filter(n => n.type === 'button' && n.props['aria-pressed'] === true).length, 1);
    assert.equal(nodes.filter(n => n.type === 'li').length, 3);
  }
  assert.equal(pager()[2].props.disabled, true);
  pager()[0].props.onClick();
  assert.equal(selected, 8);
  pager()[2].props.onClick();
  assert.equal(selected, 9);
}
const learning = await readFile(path.join(root, 'app/components/learning.tsx'), 'utf8');
const cards = await readFile(path.join(root, 'app/parametra.tsx'), 'utf8');
assert.ok(learning.includes("m.stage === 'intro' ? <FusionInterface />"));
assert.ok(learning.includes("m.stage === 'part' ? <PartPreview />"));
for (const source of [learning, cards]) assert.ok(source.includes("m.stage === 'intro' ? 'Interface Autodesk Fusion'"));
console.log('Lulus: sembilan bagian, pergantian materi, tombol sebelumnya/berikutnya, URL gambar lokal/server, gambar asli, dan label khusus modul intro.');
