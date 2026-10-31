// Source/CSS and component-state checks. This is not a browser layout or device test.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';
import postcss from 'postcss';

const root = process.cwd(), require = createRequire(import.meta.url);
const css = postcss.parse(await readFile('app/globals.css', 'utf8'));
function declarations(selector, width) {
  const values = {};
  css.walkRules(rule => {
    if (!rule.selector.split(',').map(s => s.trim()).includes(selector)) return;
    for (let ancestor = rule.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.type !== 'atrule') continue;
      if (ancestor.name === 'container') return;
      if (ancestor.name !== 'media') continue;
      const query = ancestor.params;
      if (/print|prefers-reduced-motion|orientation:landscape/.test(query)) return;
      for (const match of query.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
        if (match[1] === 'min' ? width < +match[2] : width > +match[2]) return;
      }
    }
    rule.walkDecls(d => { values[d.prop] = d.value; });
  });
  return values;
}
for (const width of [320, 360, 390, 430, 600, 767]) {
  assert.equal(declarations('.mobile-navigation', width).display, 'grid');
  assert.equal(declarations('.course-grid', width)['grid-template-columns'], 'minmax(0,1fr)');
  assert.equal(declarations('.resource-grid', width)['grid-template-columns'], 'minmax(0,1fr)');
  assert.equal(declarations('.module-section-tabs', width)['grid-template-columns'], 'repeat(2,minmax(0,1fr))');
  assert.equal(declarations('.cad-body', width).display, 'flex');
  assert.equal(declarations('.cad-properties', width).display, 'none');
  assert.equal(declarations('.cad-properties.is-mobile-open', width).display, 'block');
  assert.equal(declarations('.cad-canvas-controls button', width)['min-height'], '44px');
  assert.equal(declarations('.cad-viewer-shell .viewer-tools', width).position, 'relative');
  assert.equal(declarations('.field input', width)['font-size'], '16px');
  assert.ok(declarations('.workspace', width).padding.includes('safe-area-inset-bottom'));
}
for (const width of [768, 1024, 1440]) {
  assert.equal(declarations('.mobile-navigation', width).display, 'none');
  assert.equal(declarations('.cad-mobile-properties-toggle', width).display, 'none');
  assert.notEqual(declarations('.cad-properties', width).display, 'none');
}

async function compile(options) {
  const output = await build({absWorkingDir:root,bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',...options});
  return output.outputFiles[0].text;
}
const sidebar = { openMobile:false, setOpenMobile(value) { this.openMobile = value; } };
// The component uses only useSidebar, so isolate the sidebar controller from Radix/browser APIs.
const navSource = (await readFile('app/components/mobile-navigation.tsx','utf8'))
  .replace("import { useSidebar } from '@/components/ui/sidebar';", '');
const navCode = await compile({stdin:{contents:navSource,loader:'tsx',resolveDir:path.join(root,'app/components')}});
const navModule = {exports:{}};
new Function('require','module','exports','useSidebar',navCode)(require,navModule,navModule.exports,() => ({openMobile:sidebar.openMobile,setOpenMobile:value => sidebar.setOpenMobile(value)}));
function nodesOf(tree) {
  const nodes=[];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object' || !node.props) return;
    nodes.push(node); walk(node.props.children);
  }
  walk(tree); return nodes;
}
for (const [route, expected] of [['','#'],['modul/10/jobsheet','#modul'],['lab','#lab'],['progres','#progres'],['guru',undefined],['pustaka',undefined]]) {
  const nodes=nodesOf(navModule.exports.MobileNavigation({route}));
  assert.equal(nodes.find(n => n.props['aria-current'] === 'page')?.props.href,expected);
  assert.equal(nodes.filter(n => n.type === 'a').length,4);
  const menu=nodes.find(n => n.type === 'button');
  menu.props.onClick();
  assert.equal(sidebar.openMobile,true);
  assert.equal(nodesOf(navModule.exports.MobileNavigation({route})).find(n => n.type === 'button').props['aria-expanded'],true);
  nodes.find(n => n.type === 'a').props.onClick();
  assert.equal(sidebar.openMobile,false);
}

// Exercise the fold-away property panel without running persistence, WebGL or DOM effects.
const workbenchSource=(await readFile('app/components/cad-workbench.tsx','utf8')).replace(/^import \{.*\} from 'react';\r?\n/m,'');
const code=await compile({stdin:{contents:workbenchSource,loader:'tsx',resolveDir:path.join(root,'app/components')}});
let cursor=0, changed=false;
const states=[], effects=[];
function useState(initial) {
  const slot=cursor++;
  if (!(slot in states)) states[slot]=typeof initial === 'function' ? initial() : initial;
  return [states[slot],value => {
    const next=typeof value === 'function' ? value(states[slot]) : value;
    if (next !== states[slot]) changed=true;
    states[slot]=next;
  }];
}
const module={exports:{}};
new Function('require','module','exports','useState','useEffect','useMemo','useRef','useId',code)(
  require,module,module.exports,useState,
  (fn,deps) => { if (deps?.length===1 && ['revolve','extrude','sweep','loft','presspull','fillet','chamfer','shell'].includes(deps[0])) effects.push(fn); },
  fn => fn(), value => ({current:value}), () => 'test-properties',
);
function render() {
  let nodes;
  do { changed=false;cursor=0;effects.length=0;nodes=nodesOf(module.exports.default({}));effects.forEach(fn=>fn()); } while(changed);
  return nodes;
}
const toggle=nodes=>nodes.find(n=>n.props.className==='cad-mobile-properties-toggle');
let nodes=render();
const initialProject=JSON.stringify(states[0]);
assert.equal(toggle(nodes).props['aria-expanded'],false);
assert.equal(toggle(nodes).props['aria-controls'],'test-properties');
toggle(nodes).props.onClick();nodes=render();
assert.equal(toggle(nodes).props['aria-expanded'],true);
assert.ok(nodes.some(n=>n.props.id==='test-properties' && n.props.className.includes('is-mobile-open')));
toggle(nodes).props.onClick();nodes=render();
assert.equal(toggle(nodes).props['aria-expanded'],false);
const modelTab=nodes.find(n=>n.props.role==='tab' && [].concat(n.props.children).some(child=>typeof child==='string' && child.includes('Model 3D')));
modelTab.props.onClick();nodes=render();
nodes.find(n=>n.props.onCommand).props.onCommand('revolve');nodes=render();
assert.equal(toggle(nodes).props['aria-expanded'],true,'Create/Modify opens the property panel');
assert.equal(JSON.stringify(states[0]),initialProject,'View controls must not change the draft/history');

const html=await readFile('index.html','utf8');
assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
assert.ok(!/maximum-scale|user-scalable=no/.test(html));
assert.ok(html.includes('Navigasi utama ponsel') && html.includes('Ukuran & properti'));
console.log('Lulus: aturan CSS 320–767 / 768–1440 px, navigasi aktif & menu, buka/tutup properti, perintah membuka properti tanpa mengubah draf, viewport offline. Bukan uji render browser/HP fisik.');
