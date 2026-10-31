import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './prepare-part-models.mjs';
import './prepare-assembly-models.mjs';
import './prepare-learning-library.mjs';
import './prepare-drive-sync.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'lib/jobsheets.json'), 'utf8'));
const target = path.join(root, 'public/jobsheets');
await mkdir(target, { recursive: true });
const seen = new Set();
for (const sheet of manifest) {
  if (sheet.sourceRoot && sheet.sourceRoot !== 'Fusion') throw Error('Folder sumber tidak dikenal.');
  const source = path.join(root, 'Dokumen', sheet.sourceRoot || 'Jobsheet');
  if (!/^[a-z0-9-]+\.pdf$/.test(sheet.asset) || seen.has(sheet.asset)) throw Error('Nama aset jobsheet tidak valid atau ganda.');
  seen.add(sheet.asset);
  const origin = path.resolve(source, sheet.source);
  if (!origin.startsWith(source + path.sep)) throw Error('Sumber di luar folder jobsheet.');
  const bytes = await readFile(origin);
  if (bytes.subarray(0, 5).toString() !== '%PDF-') throw Error('Bukan PDF: ' + sheet.source);
  await copyFile(origin, path.join(target, sheet.asset));
  if (sheet.previewSource && sheet.previewAsset) {
    if (!/^[a-z0-9-]+\.png$/.test(sheet.previewAsset) || seen.has(sheet.previewAsset)) throw Error('Nama gambar tidak valid atau ganda.');
    seen.add(sheet.previewAsset);
    const preview = path.resolve(source, sheet.previewSource);
    if (!preview.startsWith(source + path.sep)) throw Error('Gambar di luar folder sumber.');
    const image = await readFile(preview);
    if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error('Bukan PNG: ' + sheet.previewSource);
    await copyFile(preview, path.join(target, sheet.previewAsset));
  }
}
console.log(manifest.length + ' PDF dan ' + manifest.filter(s => s.previewAsset).length + ' gambar disalin tanpa perubahan ke public/jobsheets.');

