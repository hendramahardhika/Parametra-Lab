import config from './drive-sync.json';
import { lessons, stepKey } from './curriculum';
import { readStudentIdentity, studentAccountId } from './student-identity';
import type { StudyData, Submission } from '@/app/components/learning';

export type DriveSnapshot = { profile: { id: string; name: string; class_name: string; attendance?: number }; events: StudyData['events']; submissions: Submission[] };
type Profile = DriveSnapshot['profile'];
type Job = { key: string; revision: string; owner: string; action: 'progress' | 'work'; payload: Record<string, unknown>; blob?: Blob; fingerprint: string; target: string; attempts: number; nextAttempt: number };
type Receipt = { fingerprint: string; target: string; receipt: string; at: string };
export type DriveSyncState = { configured: boolean; hasCode: boolean; paused: boolean; pending: number; lastSync: string; error: string; busy: boolean };
export const driveSyncChanged = 'parametra:drive-sync-changed';
const deploymentPattern = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
let connection: Promise<IDBDatabase> | undefined, busy = false, lastError = '', retryTimer: ReturnType<typeof setTimeout> | undefined;
const pathKey = () => 'parametra-drive-sync-v1:' + window.location.pathname.toLowerCase();
const notify = () => window.dispatchEvent(new Event(driveSyncChanged));
export function readDriveSyncConfig() {
    let saved: { url?: string; paused?: boolean } = {};
    try { saved = JSON.parse(localStorage.getItem(pathKey()) || '{}'); } catch { /* Use the packaged public URL when no local setting exists. */ }
    const url = saved.url === undefined ? config.webAppUrl : saved.url;
    let code = ''; try { code = sessionStorage.getItem(pathKey() + ':code:' + url) || ''; } catch { /* No durable secret fallback. */ }
    return { url: deploymentPattern.test(url || '') ? url! : '', paused: saved.paused === true, code };
}
export function configureDriveSync(url: string, code: string, verified = false) {
    if (!deploymentPattern.test(url.trim())) throw Error('Gunakan URL deployment Google Apps Script yang berakhir /exec.');
    if (code.length < 12 || code.length > 200) throw Error('Kode sinkronisasi dari guru minimal 12 karakter.');
    localStorage.setItem(pathKey(), JSON.stringify({ url: url.trim(), paused: !verified }));
    sessionStorage.setItem(pathKey() + ':code:' + url.trim(), code);
    lastError = ''; notify();
}
export function pauseDriveSync() {
    const current = readDriveSyncConfig(); localStorage.setItem(pathKey(), JSON.stringify({ url: current.url, paused: true }));
    sessionStorage.removeItem(pathKey() + ':code:' + current.url); notify();
}
function database() {
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
        let hash = 2166136261; for (const c of window.location.pathname.toLowerCase()) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
        const request = indexedDB.open('parametra-drive-outbox-' + (hash >>> 0).toString(16), 1);
        request.onupgradeneeded = () => { request.result.createObjectStore('jobs', { keyPath: 'key' }); request.result.createObjectStore('receipts'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { connection = undefined; reject(Error('Antrean Drive belum dapat disimpan. Data belajar tetap ada di browser.')); };
        request.onblocked = () => reject(Error('Tutup tab Parametra lain, lalu coba sinkron kembali.'));
    });
    return connection;
}
const requestValue = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
function transactionDone(tx: IDBTransaction) { return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(Error('Antrean Drive belum tersimpan. Coba lagi tanpa menghapus data browser.')); }); }
const nonce = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
async function fingerprint(value: unknown) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))), b => b.toString(16).padStart(2, '0')).join(''); }
export function driveProgressPayload(snapshot: DriveSnapshot) {
    const profile = snapshot.profile;
    const events = snapshot.events.filter(e => e.uid === profile.id && ['checkpoint', 'quiz'].includes(e.kind)).map(e => {
        const p = JSON.parse(e.payload);
        return { id: e.id, uid: e.uid, module: e.module, kind: e.kind, created: e.created, ...(e.kind === 'checkpoint' ? { step: p.step, checked: p.checked } : { score: p.score }) };
    });
    return { version: 1, action: 'progress', profile: { id: profile.id, name: profile.name, class_name: profile.class_name, attendance: profile.attendance },
        modules: lessons.map(m => ({ id: m.id, title: m.title, steps: m.steps.map((s, i) => ({ key: stepKey(m, i), title: s.title, check: s.check })) })), events,
        works: snapshot.submissions.filter(w => w.uid === profile.id).map(w => ({ id: w.id, uid: w.uid, module: w.module })) };
}
export function reportDriveSyncError(error: unknown) { lastError = error instanceof Error ? error.message : 'Pembaruan belum masuk antrean Drive.'; notify(); }
async function enqueue(key: string, owner: string, action: Job['action'], payload: Record<string, unknown>, blob?: Blob) {
    const hash = await fingerprint(payload), target = readDriveSyncConfig().url, db = await database();
    const receipt = await requestValue<Receipt | undefined>(db.transaction('receipts', 'readonly').objectStore('receipts').get(key));
    if (target && receipt?.target === target && receipt.fingerprint === hash) return;
    const previous = await requestValue<Job | undefined>(db.transaction('jobs', 'readonly').objectStore('jobs').get(key));
    if (previous?.fingerprint === hash && previous.target === target) return;
    const tx = db.transaction('jobs', 'readwrite'), done = transactionDone(tx);
    tx.objectStore('jobs').put({ key, revision: nonce(), owner, action, payload, ...(blob ? { blob } : {}), fingerprint: hash, target, attempts: 0, nextAttempt: 0 } satisfies Job);
    await done; notify(); scheduleFlush(2500);
}
// Serialize reports per pupil so a slow hash from an older edit cannot replace a newer edit.
const reportChains = new Map<string, Promise<void>>();
export function queueDriveSnapshot(snapshot: DriveSnapshot) {
    const copy = structuredClone(snapshot), owner = copy.profile.id;
    const pending = (reportChains.get(owner) || Promise.resolve()).catch(() => {}).then(() => enqueue('progress:' + owner, owner, 'progress', driveProgressPayload(copy)));
    reportChains.set(owner, pending); return pending;
}
export function queueDriveWork(profile: Profile, work: Submission, blob?: Blob) {
    const clean = { id: work.id, uid: work.uid, module: work.module, filename: work.filename, reflection: work.reflection, drive_url: work.drive_url, fusion_url: work.fusion_url };
    return enqueue('work:' + profile.id + ':' + work.id, profile.id, 'work', { version: 1, action: 'work', profile: { id: profile.id, name: profile.name, class_name: profile.class_name, attendance: profile.attendance }, work: clean }, blob);
}
const serverErrors: Record<string, string> = {
    AUTH_FAILED: 'Kode sinkronisasi tidak sesuai. Masukkan kembali kode dari guru.', NOT_ENABLED: 'Layanan Google belum diaktifkan oleh guru.', HEADER_CONFLICT: 'Nama tab spreadsheet bertabrakan dengan tabel lain. Hubungi guru.', PUBLIC_DESTINATION: 'Folder atau spreadsheet tujuan terbuka untuk publik. Guru perlu mengatur akses Terbatas sebelum menyimpan data siswa.',
    EVENT_CONFLICT: 'Ada aktivitas dengan ID yang sama tetapi isinya berbeda. Hubungi guru.', EVENT_LIMIT: 'Riwayat cloud mencapai batas. Hubungi guru sebelum menghapus data.', SNAPSHOT_UNREADABLE: 'Cadangan Drive belum dapat dibaca. Hubungi guru.',
    DAILY_LIMIT: 'Batas unggahan harian tercapai. Antrean akan dicoba lagi.', BUSY: 'Google sedang memproses siswa lain. Antrean akan dicoba lagi.', INVALID_DATA: 'Data sinkronisasi belum dapat diterima. Hubungi guru.', GOOGLE_ERROR: 'Google belum mengonfirmasi penyimpanan. Periksa deployment dan izin Drive guru.'
};
export function trustedDriveAck(origin: string, data: unknown, requestId: string, expectedNonce: string) {
    const value = data as { type?: string; nonce?: string; requestId?: string } | null;
    return /^https:\/\/(?:[a-z0-9-]+-)?script\.googleusercontent\.com$/i.test(origin) && value?.type === 'parametra-drive-ack-v1' && value.requestId === requestId && value.nonce === expectedNonce;
}
export function postDrivePayload(url: string, code: string, payload: Record<string, unknown>, requestId = nonce()): Promise<{ receipt: string; receivedAt: string }> {
    if (!deploymentPattern.test(url)) return Promise.reject(Error('Alamat sinkronisasi belum diisi.'));
    return new Promise((resolve, reject) => {
        const token = nonce(), name = 'parametra-sync-' + token;
        const iframe = document.createElement('iframe'); iframe.name = name; iframe.title = 'Pengiriman pembaruan ke Google'; iframe.hidden = true; iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
        const form = document.createElement('form'); form.method = 'POST'; form.action = url; form.target = name; form.hidden = true;
        const values = { nonce: token, requestId, classCode: code, payload: JSON.stringify(payload) };
        for (const [key, value] of Object.entries(values)) { const field = document.createElement('textarea'); field.name = key; field.value = value; form.appendChild(field); }
        const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); iframe.remove(); form.remove(); };
        const receive = (e: MessageEvent) => {
            if (!trustedDriveAck(e.origin, e.data, requestId, token)) return;
            const ack = e.data as { ok?: boolean; code?: string; receipt?: string; receivedAt?: string };
            cleanup();
            if (ack.ok !== true || typeof ack.receipt !== 'string' || !ack.receipt || typeof ack.receivedAt !== 'string' || !Number.isFinite(Date.parse(ack.receivedAt))) reject(Error(serverErrors[ack.code || 'GOOGLE_ERROR'] || serverErrors.GOOGLE_ERROR));
            else resolve({ receipt: ack.receipt, receivedAt: ack.receivedAt });
        };
        const timer = setTimeout(() => { cleanup(); reject(Error('Belum ada bukti penerimaan Google. Antrean disimpan dan akan dicoba lagi.')); }, payload.action === 'work' ? 150000 : 60000);
        window.addEventListener('message', receive); document.body.appendChild(iframe); document.body.appendChild(form);
        try { form.submit(); } catch { cleanup(); reject(Error('Browser belum dapat mengirim ke Google. Antrean tetap tersimpan.')); }
    });
}
function encodeBlob(blob: Blob) {
    return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(Error('Berkas antrean belum dapat dibaca.')); reader.readAsDataURL(blob); });
}
function scheduleFlush(ms = 15000) { if (retryTimer) clearTimeout(retryTimer); retryTimer = setTimeout(() => { retryTimer = undefined; void flushDriveSync().catch(reportDriveSyncError); }, ms); }
export async function flushDriveSync(force = false) {
    const settings = readDriveSyncConfig();
    if (busy || settings.paused || !settings.url || settings.code.length < 12 || navigator.onLine === false) return;
    busy = true; notify();
    try {
        const db = await database(), jobs = await requestValue<Job[]>(db.transaction('jobs', 'readonly').objectStore('jobs').getAll());
        const ready = jobs.filter(j => (!j.target || j.target === settings.url) && (force || j.nextAttempt <= Date.now())).slice(0, 5);
        for (const job of ready) {
            try {
                const payload = { ...job.payload, ...(job.blob ? { file: { base64: await encodeBlob(job.blob) } } : {}) };
                const ack = await postDrivePayload(settings.url, settings.code, payload, job.revision);
                const tx = db.transaction(['jobs', 'receipts'], 'readwrite'), done = transactionDone(tx);
                const read = tx.objectStore('jobs').get(job.key);
                read.onsuccess = () => { if ((read.result as Job | undefined)?.revision === job.revision) tx.objectStore('jobs').delete(job.key); };
                tx.objectStore('receipts').put({ fingerprint: job.fingerprint, target: settings.url, receipt: ack.receipt, at: ack.receivedAt } satisfies Receipt, job.key);
                await done; lastError = ''; notify();
            } catch (error) {
                const tx = db.transaction('jobs', 'readwrite'), done = transactionDone(tx), read = tx.objectStore('jobs').get(job.key);
                read.onsuccess = () => {
                    const current = read.result as Job | undefined;
                    if (current?.revision === job.revision) tx.objectStore('jobs').put({ ...current, attempts: current.attempts + 1, nextAttempt: Date.now() + Math.min(600000, 30000 * 2 ** Math.min(current.attempts, 5)) });
                };
                await done; reportDriveSyncError(error); break;
            }
        }
    } finally { busy = false; notify(); scheduleFlush(); }
}
export async function driveSyncState(): Promise<DriveSyncState> {
    const settings = readDriveSyncConfig(); let owner = '';
    try { const identity = readStudentIdentity(); if (identity) owner = studentAccountId(identity); } catch { /* No signed-in student. */ }
    const db = await database();
    const jobs = await requestValue<Job[]>(db.transaction('jobs', 'readonly').objectStore('jobs').getAll());
    const receipt = owner ? await requestValue<Receipt | undefined>(db.transaction('receipts', 'readonly').objectStore('receipts').get('progress:' + owner)) : undefined;
    return { configured: !!settings.url, hasCode: settings.code.length >= 12, paused: settings.paused, pending: jobs.filter(j => j.owner === owner).length, lastSync: receipt?.target === settings.url ? receipt.at : '', error: lastError, busy };
}
