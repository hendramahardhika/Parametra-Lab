// Jalankan di Google Apps Script milik guru, bukan di browser atau GitHub Pages.
const TARGET_FOLDER_ID_ = '1tMtfa3NUhHX7gWS1G4-goMv0o8-Z7Mt5';
const MODULES_ = {
  '8': '01 Pengenalan Fusion',
  '9': '02 Sketch 2D',
  '10': '03 Membuat Part 3D',
  '11': '04 Assembly'
};
const MAX_BYTES_ = 20 * 1024 * 1024;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pengumpulan Tugas — Parametra Lab')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function field_(value, min, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < min || text.length > max) throw new Error('Lengkapi isian sesuai batas panjangnya.');
  return text;
}

function submitWork(form) {
  const props = PropertiesService.getScriptProperties();
  const code = props.getProperty('CLASS_CODE');
  if (props.getProperty('UPLOADS_ENABLED') !== 'true' || !code || code.length < 12)
    throw new Error('Pengumpulan belum dibuka oleh guru.');
  if (!form || form.classCode !== code) throw new Error('Kode pengumpulan tidak sesuai. Tanyakan kepada guru.');
  const name = field_(form.studentName, 2, 80);
  const className = field_(form.className, 2, 80);
  const assignment = field_(form.assignment, 2, 100);
  const reflection = field_(form.reflection, 10, 2000);
  const module = String(form.module);
  if (!Object.prototype.hasOwnProperty.call(MODULES_, module)) throw new Error('Pilih modul yang tersedia.');
  const receipt = String(form.receipt || '');
  if (!/^[a-f0-9]{32}$/.test(receipt)) throw new Error('Nomor pengiriman tidak valid. Muat ulang formulir.');
  const blob = form.file;
  if (!blob || typeof blob.getBytes !== 'function') throw new Error('Pilih berkas tugas.');
  const original = String(blob.getName() || '');
  if (!/\.(f3d|f3z|stl|obj|step|stp|ipt|iam|idw|sldprt|sldasm|slddrw|dwg|dxf|pdf|png|jpe?g)$/i.test(original))
    throw new Error('Format berkas belum diizinkan.');
  const size = blob.getBytes().length;
  if (!size || size > MAX_BYTES_) throw new Error('Berkas harus berisi data dan maksimal 20 MB.');
  const cleanName = original.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  const filename = receipt + '_' + cleanName;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Pengumpulan sedang ramai. Coba kirim kembali sebentar lagi.');
  try {
    const root = DriveApp.getFolderById(TARGET_FOLDER_ID_);
    const folders = root.getFoldersByName(MODULES_[module]);
    const folder = folders.hasNext() ? folders.next() : root.createFolder(MODULES_[module]);
    // Retries in the same open form reuse this receipt instead of creating duplicates.
    const previous = folder.getFilesByName(filename);
    if (previous.hasNext()) return { ok: true, receipt: receipt, filename: original };
    const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    const counter = JSON.parse(props.getProperty('DAILY_COUNT') || '{}');
    const count = counter.date === today ? Number(counter.count) || 0 : 0;
    const limit = Number(props.getProperty('MAX_DAILY_UPLOADS') || '100');
    if (!Number.isFinite(limit) || limit < 1 || count >= limit)
      throw new Error('Batas pengumpulan harian tercapai. Hubungi guru.');
    // Reserve a slot before creating a file; failed requests may consume a slot.
    props.setProperty('DAILY_COUNT', JSON.stringify({ date: today, count: count + 1 }));
    const file = folder.createFile(blob.setName(filename));
    try {
      file.setDescription(JSON.stringify({ receipt: receipt, name: name, className: className,
        module: MODULES_[module], assignment: assignment, reflection: reflection,
        originalFilename: original, submittedAt: new Date().toISOString() }, null, 2));
    } catch (e) {
      file.setTrashed(true);
      throw new Error('Pencatatan identitas gagal. Coba kirim kembali.');
    }
    // Do not return folder contents, file IDs, or private sharing links to students.
    return { ok: true, receipt: receipt, filename: original };
  } finally { lock.releaseLock(); }
}
