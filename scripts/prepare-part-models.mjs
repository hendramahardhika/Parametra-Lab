import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'Dokumen/Fusion/Part 3D');
const manifest = JSON.parse(await readFile(path.join(root, 'lib/part-models.json'), 'utf8'));
const seen = new Set();
const models = [];
for (const item of manifest) {
  if (!/^part-[1-6]$/.test(item.jobsheetId) || seen.has(item.jobsheetId)) throw Error('ID part tidak valid atau ganda.');
  seen.add(item.jobsheetId);
  const origin = path.resolve(source, item.source);
  if (!origin.startsWith(source + path.sep) || !origin.toLowerCase().endsWith('.stl')) throw Error('Sumber STL tidak valid.');
  const bytes = await readFile(origin);
  const geometry = new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const positions = geometry.getAttribute('position');
  if (!positions?.count || !positions.array.every(Number.isFinite)) throw Error('Geometri STL tidak valid: ' + item.source);
  geometry.dispose();
  models.push({ ...item, base64: bytes.toString('base64') });
}
// Generated payload allows file:// preview without fetch/CORS or a local server.
await writeFile(path.join(root, 'lib/part-model-data.generated.json'), JSON.stringify(models));
console.log(models.length + ' STL asli disiapkan untuk preview langsung/offline.');
