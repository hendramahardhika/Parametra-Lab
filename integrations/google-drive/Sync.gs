// Tambahkan sebagai file Sync.gs di proyek Apps Script yang sama dengan Code.gs dan Index.html.
// Tidak menyimpan PIN siswa atau membuka akses publik ke isi Drive / spreadsheet.
const SYNC_SHEET_ID_ = '1J9P5x0v1GtWMy4XK9-qNEGnGxECvCyuUD0lP5bDOhls';
const SYNC_HEADERS_ = {
  PL_Rekap: ['ID Siswa', 'Nama', 'Kelas', 'Presensi', 'Pengenalan Fusion (%)', 'Sketch 2D (%)', 'Part 3D (%)', 'Assembly (%)', 'Kuis Fusion', 'Kuis Sketch', 'Kuis Part 3D', 'Kuis Assembly', 'Diperbarui (server)', 'Pembaruan ID', 'Snapshot Drive'],
  PL_Modul: ['Kunci', 'ID Siswa', 'Nama', 'Kelas', 'Presensi', 'Modul', 'Progres (%)', 'Checklist selesai', 'Total langkah', 'Kuis terakhir', 'Percobaan kuis', 'Karya lokal tercatat', 'Detail langkah JSON', 'Diperbarui (server)'],
  PL_Karya: ['Kunci', 'ID Siswa', 'Nama', 'Kelas', 'Presensi', 'Modul', 'Nama berkas', 'Diterima (server)', 'Bukti penerimaan', 'Berkas Drive', 'Refleksi', 'Tautan karya']
};

function setupAutoSync() {
  const props = PropertiesService.getScriptProperties();
  const code = props.getProperty('CLASS_CODE');
  if (!code || code.length < 12) throw new Error('Isi Script property CLASS_CODE minimal 12 karakter sebelum aktivasi.');
  // Both destinations must be writable before enabling automatic submissions.
  syncCheckDestinations_();
  const book = SpreadsheetApp.openById(SYNC_SHEET_ID_);
  Object.keys(SYNC_HEADERS_).forEach(name => syncSheet_(book, name));
  SpreadsheetApp.flush();
  props.setProperty('SYNC_ENABLED', 'true');
  return 'Sinkronisasi disiapkan. Deploy sebagai Web app, lalu masukkan URL /exec pada Parametra Lab.';
}
function syncFail_(code) { const e = new Error(code); e.syncCode = code; throw e; }
function syncCheckDestinations_() {
  const publicAccess = [DriveApp.Access.ANYONE, DriveApp.Access.ANYONE_WITH_LINK];
  const folder = DriveApp.getFolderById(TARGET_FOLDER_ID_), sheet = DriveApp.getFileById(SYNC_SHEET_ID_);
  if (publicAccess.includes(folder.getSharingAccess()) || publicAccess.includes(sheet.getSharingAccess())) syncFail_('PUBLIC_DESTINATION');
}
function syncText_(value, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) syncFail_('INVALID_DATA');
  return value.trim();
}
function syncInt_(n, min, max) { if (!Number.isInteger(n) || n < min || n > max) syncFail_('INVALID_DATA'); return n; }
function syncIdentity_(p) {
  if (!p || !['XI TP 1', 'XI TP 2'].includes(p.class_name)) syncFail_('INVALID_DATA');
  const attendance = syncInt_(p.attendance, 1, 99), id = 'student:' + p.class_name.replace(/ /g, '-').toLowerCase() + ':' + attendance;
  if (p.id !== id) syncFail_('INVALID_DATA');
  return { id: id, name: syncText_(p.name, 2, 80), class_name: p.class_name, attendance: attendance };
}
function syncSheet_(book, name) {
  let sheet = book.getSheetByName(name);
  if (!sheet) sheet = book.insertSheet(name);
  const headers = SYNC_HEADERS_[name];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, headers.length).setBackground('#123b70').setFontColor('#ffffff').setFontWeight('bold');
  } else if (JSON.stringify(sheet.getRange(1, 1, 1, headers.length).getValues()[0]) !== JSON.stringify(headers)) syncFail_('HEADER_CONFLICT');
  return sheet;
}
// Treat student-provided strings as text, never spreadsheet formulas.
function syncCell_(v) { return typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
function syncUpsert_(sheet, key, row) {
  const rows = sheet.getLastRow();
  const ids = rows > 1 ? sheet.getRange(2, 1, rows - 1, 1).getValues() : [];
  const index = ids.findIndex(r => r[0] === key);
  sheet.getRange(index < 0 ? rows + 1 : index + 2, 1, 1, row.length).setValues([row.map(syncCell_)]);
}
function syncFolder_(parent, name) { const matches = parent.getFoldersByName(name); return matches.hasNext() ? matches.next() : parent.createFolder(name); }
function syncStudentFolder_(profile) {
  return syncFolder_(syncFolder_(syncFolder_(DriveApp.getFolderById(TARGET_FOLDER_ID_), 'Data Siswa Parametra'), profile.class_name), String(profile.attendance).padStart(2, '0'));
}
function syncModules_(input) {
  if (!Array.isArray(input) || input.length !== 4) syncFail_('INVALID_DATA');
  return [8, 9, 10, 11].map(id => {
    const m = input.find(x => x.id === id);
    if (!m || !Array.isArray(m.steps) || !m.steps.length || m.steps.length > 80) syncFail_('INVALID_DATA');
    const keys = new Set();
    return { id: id, title: syncText_(m.title, 2, 120), steps: m.steps.map(s => {
      const key = syncInt_(s.key, 0, 1000000); if (keys.has(key)) syncFail_('INVALID_DATA'); keys.add(key);
      return { key: key, title: syncText_(s.title, 1, 200), check: syncText_(s.check, 1, 1000) };
    }) };
  });
}
function syncEvents_(input, profile, modules) {
  if (!Array.isArray(input) || input.length > 5000) syncFail_('INVALID_DATA');
  return input.map(e => {
    const id = syncText_(e.id, 8, 100), created = syncText_(e.created, 20, 35), module = syncInt_(e.module, 8, 11);
    if (e.uid !== profile.id || !Number.isFinite(Date.parse(created)) || !['checkpoint', 'quiz'].includes(e.kind)) syncFail_('INVALID_DATA');
    if (e.kind === 'checkpoint') {
      if (typeof e.checked !== 'boolean' || !modules.find(m => m.id === module).steps.some(s => s.key === e.step)) syncFail_('INVALID_DATA');
      return { id: id, uid: profile.id, created: created, module: module, kind: 'checkpoint', step: e.step, checked: e.checked };
    }
    return { id: id, uid: profile.id, created: created, module: module, kind: 'quiz', score: syncInt_(e.score, 0, 100) };
  });
}
function syncProgress_(payload, requestId) {
  const profile = syncIdentity_(payload.profile), modules = syncModules_(payload.modules);
  const incoming = syncEvents_(payload.events, profile, modules), folder = syncStudentFolder_(profile);
  const matches = folder.getFilesByName('progres.json'); let file = matches.hasNext() ? matches.next() : null;
  let previous = { events: [], works: [] };
  if (file) {
    try { previous = JSON.parse(file.getBlob().getDataAsString('UTF-8')); }
    catch (e) { syncFail_('SNAPSHOT_UNREADABLE'); }
    if (previous.profile.id !== profile.id || !Array.isArray(previous.events) || !Array.isArray(previous.works)) syncFail_('SNAPSHOT_UNREADABLE');
  }
  const byId = new Map(previous.events.map(e => [e.id, e]));
  incoming.forEach(e => {
    const prior = byId.get(e.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(e)) syncFail_('EVENT_CONFLICT');
    byId.set(e.id, e);
  });
  if (byId.size > 10000) syncFail_('EVENT_LIMIT');
  const events = [...byId.values()].sort((a, b) => a.created.localeCompare(b.created) || a.id.localeCompare(b.id));
  const works = new Map(previous.works.map(w => [w.id, w]));
  if (!Array.isArray(payload.works) || payload.works.length > 1000) syncFail_('INVALID_DATA');
  payload.works.forEach(w => { if (w.uid !== profile.id) syncFail_('INVALID_DATA'); const id = syncText_(w.id, 8, 100); works.set(id, { id: id, uid: profile.id, module: syncInt_(w.module, 8, 11) }); });
  const now = new Date().toISOString(), snapshot = { version: 1, profile: profile, modules: modules, events: events, works: [...works.values()], receivedAt: now, requestId: requestId };
  const json = JSON.stringify(snapshot);
  if (file) file.setContent(json); else file = folder.createFile('progres.json', json, 'application/json');
  const book = SpreadsheetApp.openById(SYNC_SHEET_ID_), recap = syncSheet_(book, 'PL_Rekap'), detail = syncSheet_(book, 'PL_Modul');
  const result = modules.map(m => {
    const checked = new Map(); let score = '', attempts = 0;
    events.filter(e => e.module === m.id).forEach(e => { if (e.kind === 'checkpoint') checked.set(e.step, e.checked); else { score = e.score; attempts++; } });
    const steps = m.steps.map(s => ({ title: s.title, checked: checked.get(s.key) === true })), count = steps.filter(s => s.checked).length;
    const percent = Math.round(count / steps.length * 100);
    syncUpsert_(detail, profile.id + ':' + m.id, [profile.id + ':' + m.id, profile.id, profile.name, profile.class_name, profile.attendance, m.title, percent, count, steps.length, score, attempts, [...works.values()].filter(w => w.module === m.id).length, JSON.stringify(steps), now]);
    return { percent: percent, score: score };
  });
  syncUpsert_(recap, profile.id, [profile.id, profile.name, profile.class_name, profile.attendance, ...result.map(m => m.percent), ...result.map(m => m.score), now, requestId, file.getUrl()]);
  SpreadsheetApp.flush();
  return { ok: true, receipt: requestId, receivedAt: now };
}
function syncWork_(payload, requestId, props) {
  const profile = syncIdentity_(payload.profile), w = payload.work;
  if (!w || w.uid !== profile.id) syncFail_('INVALID_DATA');
  const id = syncText_(w.id, 8, 100); if (!/^[a-zA-Z0-9_-]+$/.test(id)) syncFail_('INVALID_DATA');
  const module = syncInt_(w.module, 8, 11), filename = syncText_(w.filename, 1, 180), reflection = syncText_(w.reflection, 0, 2000);
  const drive = syncText_(w.drive_url || '', 0, 1500), fusion = syncText_(w.fusion_url || '', 0, 1500);
  if (drive && !/^https:\/\/drive\.google\.com\//.test(drive) || fusion && !/^https:\/\/[a-zA-Z0-9.-]*autodesk360\.com\//.test(fusion)) syncFail_('INVALID_DATA');
  const folder = syncFolder_(syncStudentFolder_(profile), MODULES_[String(module)]), storedName = id + '_' + filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  let url = '';
  if (payload.file) {
    if (!/\.(f3d|f3z|stl|obj|step|stp|pdf|png|jpe?g)$/i.test(filename) || typeof payload.file.base64 !== 'string' || payload.file.base64.length > Math.ceil(MAX_BYTES_ / 3) * 4) syncFail_('INVALID_DATA');
    const previous = folder.getFilesByName(storedName);
    let file = previous.hasNext() ? previous.next() : null;
    if (!file) {
      const bytes = Utilities.base64Decode(payload.file.base64);
      if (!bytes.length || bytes.length > MAX_BYTES_) syncFail_('INVALID_DATA');
      const day = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd'), counter = JSON.parse(props.getProperty('DAILY_SYNC_FILES') || '{}');
      const count = counter.date === day ? Number(counter.count) || 0 : 0;
      const limit = Number(props.getProperty('MAX_DAILY_UPLOADS') || 100);
      if (!Number.isInteger(limit) || limit < 1 || count >= limit) syncFail_('DAILY_LIMIT');
      props.setProperty('DAILY_SYNC_FILES', JSON.stringify({ date: day, count: count + 1 }));
      file = folder.createFile(Utilities.newBlob(bytes, 'application/octet-stream', storedName));
    }
    file.setDescription(JSON.stringify({ id: id, profile: profile, module: module, originalFilename: filename, reflection: reflection })); url = file.getUrl();
  }
  const now = new Date().toISOString(), sheet = syncSheet_(SpreadsheetApp.openById(SYNC_SHEET_ID_), 'PL_Karya');
  syncUpsert_(sheet, profile.id + ':' + id, [profile.id + ':' + id, profile.id, profile.name, profile.class_name, profile.attendance, MODULES_[String(module)], filename, now, id, url, reflection, [drive, fusion].filter(Boolean).join('\n')]);
  SpreadsheetApp.flush(); return { ok: true, receipt: id, receivedAt: now };
}
function doPost(e) {
  const form = e && e.parameter || {}, nonce = String(form.nonce || ''), requestId = String(form.requestId || '');
  let response = { ok: false, code: 'INVALID_DATA' };
  if (/^[a-f0-9]{32}$/.test(nonce) && /^[a-zA-Z0-9_-]{8,100}$/.test(requestId)) {
    const lock = LockService.getScriptLock(); let locked = false;
    try {
      const props = PropertiesService.getScriptProperties();
      if (props.getProperty('SYNC_ENABLED') !== 'true') syncFail_('NOT_ENABLED');
      const code = props.getProperty('CLASS_CODE');
      if (!code || code.length < 12 || form.classCode !== code) syncFail_('AUTH_FAILED');
      if (typeof form.payload !== 'string' || form.payload.length > 29 * 1024 * 1024) syncFail_('INVALID_DATA');
      const payload = JSON.parse(form.payload);
      if (payload.version !== 1 || !['progress', 'work', 'ping'].includes(payload.action)) syncFail_('INVALID_DATA');
      if (!lock.tryLock(30000)) syncFail_('BUSY'); locked = true;
      syncCheckDestinations_();
      response = payload.action === 'ping' ? { ok: true, receipt: requestId, receivedAt: new Date().toISOString() } : payload.action === 'progress' ? syncProgress_(payload, requestId) : syncWork_(payload, requestId, props);
    } catch (error) { response = { ok: false, code: error.syncCode || 'GOOGLE_ERROR' }; }
    finally { if (locked) lock.releaseLock(); }
  }
  const message = JSON.stringify({ type: 'parametra-drive-ack-v1', nonce: /^[a-f0-9]{32}$/.test(nonce) ? nonce : '', requestId: /^[a-zA-Z0-9_-]{8,100}$/.test(requestId) ? requestId : '', ...response }).replace(/</g, '\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><p>Respons sinkronisasi Parametra Lab.</p><script>window.top.postMessage(' + message + ',"*");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
