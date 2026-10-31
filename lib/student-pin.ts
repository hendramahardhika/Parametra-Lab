import { studentAccountId, studentIdentityKey, validateStudentIdentity, type StudentIdentity } from './student-identity';

type PinRecord = { version: 1; salt: number[]; hash: number[] };
const rounds = 600000;
export function validateStudentPin(pin: string) {
    if (!/^\d{6}$/.test(pin)) throw new Error('PIN harus terdiri dari tepat 6 angka.');
    return pin;
}
function pinKey(identity: StudentIdentity) {
    return studentIdentityKey(window.location.pathname) + ':pin:' + studentAccountId(identity);
}
async function digest(pin: string, salt: Uint8Array) {
    if (!globalThis.crypto?.subtle) throw new Error('Browser belum mendukung penyimpanan PIN. Gunakan Chrome/Edge terbaru melalui file lokal atau HTTPS.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt), iterations: rounds, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(hash));
}
export async function signInWithStudentPin(input: StudentIdentity, pin: string) {
    const identity = validateStudentIdentity(input);
    validateStudentPin(pin);
    const key = pinKey(identity);
    const previous = localStorage.getItem(key);
    if (previous) {
        let record: PinRecord;
        try {
            record = JSON.parse(previous);
            if (record.version !== 1 || !Array.isArray(record.salt) || record.salt.length !== 16 || !Array.isArray(record.hash) || record.hash.length !== 32 || [...record.salt, ...record.hash].some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error();
        } catch { throw new Error('Data PIN pada browser ini tidak dapat dibaca. Jangan hapus data situs; simpan cadangan progres dahulu.'); }
        const actual = await digest(pin, new Uint8Array(record.salt));
        const mismatch = actual.reduce((diff, value, index) => diff | (value ^ record.hash[index]), 0);
        if (mismatch) throw new Error('PIN tidak sesuai untuk kelas dan nomor presensi ini.');
    } else {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const hash = await digest(pin, salt);
        // Another tab may have registered this pupil while hashing.
        if (localStorage.getItem(key) !== previous) throw new Error('PIN baru saja dibuat di tab lain. Coba masuk kembali.');
        localStorage.setItem(key, JSON.stringify({ version: 1, salt: Array.from(salt), hash } satisfies PinRecord));
    }
    // Only the verified identity is stored in the session, never the raw PIN.
    localStorage.setItem(studentIdentityKey(window.location.pathname), JSON.stringify({ ...identity, pinSessionVersion: 1 }));
    return identity;
}
