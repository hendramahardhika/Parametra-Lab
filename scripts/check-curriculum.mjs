import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const qa = path.join(root, '.sites-runtime/curriculum-check');
await mkdir(qa, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(root, 'lib/jobsheets.json'), 'utf8'));
assert.equal(manifest.length, 13);
assert.equal(new Set(manifest.map(s => s.asset)).size, 13);
for (const [stage, count] of [['sketch', 2], ['part', 4], ['assembly', 5]]) {
  assert.deepEqual(manifest.filter(s => s.stage === stage && s.role === 'practice').map(s => s.number), Array.from({ length: count }, (_, i) => i + (stage === 'part' ? 3 : 1)));
}
for (const s of manifest) {
  const original = await readFile(path.join(root, 'Dokumen', s.sourceRoot || 'Jobsheet', s.source));
  const published = await readFile(path.join(root, 'public/jobsheets', s.asset));
  assert.ok(original.equals(published), s.asset + ' must match the original exactly');
}
const curriculumBuild = await build({ absWorkingDir: root, entryPoints: ['lib/curriculum.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const c = await import('data:text/javascript;base64,' + Buffer.from(curriculumBuild.outputFiles[0].text).toString('base64'));
assert.deepEqual(c.lessons.map(m => m.stage), ['intro', 'sketch', 'part', 'assembly']);
assert.deepEqual(c.lessons.map(m => m.id), [8, 9, 10, 11]);
assert.deepEqual(c.lessons.map(m => m.steps.length), [4, 2, 4, 7]);
for (const m of c.lessons) {
  assert.equal(c.progressFor([], m.id), 0);
  const events = m.steps.map((_, i) => ({ kind: 'checkpoint', module: m.id, payload: JSON.stringify({ step: c.stepKey(m, i), checked: true }) }));
  assert.equal(c.progressFor(events, m.id), 100);
  assert.equal(c.progressFor(events.map(e => ({ ...e, module: 0 })), m.id), 0, 'Old progress must not complete new lessons');
  const reset = [...events, { kind: 'checkpoint', module: m.id, payload: JSON.stringify({ step: c.stepKey(m, 0), checked: false }) }];
  assert.ok(c.progressFor(reset, m.id) < 100);
  for (const s of m.steps) assert.equal(s.hints.length, 3);
  for (const q of m.quiz) { assert.equal(q.options.length, 3); assert.ok(q.answer >= 0 && q.answer < 3); }
}
const historical = [0, 1, 2, 3, 4, 5].map(step => ({ kind: 'checkpoint', module: 10, payload: JSON.stringify({ step, checked: true }) }));
assert.equal(c.progressFor(historical.slice(0, 2), 10), 0, 'Retired sketch steps do not become 3D progress');
assert.equal(c.progressFor(historical.slice(2, 3), 10), 25, 'Old Dudukan Poros step remains the first 3D task');
assert.equal(c.progressFor(historical, 10), 100);
assert.equal(c.nextLesson(8).id, 9);
assert.equal(c.nextLesson(10).id, 11);
assert.equal(c.nextLesson(11), undefined);
assert.match(c.lessonTitle(0), /Arsip/);
for (const local of [false, true]) {
  const output = path.join(qa, local ? 'jobsheets-local.mjs' : 'jobsheets-server.mjs');
  await build({ absWorkingDir: root, entryPoints: ['app/components/jobsheets.tsx'], outfile: output, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom', 'lucide-react'], define: { 'process.env.NEXT_PUBLIC_LOCAL_EDITION': JSON.stringify(String(local)) } });
  const { JobsheetPanel, JobsheetLibrary } = await import(pathToFileURL(output).href);
  for (const [stage, count] of [['sketch', 2], ['part', 4], ['assembly', 7]]) {
    const html = renderToStaticMarkup(createElement(JobsheetPanel, { stage }));
    assert.equal((html.match(/<li>/g) || []).length, count);
    assert.ok(html.includes((local ? 'public/jobsheets/' : '/jobsheets/') + stage + (stage === 'part' ? '-3.pdf' : '-1.pdf')));
    assert.ok(html.includes('Unduh PDF') && html.includes('Buka PDF') && html.includes('Pratinjau PDF'));
    if (stage === 'part') { assert.ok(!html.includes('Plat Sambungan') && !html.includes('V Block')); }
  }
  assert.ok(renderToStaticMarkup(createElement(JobsheetLibrary)).includes('Sketch 2D'));
}
console.log('PASS: 13 original PDFs, ordered stages, legacy progress isolation, quizzes, navigation, local/server PDF links and rendered document lists.');
