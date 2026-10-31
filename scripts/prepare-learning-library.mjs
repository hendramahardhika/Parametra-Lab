import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const documents = path.join(root, 'Dokumen');
const target = path.join(root, 'public/library');
const inventory = JSON.parse(await readFile(path.join(documents, 'INVENTARIS-DOKUMEN.json'), 'utf8'));
const previews = JSON.parse(await readFile(path.join(root, 'lib/resource-preview-manifest.json'), 'utf8'));
await mkdir(target, { recursive: true });
const grouped = new Map();
const teacherCategories = new Set(['ATP', 'RPP', 'Asesmen', 'Rubrik', 'Cover', 'Header dan footer']);
const moduleNames = { intro: 'Pengenalan Fusion', sketch: 'Sketch 2D', part: 'Part 3D', assembly: 'Assembly' };
const meetingTitles = { 1: 'Pengenalan Fusion & dasar sketch', 2: 'Dudukan Poros & Pulley', 3: 'Flange Pipa & Bottle', 4: 'Cylinder Block & Piston Head', 5: 'Pin Piston & Connecting Rod', 6: 'Crankshaft & Assembly Piston' };

function describe(record) {
  const relative = record.destination.replaceAll('\\', '/');
  const name = path.posix.basename(relative);
  const base = name.replace(/\.[^.]+$/, '');
  const extension = path.posix.extname(name).slice(1).toLowerCase();
  const cycle = /Siklus 4/.test(relative + record.source) || relative.includes('/Assembly/') || relative.includes('/Animasi/') ? 'Siklus 4' : /Siklus 2/.test(relative + record.source) || relative.includes('/Sketch 2D/') || relative.includes('/Part 3D/') ? 'Siklus 2' : 'Umum';
  const meeting = Number(name.match(/Pertemuan (\d)/)?.[1]) || undefined;
  const stages = cycle === 'Siklus 4' ? ['assembly'] : cycle === 'Siklus 2' ? ['intro', 'sketch', 'part'] : ['intro', 'sketch', 'part', 'assembly'];
  let category = record.category, title = base.replaceAll('_', ' '), description = '', audience = teacherCategories.has(category) ? 'teacher' : 'student';
  let cover;
  if (category === 'Bahan ajar') {
    title = cycle === 'Siklus 2' ? 'Pengenalan Fusion & pemodelan part 3D' : 'Pemodelan part 3D & assembly piston';
    description = 'Bahan ajar lengkap untuk memahami konsep, fitur, dan alur praktik.';
  } else if (category === 'Media pembelajaran') {
    title = meetingTitles[meeting];
    description = `Slide visual pertemuan ${meeting}: konsep, ilustrasi fitur, dan langkah praktik.`;
    cover = `previews/media-${cycle === 'Siklus 4' ? 's4' : 's2'}-p${meeting}.png`;
    stages.splice(0, stages.length, ...(meeting === 1 ? ['intro', 'sketch'] : meeting < 4 ? ['part'] : ['assembly']));
  } else if (category === 'LKM') {
    title = cycle === 'Siklus 2' ? 'LKM · Sketch 2D & part 3D' : 'LKM · Part 3D & assembly piston';
    description = 'Lembar kerja untuk mencatat rencana, hasil pemeriksaan, dan refleksi praktik.';
  } else if (category === 'Jobsheet') {
    title = base.replace(/ Siklus [24]_+/, ' · ').replaceAll('_', ' ');
    description = relative.includes('/Gabungan/') ? 'Paket gambar kerja gabungan. Gunakan ukuran dan keterangan pada dokumen asli.' : 'Gambar kerja dan ukuran asli untuk mendampingi praktik.';
    stages.splice(0, stages.length, relative.includes('/Assembly/') ? 'assembly' : relative.includes('/Sketch 2D/') || /Plat Sambungan|V Block/.test(name) ? 'sketch' : 'part');
    if (extension === 'docx') { audience = 'teacher'; description = 'Sumber Word jobsheet yang dapat disunting guru.'; }
  } else if (category === 'Asesmen') {
    title = `Asesmen pertemuan ${meeting} · ${meetingTitles[meeting]}`;
    description = 'Instrumen asesmen, kisi-kisi, dan pedoman pemeriksaan pembelajaran.';
  } else if (category === 'RPP') {
    title = `RPP · ${cycle}`; description = 'Perencanaan pembelajaran, kegiatan pertemuan, dan pendampingan praktik.';
  } else if (category === 'Rubrik') {
    title = `Rubrik penilaian · ${cycle}`; description = 'Acuan kriteria penilaian hasil dan proses pembelajaran.';
  } else if (category === 'ATP') {
    title = 'ATP · TFLM Perancangan kelas XI'; description = 'Alur tujuan pembelajaran untuk enam pertemuan pada dua siklus.';
  } else if (category === 'Referensi CAD') {
    title = 'Teknik menggambar mesin dengan CAD'; description = 'Modul referensi untuk memperluas pemahaman gambar teknik dan CAD.';
  } else if (category === 'Gambar sketch') {
    title = base; description = 'Gambar referensi latihan sketch 2D.';
    stages.splice(0, stages.length, 'sketch');
  } else if (category === 'Model dan animasi') {
    if (extension === 'stl') {
      category = 'Model 3D'; title = base; description = 'Model STL asli. Buka penampil 3D pada modul atau unduh untuk praktik.';
      stages.splice(0, stages.length, relative.includes('/Assembly/') ? 'assembly' : 'part');
    } else if (extension === 'f3d' || extension === 'ipt') {
      category = 'File CAD'; title = `Sketch 2D · ${base.match(/Project \d+/)?.[0] || 'file sumber'}`;
      description = 'Unduh berkas desain asli untuk dibuka pada aplikasi CAD yang sesuai.';
      stages.splice(0, stages.length, 'sketch');
    } else {
      category = 'Animasi'; title = extension === 'avi' ? 'Piston · explode view' : 'Animasi piston · referensi gerak';
      description = extension === 'avi' ? 'Video AVI untuk diputar melalui aplikasi video di komputer.' : 'Amati hubungan dan gerak komponen rakitan piston.';
    }
  } else if (category === 'Cover' || category === 'Header dan footer') {
    category = 'Aset desain'; title = base.replaceAll('_', ' '); description = 'Aset visual pembelajaran untuk penyusunan materi guru.';
  }
  return { name, base, extension, cycle, stages, category, title, description, audience, meeting, cover, moduleTitle: stages.length === 1 ? moduleNames[stages[0]] : 'Lintas modul' };
}

let files = 0;
for (const record of inventory.files) {
  const relative = record.destination.replaceAll('\\', '/');
  const source = path.resolve(root, ...relative.split('/'));
  if (!source.startsWith(documents + path.sep)) throw Error('Sumber pustaka harus di dalam Dokumen.');
  const meta = describe(record);
  const bytes = await readFile(source);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const asset = `${hash.slice(0, 24)}.${meta.extension}`;
  await copyFile(source, path.join(target, asset));
  const key = `${path.posix.dirname(relative)}|${meta.base}`;
  if (!grouped.has(key)) {
    const { name, base, extension, ...info } = meta;
    grouped.set(key, { id: createHash('sha256').update(key).digest('hex').slice(0, 12), ...info, formats: [] });
  }
  const resource = grouped.get(key);
  if (!resource.formats.some(format => format.asset === asset)) {
    resource.formats.push({ extension: meta.extension, name: meta.name, asset, bytes: bytes.length });
    files++;
  }
}
const resources = [...grouped.values()];
for (const resource of resources) {
  resource.formats.sort((a, b) => (a.extension === 'pdf' ? -1 : b.extension === 'pdf' ? 1 : a.extension.localeCompare(b.extension)));
  const cover = previews[resource.id];
  if (!cover || !/^koleksi\/[a-f0-9]{12}\.jpg$/.test(cover.asset)) throw Error('Pratinjau belum disiapkan: ' + resource.title);
  if (!resource.formats.some(format => format.asset === cover.sourceAsset)) throw Error('Sumber gambar pratinjau tidak sesuai: ' + resource.title);
  resource.cover = `previews/${cover.asset}`;
  if (resource.cover) {
    const preview = path.join(documents, 'Aset Desain/Pratinjau Materi', ...cover.asset.split('/'));
    await stat(preview);
    await mkdir(path.dirname(path.join(target, resource.cover)), { recursive: true });
    await copyFile(preview, path.join(target, resource.cover));
  }
}
await writeFile(path.join(root, 'lib/learning-resources.generated.json'), JSON.stringify(resources, null, 2));
console.log(`${files} berkas pustaka siap dalam ${resources.length} koleksi; PDF dan Word yang berpasangan dikelompokkan.`);
