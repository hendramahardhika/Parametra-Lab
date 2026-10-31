export const studentClasses = ['XI TP 1', 'XI TP 2'] as const;
export type StudentIdentity = {
    fullName: string;
    className: typeof studentClasses[number];
    attendance: number;
};

// This is a browser identity label, not authentication or permission to access a server.
export function validateStudentIdentity(value: unknown): StudentIdentity {
    const input = value as Partial<StudentIdentity> | null;
    const fullName = typeof input?.fullName === 'string' ? input.fullName.trim().replace(/\s+/g, ' ') : '';
    if (fullName.length < 2 || fullName.length > 80) throw new Error('Isi nama lengkap, 2–80 karakter.');
    if (!studentClasses.includes(input?.className as StudentIdentity['className'])) throw new Error('Pilih kelas XI TP 1 atau XI TP 2.');
    const attendance = Number(input?.attendance);
    if (!Number.isInteger(attendance) || attendance < 1 || attendance > 99) throw new Error('Nomor presensi harus berupa bilangan bulat 1–99.');
    return { fullName, className: input!.className!, attendance };
}

export function studentInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return (Array.from(words[0] || '')[0] || '') + (words.length > 1 ? Array.from(words[words.length - 1])[0] : '');
}

export function studentIdentityKey(pathname: string) {
    return 'parametra-student-identity-v1:' + pathname.toLowerCase();
}

export function studentAccountId(identity: StudentIdentity) {
    const valid = validateStudentIdentity(identity);
    return `student:${valid.className.replaceAll(' ', '-').toLowerCase()}:${valid.attendance}`;
}

export const studentIdentityChanged = 'parametra:student-identity-changed';
export function readStudentIdentity(): StudentIdentity | null {
    const raw = localStorage.getItem(studentIdentityKey(window.location.pathname));
    if (!raw) return null;
    const stored = JSON.parse(raw);
    // Existing pre-PIN sessions must sign in again; progress keys remain unchanged.
    return stored?.pinSessionVersion === 1 ? validateStudentIdentity(stored) : null;
}

export function announceStudentIdentityChange() {
    window.dispatchEvent(new Event(studentIdentityChanged));
}
