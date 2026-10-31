// Isolated contract tests; no real Google account, browser storage, or network is used.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { build } from 'esbuild';
const requireTest = createRequire(new URL('../.sites-runtime/storage-test/package.json', import.meta.url));
const { indexedDB } = requireTest('fake-indexeddb');
const props = { CLASS_CODE: 'kelas-uji-123456789', MAX_DAILY_UPLOADS: '100' };
const allFiles = [], sheets = new Map();
const iterator = values => { const copy = [...values]; return { hasNext: () => copy.length > 0, next: () => copy.shift() }; };
function folder(name) {
    const children = new Map(), files = new Map();
    return { getName: () => name, children, files,
        getFoldersByName: name => iterator(children.has(name) ? [children.get(name)] : []),
        createFolder(name) { const f = folder(name); children.set(name, f); return f; },
        getFilesByName: name => iterator(files.has(name) ? [files.get(name)] : []),
        createFile(content, text) {
            const name = typeof content === 'string' ? content : content.name;
            const f = { name, text: typeof content === 'string' ? text : '', blob: content, description: '',
                getBlob() { return { getDataAsString: () => this.text }; },
                setContent(text) { this.text = text; }, setDescription(text) { this.description = text; },
                getUrl: () => `https://drive.google.com/file/d/mock-${allFiles.length}/view` };
            files.set(name, f); allFiles.push(f); return f;
        }
    };
}
const root = folder('Folder tujuan uji');
let destinationPublic = false;
root.getSharingAccess = () => destinationPublic ? 'ANYONE_WITH_LINK' : 'PRIVATE';
function sheet(name) {
    const values = [];
    return { name, values, getLastRow: () => values.length, setFrozenRows() {},
        getRange(row, col, height, width) {
            const range = { getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => values[row + i - 1]?.[col + j - 1] ?? '')),
                setValues(input) { input.forEach((r, i) => { values[row + i - 1] ||= []; r.forEach((v, j) => { values[row + i - 1][col + j - 1] = v; }); }); return range; },
                setBackground: () => range, setFontColor: () => range, setFontWeight: () => range };
            return range;
        }
    };
}
const original = sheet('Materi asli'); original.values.push(['Tidak boleh berubah']); sheets.set(original.name, original);
const book = { getSheetByName: name => sheets.get(name), insertSheet(name) { assert(!sheets.has(name)); const s = sheet(name); sheets.set(name, s); return s; } };
const server = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props[key], setProperty: (key, value) => { props[key] = value; } }) },
    DriveApp: { Access: { ANYONE: 'ANYONE', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, getFileById: id => { assert.equal(id, '1J9P5x0v1GtWMy4XK9-qNEGnGxECvCyuUD0lP5bDOhls'); return { getSharingAccess: () => 'PRIVATE' }; }, getFolderById: id => { assert.equal(id, '1tMtfa3NUhHX7gWS1G4-goMv0o8-Z7Mt5'); return root; } },
    SpreadsheetApp: { openById: id => { assert.equal(id, '1J9P5x0v1GtWMy4XK9-qNEGnGxECvCyuUD0lP5bDOhls'); return book; }, flush() {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-10-27', base64Decode: b => [...Buffer.from(b, 'base64')], newBlob: (bytes, type, name) => ({ bytes, type, name }) },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }, createHtmlOutput: html => ({ html, setXFrameOptionsMode() { return this; } }) },
});
vm.runInContext(await readFile(new URL('../integrations/google-drive/Code.gs', import.meta.url), 'utf8'), server);
vm.runInContext(await readFile(new URL('../integrations/google-drive/Sync.gs', import.meta.url), 'utf8'), server);
server.setupAutoSync();
assert.equal(props.SYNC_ENABLED, 'true'); assert.equal(sheets.size, 4); assert.deepEqual(original.values, [['Tidak boleh berubah']]);
destinationPublic = true; assert.throws(() => server.setupAutoSync(), /PUBLIC_DESTINATION/); destinationPublic = false;
const realTimeout = globalThis.setTimeout;
globalThis.setTimeout = (...args) => { const timer = realTimeout(...args); timer.unref?.(); return timer; };
const storage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
globalThis.localStorage = storage(); globalThis.sessionStorage = storage(); globalThis.indexedDB = indexedDB;
globalThis.window = Object.assign(new EventTarget(), { location: { pathname: '/isolated-drive-test/index.html' } });
Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
let requests = 0, hook = null;
globalThis.document = {
    body: { appendChild() {} },
    createElement(tag) {
        const node = { children: [], setAttribute() {}, remove() {}, appendChild(child) { this.children.push(child); } };
        if (tag === 'form') node.submit = () => {
            void (async () => {
                requests++;
                const parameter = Object.fromEntries(node.children.map(c => [c.name, c.value]));
                if (hook) { const run = hook; hook = null; await run(JSON.parse(parameter.payload)); }
                const result = server.doPost({ parameter });
                const data = JSON.parse(result.html.match(/window\.top\.postMessage\((.*),"\*"\)/)[1]);
                window.dispatchEvent(new MessageEvent('message', { origin: 'https://test-script.googleusercontent.com', data }));
            })();
        };
        return node;
    }
};
// Node's Blob exists; emulate FileReader without accessing any actual file.
globalThis.FileReader = class { readAsDataURL(blob) { void blob.arrayBuffer().then(b => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onload(); }); } };
const built = await build({ stdin: { contents: "export * from './lib/drive-sync';export {lessons,stepKey} from './lib/curriculum';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const profile = { id: 'student:xi-tp-1:1', name: 'Siswa Uji', class_name: 'XI TP 1', attendance: 1 };
const event = (id, step, checked, second) => ({ id, uid: profile.id, kind: 'checkpoint', module: 8, created: `2026-10-27T01:00:0${second}.000Z`, payload: JSON.stringify({ step, checked }) });
const state = events => ({ profile, events, submissions: [] });
const first = event('checkpoint-first', api.stepKey(api.lessons[0], 0), true, 1);
const second = event('checkpoint-second', api.stepKey(api.lessons[0], 1), true, 2);
const snapshot = state([first]);
const payload = api.driveProgressPayload({ ...snapshot, events: [...snapshot.events, { ...first, id: 'reflection-private', kind: 'reflection', payload: '{"note":"private text"}' }] });
assert(!JSON.stringify(payload).includes('private text')); assert(!JSON.stringify(payload).includes('PIN'));
await api.queueDriveSnapshot(snapshot);
await api.flushDriveSync(true); assert.equal(requests, 0, 'No endpoint / offline cannot send');
const url = 'https://script.google.com/macros/s/testDeployment/exec';
api.configureDriveSync(url, props.CLASS_CODE);
navigator.onLine = true;
await api.flushDriveSync(true); assert.equal(requests, 0, 'Unverified config stays paused');
await api.postDrivePayload(url, props.CLASS_CODE, { version: 1, action: 'ping' });
api.configureDriveSync(url, props.CLASS_CODE, true);
localStorage.setItem('parametra-student-identity-v1:' + window.location.pathname, JSON.stringify({ fullName: profile.name, className: profile.class_name, attendance: 1, pinSessionVersion: 1 }));
hook = async () => { await api.queueDriveSnapshot(state([first, second])); };
await api.flushDriveSync(true);
assert.equal((await api.driveSyncState()).pending, 1, 'Acknowledging older revision must preserve the newer dirty revision');
await api.flushDriveSync(true);
assert.equal((await api.driveSyncState()).pending, 0);
const recap = sheets.get('PL_Rekap'); assert.equal(recap.values.length, 2, 'Same pupil is upserted, not appended repeatedly');
assert.equal(recap.values[1][4], Math.round(2 / api.lessons[0].steps.length * 100));
// A different device knows only a newer uncheck; the other checked step survives the merge.
const unchecked = event('checkpoint-uncheck', first.payload ? JSON.parse(first.payload).step : 0, false, 3);
await api.queueDriveSnapshot(state([unchecked])); await api.flushDriveSync(true);
assert.equal(recap.values[1][4], Math.round(1 / api.lessons[0].steps.length * 100));
await api.queueDriveSnapshot(state([first])); await api.flushDriveSync(true);
assert.equal(recap.values[1][4], Math.round(1 / api.lessons[0].steps.length * 100), 'Stale device cannot erase newer uncheck');
assert.equal(sheets.get('PL_Modul').values.length, 5);
const work = { id: 'work-unique-id', uid: profile.id, module: 10, filename: 'part.stl', reflection: 'Karya sudah diperiksa.', drive_url: '', fusion_url: '' };
await api.queueDriveWork(profile, work, new Blob(['STL test content'])); await api.flushDriveSync(true);
const fileCount = allFiles.length;
await api.queueDriveWork(profile, work, new Blob(['STL test content'])); await api.flushDriveSync(true);
assert.equal(allFiles.length, fileCount, 'Retry must not create duplicate file');
assert.equal(sheets.get('PL_Karya').values.length, 2);
props.CLASS_CODE = 'kode-diganti-123456';
await api.queueDriveSnapshot(state([first, second, unchecked])); await api.flushDriveSync(true);
assert.equal((await api.driveSyncState()).pending, 1, 'Auth failure retains job');
assert.match((await api.driveSyncState()).error, /Kode/);
api.configureDriveSync(url, props.CLASS_CODE, true); await api.flushDriveSync(true);
assert.equal((await api.driveSyncState()).pending, 0);
const pupilB = { ...profile, id: 'student:xi-tp-1:2', name: 'Siswa B', attendance: 2 };
const rowA = [...recap.values[1]];
await api.queueDriveSnapshot({ profile: pupilB, events: [{ ...first, id: 'pupil-b-checkpoint', uid: pupilB.id }], submissions: [] });
navigator.onLine = false;
await api.flushDriveSync(true);
const reloaded = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text + '\n//fresh-page').toString('base64'));
localStorage.setItem('parametra-student-identity-v1:' + window.location.pathname, JSON.stringify({ fullName: pupilB.name, className: pupilB.class_name, attendance: 2, pinSessionVersion: 1 }));
assert.equal((await reloaded.driveSyncState()).pending, 1, 'Queue survives a new module/page instance');
navigator.onLine = true;
await reloaded.flushDriveSync(true);
assert.equal(recap.values.length, 3, 'Two pupils receive separate recap rows');
assert.deepEqual(recap.values[1], rowA, 'Pupil B must not overwrite pupil A');
assert.equal(recap.values[2][0], pupilB.id);
assert(!api.trustedDriveAck('https://attacker.example', { type: 'parametra-drive-ack-v1', requestId: 'r', nonce: 'n' }, 'r', 'n'));
assert(!api.trustedDriveAck('https://test-script.googleusercontent.com', { type: 'parametra-drive-ack-v1', requestId: 'r', nonce: 'wrong' }, 'r', 'n'));
assert(api.trustedDriveAck('https://test-script.googleusercontent.com', { type: 'parametra-drive-ack-v1', requestId: 'r', nonce: 'n' }, 'r', 'n'));
assert.equal(server.syncCell_('=IMPORTXML("x")'), '\'=IMPORTXML("x")');
assert.deepEqual(original.values, [['Tidak boleh berubah']]);
api.pauseDriveSync(); assert.equal(api.readDriveSyncConfig().code, '');
console.log('PASS automatic Drive contracts: durable outbox, offline/verification gates, dirty revision ACK, safe retry, student event merge, idempotent work, private tabs preserved, formula safety, nonce/origin validation. Google services and network mocked; live deployment still required.');
