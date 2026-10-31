import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'Dokumen/Fusion/Assembly');
const manifest = JSON.parse(await readFile(path.join(root, 'lib/assembly-models.json'), 'utf8'));
const seen = new Set();
const models = [];
for (const item of manifest) {
  if (!/^assembly-(?:full|[1-5])$/.test(item.jobsheetId) || seen.has(item.jobsheetId)) throw Error('ID model assembly tidak valid atau ganda.');
  seen.add(item.jobsheetId);
  const origin = path.resolve(source, item.source);
  if (!origin.startsWith(source + path.sep) || !origin.toLowerCase().endsWith('.stl')) throw Error('Sumber STL assembly tidak valid.');
  const bytes = await readFile(origin);
  const geometry = new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const positions = geometry.getAttribute('position');
  if (!positions?.count || !positions.array.every(Number.isFinite)) throw Error('Geometri STL assembly tidak valid: ' + item.source);
  geometry.dispose();
  models.push({ ...item, base64: bytes.toString('base64') });
}
await writeFile(path.join(root, 'lib/assembly-model-data.generated.json'), JSON.stringify(models));
console.log(models.length + ' STL assembly asli disiapkan untuk preview langsung/offline.');
