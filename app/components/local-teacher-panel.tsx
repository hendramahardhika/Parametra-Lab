"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, GraduationCap, RefreshCw, UserCircle, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { studentClasses, studentIdentityChanged } from '@/lib/student-identity';
import type { StudentProgressReport } from '@/lib/student-progress-report';
import { readLocalTeacherProgress } from '@/local/storage';

export function LocalTeacherPanel() {
    const [students, setStudents] = useState<StudentProgressReport[]>([]);
    const [className, setClassName] = useState<string>(studentClasses[0]);
    const [selectedId, setSelectedId] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const revision = useRef(0);
    const studentList = useRef<HTMLDivElement>(null);
    const reload = useCallback(async () => {
        const request = ++revision.current;
        setLoading(true); setError('');
        try {
            const next = await readLocalTeacherProgress();
            if (request !== revision.current) return;
            setStudents(next);
            setSelectedId(current => next.some(s => s.id === current) ? current : '');
        } catch (reason) {
            if (request !== revision.current) return;
            setStudents([]); setSelectedId('');
            setError(reason instanceof Error ? reason.message : 'Data siswa belum dapat dibaca.');
        } finally { if (request === revision.current) setLoading(false); }
    }, []);
    useEffect(() => {
        void reload();
        const refresh = () => void reload();
        window.addEventListener('focus', refresh);
        window.addEventListener(studentIdentityChanged, refresh);
        return () => { ++revision.current; window.removeEventListener('focus', refresh); window.removeEventListener(studentIdentityChanged, refresh); };
    }, [reload]);
    const classStudents = students.filter(s => s.className === className);
    const filtered = classStudents.filter(s => (s.name + ' ' + s.attendance).toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));
    const selected = classStudents.find(s => s.id === selectedId);
    useEffect(() => {
        // Run after the new class/filter has rendered so scroll anchoring cannot
        // retain the previous class's position halfway down the list.
        if (studentList.current) studentList.current.scrollTop = 0;
    }, [className, search]);
    function selectClass(value: string) {
        setClassName(value); setSelectedId(''); setSearch('');
        // Also reset when the teacher clicks the already-active class.
        if (studentList.current) studentList.current.scrollTop = 0;
    }
    return <>
        <div className="page-intro"><div><div className="eyebrow muted mb-3">RUANG GURU · REKAP PEMBELAJARAN</div><h1>Progres setiap siswa.</h1><p>Pilih kelas, lalu klik nama siswa untuk melihat pencapaian empat tahap belajar.</p></div></div>
        <div className="notice warning"><b>Rekap lokal — belum khusus akun guru.</b> Panel ini menampilkan data browser ini. Rekap daring seluruh kiriman tersedia di Google Sheets setelah Atur Drive diaktifkan dan Google memberi bukti penerimaan. Panel lokal belum memuat ulang data cloud. PIN siswa tidak ditampilkan.</div>
        <section className="panel teacher-class-picker" aria-label="Pilih kelas">
            <div className="panel-head"><h2><GraduationCap size={21}/> Pilih kelas</h2><button className="action ghost small" disabled={loading} onClick={() => void reload()}><RefreshCw size={16}/>{loading ? 'Memuat…' : 'Perbarui data'}</button></div>
            <div className="teacher-class-options">{studentClasses.map(value => <button type="button" key={value} className="teacher-class-button" aria-pressed={className === value} onClick={() => selectClass(value)}><Users size={22}/><span><b>{value}</b><small>{students.filter(s => s.className === value).length} siswa tercatat</small></span></button>)}</div>
        </section>
        {error && <p className="notice warning mt-5" role="alert">{error} Klik Perbarui data untuk mencoba kembali.</p>}
        <div className="teacher-progress-layout" aria-busy={loading}>
            <section className="panel teacher-student-list" aria-label={`Daftar siswa ${className}`}>
                <div className="panel-head" aria-live="polite"><h2>{className}</h2><span className="pill">{classStudents.length} siswa</span></div>
                <label className="field">Cari nama atau presensi<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama / nomor presensi"/></label>
                <div key={className} ref={studentList} className="teacher-student-buttons" role="group" aria-label={`Nama siswa ${className}`}>{filtered.map(s => <button type="button" key={s.id} className="teacher-student-button" aria-pressed={selectedId === s.id} onClick={() => setSelectedId(s.id)}><span className="teacher-attendance">{String(s.attendance).padStart(2, '0')}</span><span><b>{s.name}</b><small>{s.completedModules}/4 modul selesai</small></span></button>)}</div>
                {!loading && !filtered.length && <p className="smallprint">{classStudents.length ? 'Nama atau nomor presensi tidak ditemukan.' : 'Daftar nama kelas ini belum ditambahkan. Siswa juga dapat tercatat setelah Sign in berhasil dan data lokal dimuat.'}</p>}
                {loading && !students.length && <p className="smallprint" role="status">Membaca data siswa…</p>}
            </section>
            <section className="teacher-student-detail" aria-label="Detail progres siswa">
                {!selected ? <div className="panel teacher-empty"><UserCircle size={42}/><h2>Pilih nama siswa</h2><p>Klik salah satu nama di daftar {className}. Progres yang ditampilkan berasal dari checklist dan kuis yang telah disimpan, bukan sekadar membuka halaman.</p></div> : <>
                    <div className="panel teacher-selected-summary"><div className="panel-head"><div><span className="eyebrow muted">SISWA TERPILIH</span><h2 className="mt-2">{selected.name}</h2><p className="mt-2">{selected.className} · Nomor presensi {selected.attendance}</p></div><span className="pill">{selected.completedModules}/4 modul selesai</span></div><p className="smallprint">{selected.lastActivity ? `Aktivitas terakhir: ${new Date(selected.lastActivity).toLocaleString('id-ID')}` : 'Belum ada aktivitas pembelajaran tersimpan.'}</p></div>
                    <div className="teacher-module-grid">{selected.modules.map((module, index) => <article className="panel teacher-module" key={selected.id + ':' + module.id}>
                        <div className="teacher-module-heading"><span className="eyebrow muted">MODUL {String(index + 1).padStart(2, '0')}</span><span className={`teacher-module-status ${module.percent === 100 ? 'is-complete' : ''}`}>{module.percent === 100 ? 'Selesai' : module.checked > 0 ? 'Sedang dikerjakan' : 'Belum dicentang'}</span></div>
                        <h3>{module.title}</h3><div className="teacher-progress-number"><b>{module.percent}%</b><span>{module.checked}/{module.total} langkah diperiksa</span></div>
                        <Progress value={module.percent} aria-label={`Progres ${module.title}: ${module.percent}%`}/>
                        <p className="smallprint mt-4">Kuis terakhir: <b>{module.quizScore === null ? 'Belum ada' : `${module.quizScore}/100`}</b> · {module.quizAttempts} percobaan</p><p className="smallprint">Karya tersimpan: {module.works}</p>
                        <details className="teacher-step-details"><summary>Lihat langkah yang dikerjakan</summary><ul>{module.steps.map((step, i) => <li key={i}>{step.checked ? <CheckCircle2 size={18} aria-hidden="true"/> : <Circle size={18} aria-hidden="true"/>}<span><b>{step.title}</b><small>{step.checked ? 'Sudah diperiksa' : 'Belum diperiksa'} — {step.check}</small></span></li>)}</ul></details>
                    </article>)}</div>
                    <p className="smallprint mt-4">Persentase berasal dari checklist mandiri siswa, bukan nilai keterampilan praktik atau ukuran motivasi.</p>
                </>}
            </section>
        </div>
    </>;
}
