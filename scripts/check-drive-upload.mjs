import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Local contract tests with fake Google services, NOT a live Drive upload test.
const source = await readFile(new URL('../integrations/google-drive/Code.gs', import.meta.url), 'utf8');
const properties = { CLASS_CODE: 'test-code-123456', UPLOADS_ENABLED: 'true', MAX_DAILY_UPLOADS: '2' };
const files = new Map();
const iterator = list => ({ hasNext: () => list.length > 0, next: () => list.shift() });
const folder = {
  getFilesByName: name => iterator(files.has(name) ? [files.get(name)] : []),
  createFile(blob) {
    const file = { description: '', setDescription(text) { this.description = text; }, setTrashed() { files.delete(blob.name); } };
    files.set(blob.name, file); return file;
  }
};
const context = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key], setProperty: (key, value) => { properties[key] = value; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  DriveApp: { getFolderById: id => { assert.equal(id, '1tMtfa3NUhHX7gWS1G4-goMv0o8-Z7Mt5'); return { getFoldersByName: () => iterator([folder]), createFolder: () => folder }; } },
  Utilities: { formatDate: () => '2026-10-26' },
});
vm.runInContext(source, context);
const blob = (name = 'contoh.stl', size = 32) => ({ name, getName() { return this.name; }, getBytes: () => ({ length: size }), setName(value) { this.name = value; return this; } });
const form = overrides => ({ classCode: properties.CLASS_CODE, studentName: 'Siswa Uji', className: 'XI TP', assignment: 'Jobsheet 1', reflection: 'Model sudah diperiksa.', module: '10', receipt: 'a'.repeat(32), file: blob(), ...overrides });
assert.throws(() => context.submitWork(form({ classCode: 'salah' })), /Kode/);
assert.throws(() => context.submitWork(form({ module: '__proto__' })), /modul/);
assert.throws(() => context.submitWork(form({ file: blob('x.exe') })), /Format/);
assert.throws(() => context.submitWork(form({ file: blob('x.stl', 0) })), /20 MB/);
assert.throws(() => context.submitWork(form({ file: blob('x.stl', 20 * 1024 * 1024 + 1) })), /20 MB/);
assert.equal(files.size, 0);
const result = context.submitWork(form());
assert.equal(result.ok, true);
assert.equal(files.size, 1);
const metadata = JSON.parse([...files.values()][0].description);
assert.equal(metadata.name, 'Siswa Uji');
assert.equal(metadata.module, '03 Membuat Part 3D');
assert.equal(context.submitWork(form()).receipt, result.receipt);
assert.equal(files.size, 1, 'Retry should not create another file');
context.submitWork(form({ receipt: 'b'.repeat(32) }));
assert.throws(() => context.submitWork(form({ receipt: 'c'.repeat(32) })), /harian/);
properties.UPLOADS_ENABLED = 'false';
assert.throws(() => context.submitWork(form()), /belum dibuka/);
const html = await readFile(new URL('../integrations/google-drive/Index.html', import.meta.url), 'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const config = JSON.parse(await readFile(new URL('../lib/drive-upload.json', import.meta.url), 'utf8'));
assert.equal(config.webAppUrl, '', 'Deployment must remain disabled until the owner authorizes it');
console.log('PASS: validation, disabled state, metadata, retry, daily limit, and form JavaScript syntax. Google services mocked; live upload NOT tested.');
