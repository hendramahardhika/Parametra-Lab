import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
async function compile(entry) {
  const result = await build({absWorkingDir:root,entryPoints:[entry],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic'});
  const module = {exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
  return module.exports;
}
const {SectionAnalysisMenu} = await compile('app/components/section-analysis-menu.tsx');
for (const section of ['none','XY','XZ','YZ']) {
  const html = renderToStaticMarkup(createElement(SectionAnalysisMenu,{section,flipped:false,onSectionChange:()=>{},onFlip:()=>{}}));
  assert.ok(html.includes('aria-expanded="false"') && html.includes('Section Analysis'));
  assert.ok(html.includes('class="section-analysis-inline" hidden=""'));
  assert.ok(!/<p(?:\s|>)/.test(html) && !html.includes('<strong') && !html.includes('section-analysis-popover'));
  for (const label of ['Utuh','XY','XZ','YZ','Balik sisi']) assert.ok(html.includes('>'+label+'</button>'));
  assert.ok(html.includes(`data-active="${section !== 'none'}"`));
  assert.equal((html.match(/disabled=""/g)||[]).length,section === 'none' ? 1 : 0);
}
const {default:Viewer} = await compile('app/components/cad-viewer.tsx');
const html = renderToStaticMarkup(createElement(Viewer,{file:new File(['test'],'test.stl')}));
const toolbar = html.indexOf('class="viewer-tools"'), menu = html.indexOf('class="section-analysis-menu"'), fullscreen = html.indexOf('aria-label="Layar penuh"');
assert.ok(toolbar < menu && menu < fullscreen);
assert.ok(!html.includes('section-analysis-controls'));
console.log('Lulus: ikon Section Analysis berada pada toolbar sebelum Layar penuh; 4 opsi bidang, indikator aktif, dan Balik sisi. Pemeriksaan markup, bukan browser.');
