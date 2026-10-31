"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, LogOut, UserCircle } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { announceStudentIdentityChange, readStudentIdentity, studentClasses, studentIdentityKey, studentInitials, validateStudentIdentity, type StudentIdentity } from '@/lib/student-identity';
import { signInWithStudentPin } from '@/lib/student-pin';

export function StudentSignIn() {
    const [identity, setIdentity] = useState<StudentIdentity | null>(null);
    const [ready, setReady] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [fullName, setFullName] = useState('');
    const [className, setClassName] = useState('');
    const [attendance, setAttendance] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const key = studentIdentityKey(window.location.pathname);
        function load() {
            try {
                setIdentity(readStudentIdentity());
            } catch {
                setIdentity(null);
                setError('Identitas tersimpan belum dapat dibaca. Isi kembali; penyimpanan mungkin dibatasi browser.');
            } finally { setReady(true); }
        }
        function storageChanged(event: StorageEvent) { if (event.key === key || event.key === null) load(); }
        load();
        window.addEventListener('storage', storageChanged);
        return () => window.removeEventListener('storage', storageChanged);
    }, []);

    function changeOpen(next: boolean) {
        if (busy) return;
        setPin(''); setShowPin(false);
        if (next) {
            setFullName(identity?.fullName || '');
            setClassName(identity?.className || '');
            setAttendance(identity ? String(identity.attendance) : '');
        }
        setOpen(next);
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        setBusy(true); setError('');
        try {
            const next = validateStudentIdentity({ fullName, className, attendance: Number(attendance) });
            await signInWithStudentPin(next, pin);
            setIdentity(next);
            announceStudentIdentityChange();
            setError('');
            setOpen(false);
            setPin(''); setShowPin(false);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Periksa kembali isian Anda.'); }
        finally { setBusy(false); }
    }

    function signOut() {
        try {
            localStorage.removeItem(studentIdentityKey(window.location.pathname));
            setIdentity(null);
            announceStudentIdentityChange();
            setFullName(''); setClassName(''); setAttendance('');
            setPin(''); setShowPin(false);
            setError(''); setOpen(false);
        } catch { setError('Belum dapat keluar. Penyimpanan browser sedang dibatasi.'); }
    }

    return <div className="student-account"><Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
            {identity ? <button type="button" className="student-avatar" aria-label={`Identitas ${identity.fullName}, ${identity.className}, presensi ${identity.attendance}`} title={`${identity.fullName} · ${identity.className} · No. ${identity.attendance}`}>
                <span>{studentInitials(identity.fullName).toLocaleUpperCase('id-ID')}</span>
            </button> : <button type="button" className="student-sign-in" disabled={!ready}><UserCircle size={23}/><span>Sign in</span></button>}
        </DialogTrigger>
        <DialogContent className="student-dialog">
            <div className="student-dialog-heading"><span className="student-dialog-icon"><UserCircle size={27}/></span><DialogTitle>Identitas siswa</DialogTitle></div>
            <DialogDescription>Gunakan kelas, nomor presensi, dan PIN yang sama untuk melanjutkan progres belajarmu.</DialogDescription>
            <form onSubmit={submit} className="student-form" aria-busy={busy}>
                <fieldset disabled={busy} className="student-fields">
                <label className="field" htmlFor="student-full-name">Nama Lengkap
                    <input id="student-full-name" name="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" placeholder="Masukkan nama lengkap"/>
                </label>
                <label className="field" htmlFor="student-class">Kelas
                    <select id="student-class" name="className" value={className} onChange={e => setClassName(e.target.value)} required>
                        <option value="" disabled>Pilih kelas</option>
                        {studentClasses.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </label>
                <label className="field" htmlFor="student-attendance">Nomor Presensi
                    <input id="student-attendance" name="attendance" type="number" inputMode="numeric" min={1} max={99} step={1} value={attendance} onChange={e => setAttendance(e.target.value)} required placeholder="Masukkan nomor presensi"/>
                </label>
                <div className="field">
                    <label htmlFor="student-pin">PIN</label>
                    <div className="student-pin-input">
                        <input id="student-pin" name="pin" type={showPin ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} value={pin} onChange={e => setPin(e.target.value)} required autoComplete="off" placeholder="Masukkan 6 angka" aria-describedby="student-pin-help"/>
                        <button type="button" onClick={() => setShowPin(v => !v)} aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'} aria-pressed={showPin}>{showPin ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
                    </div>
                    <span id="student-pin-help" className="smallprint">Jika profil belum memiliki PIN di browser ini, PIN yang dimasukkan akan menjadi PIN baru. Ingat PIN tersebut; pemulihan PIN belum tersedia.</span>
                </div>
                </fieldset>
                {error && <p className="notice warning" role="alert">{error}</p>}
                <p className="smallprint student-identity-note">Progres dipisahkan berdasarkan kelas + nomor presensi. PIN diperiksa pada browser ini dan tidak dikirim ke Google. Pengiriman cadangan Drive diaktifkan melalui Atur Drive; ini belum autentikasi akun siswa daring. Jangan gunakan PIN ATM atau kata sandi akun lain. Keluar setelah memakai perangkat bersama.</p>
                <button type="submit" className="action student-submit" disabled={busy}>{busy ? 'Memeriksa PIN…' : identity ? 'Simpan perubahan' : 'Sign in'}</button>
                {identity && <button type="button" className="student-sign-out" onClick={signOut} disabled={busy}><LogOut size={16}/> Keluar dari identitas ini</button>}
                {identity && <p className="smallprint">Keluar tidak menghapus progres atau karya yang tersimpan di perangkat.</p>}
            </form>
        </DialogContent>
    </Dialog></div>;
}
