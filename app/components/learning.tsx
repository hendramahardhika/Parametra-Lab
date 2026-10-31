"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, BookOpen, Box, Check, Download, FolderOpen, Lightbulb, Monitor, Pause, Play, Printer, ShieldCheck, Upload, RotateCcw, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { lessons, progressFor, stepKey, safeLink, lessonTitle, nextLesson, type Lesson } from '@/lib/curriculum';
import { JobsheetPanel } from './jobsheets';
import { SketchPreview } from './sketch-preview';
import { PartPreview } from './part-preview';
import { AssemblyPreview } from './assembly-preview';
import { FusionInterface } from './fusion-interface';
import { ResourceLibrary } from './resource-library';
import CadWorkbench from './cad-workbench';
import CadCommandTutorial from './cad-command-tutorial';
import type { ExamplePracticeRequest } from '@/lib/cad-command-examples';
import { DriveUpload } from './drive-upload';
import { StudentProgressStatus } from './student-progress-status';
import { pistonVideoUrl } from '@/lib/jobsheets';
export const Viewer = dynamic(() => import('./cad-viewer'), { ssr: false, loading: () => <Skeleton className="h-[360px] rounded-xl bg-[#233a50]"/> });
export type Activity = {
    id: string;
    uid: string;
    kind: string;
    module: number;
    payload: string;
    created: string;
};
export type Submission = {
    id: string;
    uid: string;
    module: number;
    filename: string;
    object_key: string | null;
    drive_url: string;
    fusion_url: string;
    reflection: string;
    cycle: string;
    created: string;
    score: number | null;
    feedback: string | null;
    name?: string;
    class_name?: string;
};
export type StudyData = {
    user: {
        name: string;
        email: string;
    } | null;
    teacher: boolean;
    profiles: {
        id: string;
        name: string;
        class_name: string;
        attendance?: number;
    }[];
    events: Activity[];
    submissions: Submission[];
    settings: Record<string, string>;
    limitNote?: string;
};
export type SaveAction = (p: Record<string, unknown>, quiet?: boolean) => Promise<Record<string, unknown> | null>;
function Heading({ eyebrow, title, text }: {
    eyebrow: string;
    title: string;
    text: string;
}) { return <div className="page-intro"><div><div className="eyebrow muted mb-3">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div></div>; }
function SignIn() { return <div className="notice">Masuk untuk menyimpan dan mengumpulkan karya. Materi dan Lab 3D tetap dapat dijelajahi. <a className="text-link" href={`/signin-with-chatgpt?return_to=${typeof window === 'undefined' ? '/' : encodeURIComponent('/' + window.location.hash)}`} target="_top">Masuk dengan ChatGPT <ExternalLink size={14}/></a></div>; }
function NoData({ title, text }: {
    title: string;
    text: string;
}) { return <Empty className="border bg-white"><EmptyHeader><EmptyMedia variant="icon"><FolderOpen /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{text}</EmptyDescription></EmptyHeader></Empty>; }
function Picker({ value, onChange, items, label }: {
    value: string;
    onChange: (s: string) => void;
    items: [
        string,
        string
    ][];
    label: string;
}) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-full h-11 bg-white" aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(([v, t]) => <SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></Select>; }
function parsed(e: Activity) { try {
    return JSON.parse(e.payload);
}
catch {
    return {};
} }
export function PortfolioView({ data, save, refresh }: {
    data: StudyData;
    save: SaveAction;
    refresh: () => Promise<void>;
}) { const [module, setModule] = useState(String(lessons[0].id)), [name, setName] = useState(''), [className, setClassName] = useState('XI Teknik Pemesinan'), [busy, setBusy] = useState(false); useEffect(() => { if (data.profiles?.[0]) {
    setName(data.profiles[0].name);
    setClassName(data.profiles[0].class_name);
} }, [data.profiles]); async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget; const payload = new FormData(form); payload.set('module', module); setBusy(true); try {
    const r = await fetch('/api/portfolio', { method: 'POST', headers: { 'X-Parametra-Student': data.profiles[0]?.id || '' }, body: payload });
    const result = await r.json() as {
        error?: string;
        ok?: boolean;
    };
    if (!r.ok)
        throw new Error(result.error);
    toast.success('Karya berhasil dikumpulkan.');
    form.reset();
    await refresh();
}
catch (e) {
    toast.error(e instanceof Error ? e.message : 'Gagal mengumpulkan. Isian tidak dihapus.');
}
finally {
    setBusy(false);
} } return <><Heading eyebrow="ARSIP PERJALANANMU" title="Karya yang terus berkembang." text="Simpan file sumber, tautan model, dan refleksi. Setiap pengumpulan menjadi versi baru."/><DriveUpload />{!data.user ? <SignIn /> : <><div className="panel"><h2>Identitas belajar</h2><div className="form-grid mt-4"><label className="field">Nama tampil<input value={name} maxLength={80} onChange={e => setName(e.target.value)}/></label><label className="field">Kelas<input value={className} maxLength={80} onChange={e => setClassName(e.target.value)}/></label></div><button className="action ghost small" disabled={busy} onClick={async () => { setBusy(true); await save({ action: 'profile', name, className }); setBusy(false); }}>Simpan identitas</button></div><form className="panel" onSubmit={e => void submit(e)}><div className="panel-head"><h2>Kumpulkan versi terbaru</h2><span className="pill">{data.settings.cycle || 'Pra-tindakan'}</span></div><label className="field">Modul</label><Picker label="Modul pengumpulan" value={module} onChange={setModule} items={lessons.map(m => [String(m.id), `${m.order.toString().padStart(2, '0')} · ${m.title}`])}/><label className="field mt-5">Berkas karya (opsional jika memakai tautan)<input type="file" name="file" accept=".f3d,.f3z,.stl,.obj,.step,.stp,.pdf,.png,.jpg,.jpeg"/><span className="smallprint">F3D, F3Z, STL, OBJ, STEP, PDF, PNG, JPG · maksimal 20 MB. Berkas disimpan di Parametra Lab, bukan otomatis di Drive.</span></label><div className="form-grid"><label className="field">Tautan Google Drive<input name="drive" type="url" maxLength={1500} placeholder="https://drive.google.com/…"/></label><label className="field">Tautan berbagi Autodesk<input name="fusion" type="url" maxLength={1500} placeholder="https://…autodesk360.com/…"/></label></div>{data.settings.drive && <a className="text-link mb-5" href={data.settings.drive} target="_blank" rel="noreferrer">Buka folder pengumpulan kelas <ExternalLink size={14}/></a>}<label className="field">Refleksi & catatan pengujian<textarea name="reflection" required minLength={10} maxLength={2000} rows={4} placeholder="Apa yang sudah berhasil, bantuan yang digunakan, hasil uji, dan bagian yang masih perlu diperbaiki?"/></label><p className="smallprint mb-4">Berkas dan refleksi dapat dilihat oleh kamu serta guru yang berwenang. Tautan eksternal mengikuti izin Drive/Autodesk. Hindari data pribadi sensitif.</p><button className="action" disabled={busy}><Upload size={17}/>{busy ? 'Mengumpulkan…' : 'Kumpulkan karya'}</button></form></>}<div className="section-title"><h2>Riwayat karya</h2><span className="pill">{data.submissions.length} pengumpulan</span></div>{data.submissions.length ? data.submissions.map(s => <SubmissionCard key={s.id} submission={s}/>) : <NoData title="Belum ada karya tersimpan" text="Pengumpulan pertama akan muncul di sini setelah berhasil dikirim."/>}</>; }
function SubmissionCard({ submission: s, children }: {
    submission: Submission;
    children?: React.ReactNode;
}) { return <article className="panel submission"><div className="panel-head"><div><span className="eyebrow muted">{s.cycle} · {lessonTitle(s.module)}</span><h3 className="mt-2">{s.filename}</h3></div><span className="pill">{s.score === null ? 'Belum dinilai' : `${s.score}/100`}</span></div>{s.name && <p className="mb-3">{s.name} · {s.class_name}</p>}<p className="whitespace-pre-wrap">{s.reflection}</p><div className="link-row mt-4">{s.object_key && <a className="text-link" href={`/api/portfolio?id=${encodeURIComponent(s.id)}`}><Download size={16}/> Unduh berkas</a>}{s.drive_url && <a className="text-link" href={s.drive_url} target="_blank" rel="noreferrer">Buka Drive <ExternalLink size={14}/></a>}{s.fusion_url && <a className="text-link" href={s.fusion_url} target="_blank" rel="noreferrer">Buka model Autodesk <ExternalLink size={14}/></a>}</div>{s.feedback && <div className="notice mt-4"><b>Umpan balik guru:</b> {s.feedback}</div>}<p className="smallprint mt-4">Dikumpulkan {new Date(s.created).toLocaleString('id-ID')}</p>{children}</article>; }
export function ProgressView({ data }: {
    data: StudyData;
}) { const quizzes = data.events.filter(e => e.kind === 'quiz'); return <><Heading eyebrow="JEJAK BELAJAR" title="Lihat kemajuanmu." text="Checklist, hasil kuis, dan refleksi berasal dari aktivitas yang kamu simpan."/><StudentProgressStatus data={data}/>{!data.user && <SignIn />}<div className="stats mb-6"><div className="stat"><b>{lessons.filter(m => progressFor(data.events, m.id) === 100).length}/{lessons.length}</b><span>Modul diperiksa</span></div><div className="stat"><b>{quizzes.length}</b><span>Percobaan kuis</span></div><div className="stat"><b>{data.submissions.length}</b><span>Karya dikumpulkan</span></div></div><div className="panel"><Table><TableHeader><TableRow><TableHead>Modul</TableHead><TableHead>Checklist</TableHead><TableHead>Kuis terakhir</TableHead></TableRow></TableHeader><TableBody>{lessons.map(m => { const q = quizzes.filter(q => q.module === m.id).at(-1); return <TableRow key={m.id}><TableCell><a className="text-link" href={`#modul/${m.id}`}>{m.order}. {m.title}</a></TableCell><TableCell>{progressFor(data.events, m.id)}%</TableCell><TableCell>{q ? `${parsed(q).score}/100` : 'Belum ada'}</TableCell></TableRow>; })}</TableBody></Table></div><div className="notice mt-5">Progres checklist adalah laporan mandiri, bukan nilai keterampilan. Frekuensi membuka petunjuk juga bukan ukuran langsung rendah/tingginya motivasi.</div><div className="section-title"><h2>Riwayat kuis</h2></div>{quizzes.length ? <div className="panel"><Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Modul</TableHead><TableHead>Nilai</TableHead><TableHead>Tahap</TableHead></TableRow></TableHeader><TableBody>{[...quizzes].reverse().map(q => <TableRow key={q.id}><TableCell>{new Date(q.created).toLocaleString('id-ID')}</TableCell><TableCell>{lessonTitle(q.module)}</TableCell><TableCell>{parsed(q).score}</TableCell><TableCell>{parsed(q).cycle}</TableCell></TableRow>)}</TableBody></Table></div> : <NoData title="Belum ada hasil kuis" text="Coba kuis pada salah satu modul dan simpan setelah masuk."/>}</>; }
function downloadCsv(filename: string, rows: unknown[][]) { const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+@\-\t\r\n]/.test(s))
    s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }; const text = '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function TeacherView({ data, save }: {
    data: StudyData;
    save: SaveAction;
}) { const [classData, setClassData] = useState<StudyData | null>(null), [error, setError] = useState(''), [drive, setDrive] = useState(data.settings.drive || ''), [cycle, setCycle] = useState(data.settings.cycle || 'Pra-tindakan'), [filter, setFilter] = useState(''), [busy, setBusy] = useState(false); async function loadClass() { try {
    const r = await fetch('/api/study?teacher=1');
    const d = await r.json() as StudyData & {
        error?: string;
    };
    if (!r.ok)
        throw new Error(d.error);
    setClassData(d);
    setError('');
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Data kelas belum tersedia.');
} } useEffect(() => { if (data.teacher)
    void loadClass(); }, [data.teacher]); useEffect(() => { setDrive(data.settings.drive || ''); setCycle(data.settings.cycle || 'Pra-tindakan'); }, [data.settings]); return <><Heading eyebrow="GURU & KOLABORATOR PTK" title="Dampingi prosesnya." text="Tinjau jejak belajar, beri umpan balik, dan gunakan data aktivitas sebagai pelengkap observasi."/><div className="panel mb-6"><div className="panel-head"><h2>Acuan pendampingan</h2><ShieldCheck size={20}/></div><div className="rubric-grid">{[['Ketepatan geometri', 'Dimensi, profil, lubang, dan pasangan komponen.'], ['Proses pemodelan', 'Constraint, pemilihan fitur, struktur, dan revisi timeline.'], ['Fungsi rakitan', 'Ground, joint, sumbu, batas gerak, dan bukti pengujian.'], ['Komunikasi & refleksi', 'Penjelasan keputusan, bukti revisi, dan rencana perbaikan.']].map(([t, d]) => <div key={t}><h3>{t}</h3><p className="mt-2">{d}</p></div>)}</div><p className="smallprint mt-5">Acuan awal, bukan instrumen tervalidasi. Bobot, rubrik rinci, indikator motivasi, dan kriteria keberhasilan PTK perlu ditetapkan peneliti bersama guru kolaborator.</p></div>{!data.user ? <SignIn /> : !data.teacher ? <div className="notice warning"><h3>Akses data kelas belum diberikan.</h3><p className="mt-3">Akun ini dapat belajar sebagai siswa. Pengelola perlu menetapkan email guru melalui pengaturan aman website sebelum ruang guru aktif. Tidak ada data siswa yang ditampilkan kepada akun tanpa wewenang.</p><p className="smallprint mt-3">Akun saat ini: {data.user.email}</p></div> : <>{error && <div className="notice warning" role="alert">{error} <button className="text-link" onClick={() => void loadClass()}>Coba lagi</button></div>}<div className="panel"><h2>Pengaturan pengumpulan</h2><label className="field mt-4">Folder Google Drive kelas<input type="url" value={drive} onChange={e => setDrive(e.target.value)} placeholder="https://drive.google.com/drive/folders/…"/></label><label className="field">Tahap penelitian untuk aktivitas baru</label><Picker value={cycle} onChange={setCycle} label="Tahap PTK" items={['Pra-tindakan', 'Siklus I', 'Siklus II'].map(s => [s, s])}/><p className="smallprint mt-3">Tahap ini diberi label saat data disimpan. Empat tahap materi tidak otomatis sama dengan siklus PTK. Label siklus pada nama PDF asli tetap dipertahankan.</p><button className="action mt-4" disabled={busy} onClick={async () => { setBusy(true); await save({ action: 'settings', drive, cycle }); setBusy(false); }}>Simpan pengaturan</button></div>{!classData ? <Skeleton className="h-40 mt-6"/> : <><div className="section-title"><h2>Ringkasan kelas</h2><button className="action ghost small" onClick={() => void loadClass()}>Perbarui data</button></div><div className="stats mb-5"><div className="stat"><b>{classData.profiles.length}</b><span>Peserta tercatat</span></div><div className="stat"><b>{classData.events.length}</b><span>Aktivitas tersimpan</span></div><div className="stat"><b>{classData.submissions.length}</b><span>Pengumpulan</span></div></div><div className="panel"><Table><TableHeader><TableRow><TableHead>Peserta</TableHead><TableHead>Kelas</TableHead><TableHead>Modul diperiksa</TableHead><TableHead>Karya</TableHead></TableRow></TableHeader><TableBody>{classData.profiles.map(p => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.class_name}</TableCell><TableCell>{lessons.filter(m => progressFor(classData.events.filter(e => e.uid === p.id), m.id) === 100).length}/{lessons.length}</TableCell><TableCell>{classData.submissions.filter(s => s.uid === p.id).length}</TableCell></TableRow>)}</TableBody></Table>{!classData.profiles.length && <p className="notice mt-4">Belum ada peserta yang menyimpan aktivitas.</p>}</div><div className="link-row mt-5"><button className="action ghost" onClick={() => downloadCsv('Parametra-aktivitas.csv', [['ID aktivitas', 'ID peserta', 'Nama', 'Kelas', 'Jenis', 'Modul', 'Waktu UTC', 'Tahap', 'Nilai', 'Langkah', 'Petunjuk', 'Catatan'], ...classData.events.map(e => { const p = classData.profiles.find(p => p.id === e.uid), v = parsed(e); return [e.id, e.uid, p?.name, p?.class_name, e.kind, e.module, e.created, v.cycle, v.score, v.step, v.level, v.note]; })])}><Download size={17}/> Ekspor aktivitas CSV</button><button className="action ghost" onClick={() => downloadCsv('Parametra-karya.csv', [['ID karya', 'Nama', 'Kelas', 'Modul', 'Tahap', 'Waktu UTC', 'Berkas', 'Nilai', 'Umpan balik', 'Refleksi'], ...classData.submissions.map(s => [s.id, s.name, s.class_name, s.module, s.cycle, s.created, s.filename, s.score, s.feedback, s.reflection])])}><Download size={17}/> Ekspor penilaian CSV</button></div><p className="smallprint mt-3">{classData.limitNote} Simpan data penelitian secara terbatas; anonimisasi identitas sebelum publikasi.</p><div className="notice mt-5">Data klik, kuis, dan pengumpulan adalah bukti aktivitas, bukan diagnosis motivasi. Triangulasikan dengan observasi kolaborator, angket yang sesuai, dan penilaian unjuk kerja.</div><div className="section-title"><h2>Tinjau karya siswa</h2></div><label className="field search-label">Cari nama atau kelas<input type="search" value={filter} onChange={e => setFilter(e.target.value)}/></label>{classData.submissions.filter(s => (s.name + ' ' + s.class_name).toLowerCase().includes(filter.toLowerCase())).map(s => <SubmissionCard key={s.id} submission={s}><form className="review-form mt-5" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); const result = await save({ action: 'review', id: s.id, score: Number(f.get('score')), feedback: f.get('feedback') }); if (result)
    await loadClass(); setBusy(false); }}><label className="field">Nilai praktik (0–100)<input name="score" type="number" min={0} max={100} step={1} required defaultValue={s.score ?? ''}/></label><label className="field">Umpan balik guru<textarea name="feedback" rows={3} maxLength={2000} required defaultValue={s.feedback || ''}/></label><button className="action" disabled={busy}>Simpan penilaian</button></form></SubmissionCard>)}{!classData.submissions.length && <NoData title="Belum ada karya untuk ditinjau" text="Karya yang dikumpulkan peserta akan muncul di sini."/>}</>}</>}</>; }
export function LessonView({ lesson: m, section = 'materi', data, save }: {
    lesson: Lesson;
    section?: 'part3d' | 'materi' | 'jobsheet' | 'dokumen';
    data: StudyData;
    save: SaveAction;
}) {
    const [index, setIndex] = useState(0), [hint, setHint] = useState(0), [tab, setTab] = useState('langkah'), [auto, setAuto] = useState(false), [speed, setSpeed] = useState('5000'), [answers, setAnswers] = useState<number[]>([]), [score, setScore] = useState<number | null>(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false);
    const step = m.steps[index];
    const events = data.events.filter(e => e.module === m.id);
    const checked = (i: number) => { const event = events.filter(e => e.kind === 'checkpoint' && parsed(e).step === stepKey(m, i)).at(-1); return !!event && parsed(event).checked === true; };
    useEffect(() => setHint(0), [index]);
    useEffect(() => { setAuto(false); }, [section]);
    useEffect(() => { if (!auto)
        return; const timer = setInterval(() => setIndex(i => { if (i >= m.steps.length - 1) {
        setAuto(false);
        return i;
    } return i + 1; }), Number(speed)); return () => clearInterval(timer); }, [auto, speed, m.steps.length]);
    async function checkpoint(value: boolean) { setBusy(true); await save({ kind: 'checkpoint', module: m.id, step: stepKey(m, index), checked: value }); setBusy(false); }
    async function submitQuiz() { if (answers.length !== m.quiz.length || m.quiz.some((_, i) => answers[i] === undefined)) {
        toast.error('Jawab semua pertanyaan dahulu.');
        return;
    } setBusy(true); if (data.user) {
        const result = await save({ kind: 'quiz', module: m.id, answers });
        if (result)
            setScore(Number(result.score));
    }
    else {
        setScore(Math.round(100 * m.quiz.filter((q, i) => q.answer === answers[i]).length / m.quiz.length));
        toast.info('Hasil latihan belum disimpan. Masuk untuk menyimpan.');
    } setBusy(false); }
    return <><a href="#modul" className="text-link mb-5"><ArrowLeft size={16}/> Semua modul</a><Heading eyebrow={`MODUL ${String(m.order).padStart(2, '0')} / ${m.meeting}`} title={m.title} text={m.subtitle}/><Tabs value={section} onValueChange={value => { setAuto(false); window.location.hash = `modul/${m.id}/${value}`; }}>
      <TabsList className="module-section-tabs" aria-label={`Isi modul ${m.title}`}>
        <TabsTrigger value="part3d">{m.stage === 'intro' ? <Monitor size={18}/> : <Box size={18}/>} {m.stage === 'intro' ? 'Interface Autodesk Fusion' : m.stage === 'sketch' ? 'Preview Sketch 2D' : 'Part 3D'}</TabsTrigger>
        <TabsTrigger value="materi"><BookOpen size={18}/> Modul pembelajaran</TabsTrigger>
        <TabsTrigger value="jobsheet"><FolderOpen size={18}/> Jobsheet PDF</TabsTrigger>
        <TabsTrigger value="dokumen"><BookOpen size={18}/> Bahan belajar</TabsTrigger>
      </TabsList>
      <TabsContent value="part3d">{m.stage === 'intro' ? <FusionInterface /> : m.stage === 'sketch' ? <SketchPreview /> : m.stage === 'part' ? <PartPreview /> : <AssemblyPreview />}</TabsContent>
      <TabsContent value="jobsheet"><JobsheetPanel stage={m.stage} stepIndex={index} onPracticeSelect={setIndex}/></TabsContent>
      <TabsContent value="dokumen"><ResourceLibrary stage={m.stage}/></TabsContent>
      <TabsContent value="materi"><div className="lesson-meta"><span><Check size={16}/> {m.goal}</span><button className="action ghost small" onClick={() => window.print()}><Printer size={16}/> Cetak panduan</button></div><div className="notice reference-note">{m.dimensions}</div><div className="lesson-layout"><section className="min-w-0"><Tabs value={tab} onValueChange={v => { setTab(v); setAuto(false); }}><TabsList className="lesson-tabs"><TabsTrigger value="langkah">Langkah praktik</TabsTrigger><TabsTrigger value="tutorial">Panduan langkah</TabsTrigger><TabsTrigger value="kuis">Kuis</TabsTrigger><TabsTrigger value="refleksi">Refleksi</TabsTrigger></TabsList><TabsContent value="langkah"><div className="panel mt-4"><span className="eyebrow muted">LANGKAH {index + 1} DARI {m.steps.length}</span><h2 className="mt-3">{step.title}</h2><p className="body-copy mt-4">{step.instruction}</p><div className="checkpoint"><Checkbox id={`check-${m.id}-${index}`} checked={checked(index)} disabled={busy || !data.user} onCheckedChange={v => void checkpoint(v === true)}/><label htmlFor={`check-${m.id}-${index}`}>{step.check}</label></div>{!data.user && <p className="smallprint mb-4">Masuk agar hasil pemeriksaanmu tersimpan.</p>}<div className="hint-box"><div className="flex items-center gap-2"><Lightbulb size={19}/><h3>Butuh sedikit petunjuk?</h3></div><p className="mt-2">Coba dahulu. Buka bantuan satu per satu sesuai kebutuhan.</p>{step.hints.slice(0, hint).map((h, i) => <p className="hint-item" key={h}><span>{i + 1}</span>{h}</p>)}<button disabled={hint === 3} className="action ghost small mt-4" onClick={() => { setHint(hint + 1); if (data.user)
        void save({ kind: 'hint', module: m.id, step: stepKey(m, index), level: hint + 1 }, true); }}>{hint === 3 ? 'Semua petunjuk terbuka' : `Buka petunjuk ${hint + 1}/3`}</button></div><div className="step-actions"><button className="action ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={16}/> Sebelumnya</button><button className="action" disabled={index === m.steps.length - 1} onClick={() => setIndex(index + 1)}>Berikutnya <ArrowRight size={16}/></button></div></div><div className="panel"><h3>Pahami idenya</h3><p className="mt-3">{m.concept}</p><h3 className="mt-6">Hasil yang dikumpulkan</h3><p className="mt-3">{m.deliverable}</p><a className="text-link mt-4" href="#portofolio">Buka portofolio <ArrowRight size={16}/></a></div></TabsContent>
 <TabsContent value="tutorial"><section className="panel mt-4"><div className="panel-head"><h2>Lihat urutannya.</h2><span className="pill">{index + 1}/{m.steps.length}</span></div>{m.stage === 'assembly' ? <><video className="lesson-video" src={pistonVideoUrl()} controls playsInline preload="metadata" aria-label="Referensi gerak assembly piston"/><p className="smallprint mt-3">Video referensi piston milik guru, bukan pratinjau langsung file CAD siswa. Uji hasil rakitan sendiri di Fusion.</p></> : <div className="guided-stage"><span className="eyebrow">TAHAP {m.order} / 4</span><h3>{m.title}</h3><p>{m.concept}</p><a className="text-link" href={`#modul/${m.id}/jobsheet`}>Lihat gambar acuan PDF <ArrowRight size={16}/></a></div>}<p className="smallprint mt-3">Putar panduan untuk berpindah antarpetunjuk secara otomatis. Ini panduan teks, bukan animasi operasi atau rekaman antarmuka Fusion.</p><div className="play-controls"><button className="action" onClick={() => { if (index === m.steps.length - 1)
        setIndex(0); setAuto(!auto); }}>{auto ? <Pause size={16}/> : <Play size={16}/>} {auto ? 'Jeda' : 'Putar otomatis'}</button><Picker label="Kecepatan demonstrasi" value={speed} onChange={setSpeed} items={[["8000", "Lambat · 8 detik"], ["5000", "Normal · 5 detik"], ["3000", "Cepat · 3 detik"]]}/></div><h3 className="mt-5">{index + 1}. {step.title}</h3><p className="mt-3" aria-live="polite">{step.instruction}</p><div className="step-dots">{m.steps.map((s, i) => <button className={i === index ? 'selected' : ''} key={s.title} onClick={() => { setIndex(i); setAuto(false); }} aria-label={`Langkah ${i + 1}: ${s.title}`} aria-current={i === index ? 'step' : undefined}>{i + 1}</button>)}</div></section></TabsContent>
 <TabsContent value="kuis"><div className="panel mt-4"><div className="panel-head"><h2>Cek pemahamanmu</h2><span className="pill">{m.quiz.length} pertanyaan</span></div><p>Kuis formatif untuk belajar, bukan pengganti penilaian praktik oleh guru.</p>{m.quiz.map((q, i) => <fieldset className="quiz-question" key={q.q}><legend>{i + 1}. {q.q}</legend><RadioGroup aria-label={q.q} value={answers[i] === undefined ? '' : String(answers[i])} onValueChange={v => { setAnswers(a => { const b = [...a]; b[i] = Number(v); return b; }); setScore(null); }}>{q.options.map((option, j) => <label className="radio-option" htmlFor={`q${i}-${j}`} key={option}><RadioGroupItem value={String(j)} id={`q${i}-${j}`}/>{option}</label>)}</RadioGroup>{score !== null && <div className={`answer-feedback ${answers[i] === q.answer ? 'correct' : 'incorrect'}`}><b>{answers[i] === q.answer ? 'Tepat.' : 'Belum tepat.'}</b> {q.why} <span>Jawaban: {q.options[q.answer]}.</span></div>}</fieldset>)}<button className="action" disabled={busy} onClick={() => void submitQuiz()}>{busy ? 'Memeriksa…' : 'Periksa jawaban'}</button>{score !== null && <div className="result" aria-live="polite"><b>{score}/100</b><p>{score === 100 ? 'Konsepnya sudah kamu kuasai. Buktikan dalam praktik!' : 'Baca pembahasan, lalu coba lagi saat siap.'}</p></div>}</div></TabsContent>
 <TabsContent value="refleksi"><div className="panel mt-4"><h2>Apa yang berubah hari ini?</h2><p className="mt-3">Sebutkan satu hal yang sudah bisa kamu kerjakan sendiri, satu kendala, dan langkah berikutnya.</p><label className="field mt-5">Refleksi belajar<textarea rows={7} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Hari ini saya sudah bisa… Saya masih kesulitan ketika… Berikutnya saya akan…"/></label><button disabled={busy || !data.user} className="action" onClick={async () => { setBusy(true); const ok = await save({ kind: 'reflection', module: m.id, note }); if (ok)
        setNote(''); setBusy(false); }}>Simpan refleksi</button>{!data.user && <div className="mt-4"><SignIn /></div>}{events.filter(e => e.kind === 'reflection').slice(-3).reverse().map(e => <blockquote className="saved-note" key={e.id}><p>{parsed(e).note}</p><small>{new Date(e.created).toLocaleString('id-ID')}</small></blockquote>)}</div></TabsContent></Tabs></section><aside className="lesson-aside"><section className="panel"><div className="panel-head"><h2>Checklist praktik</h2><span className="mono">{progressFor(data.events, m.id)}%</span></div><Progress value={progressFor(data.events, m.id)} aria-label="Progres modul" className="h-2 mb-5"/><ol className="step-list">{m.steps.map((s, i) => <li key={s.title}><button aria-current={index === i ? 'step' : undefined} onClick={() => { setIndex(i); setTab('langkah'); }}><span className={checked(i) ? 'done' : ''}>{checked(i) ? <Check size={15}/> : i + 1}</span>{s.title}</button></li>)}</ol></section><div className="tip mt-5"><BookOpen size={20}/><h3 className="mt-3">Dua layar, satu fokus.</h3><p>Baca langkah di HP dan kerjakan di Fusion pada komputer. Periksa hasil sebelum menandai langkah selesai.</p></div><a className="text-link mt-5" href={nextLesson(m.id) ? `#modul/${nextLesson(m.id)!.id}` : '#portofolio'}>{nextLesson(m.id) ? 'Tahap berikutnya' : 'Kumpulkan karya'} <ArrowRight size={16}/></a></aside></div></TabsContent></Tabs><section className="print-jobsheet"><h2>{m.title}</h2><p>{m.goal}</p><p>{m.dimensions}</p>{m.steps.map((s, i) => <article key={s.title}><h3>{i + 1}. {s.title}</h3><p>{s.instruction}</p><p>□ {s.check}</p></article>)}<h3>Hasil yang dikumpulkan</h3><p>{m.deliverable}</p><p>Nama: ____________________ Kelas: __________ Tanggal: __________</p></section></>;
}
export function LabView({ owner = 'guest', ownerName }: { owner?: string; ownerName?: string }) {
    const [tab, setTab] = useState('design');
    const [practice, setPractice] = useState<ExamplePracticeRequest | null>(null);
    return <>
        <div className="cad-lab-heading"><div><span className="eyebrow">BENGKEL VIRTUAL</span><h1>Gambar. Bentuk. Eksplorasi.</h1><p>Latihan sketch dan model 3D sederhana, langsung di ruang kerjamu.</p></div>
            <div className="cad-lab-tabs" role="tablist" aria-label="Pilihan Lab 3D">
                <button role="tab" aria-selected={tab === 'design'} onClick={() => setTab('design')}><Box size={17}/> Ruang desain</button>
                <button role="tab" aria-selected={tab === 'tutorial'} onClick={() => setTab('tutorial')}><Play size={17}/> Contoh animasi</button>
                <button role="tab" aria-selected={tab === 'viewer'} onClick={() => setTab('viewer')}><FolderOpen size={17}/> Viewer model</button>
            </div>
        </div>
        <div hidden={tab !== 'design'}><CadWorkbench key={owner} owner={owner} ownerName={ownerName} practiceRequest={practice} onTutorial={() => setTab('tutorial')}/></div>
        {tab === 'tutorial' && <CadCommandTutorial onPractice={example => { setPractice({ token: Date.now(), command: example.command, project: example.final }); setTab('design'); }}/>}
        {tab === 'viewer' && <ModelReferenceView/>}
    </>;
}
function ModelReferenceView() { const [file, setFile] = useState<File | null>(null), [draft, setDraft] = useState(''), [embed, setEmbed] = useState(''), [tab, setTab] = useState('file'); function showEmbed() { const value = draft.match(/src=["']([^"']+)["']/i)?.[1] || draft; const link = safeLink(value.replace(/&amp;/g, '&'), 'fusion'); if (!link || !new URL(link).hostname.endsWith('.autodesk360.com')) {
    toast.error('Tempel URL src Embed Autodesk dengan HTTPS pada domain autodesk360.com.');
    return;
} setEmbed(link); } return <><Tabs value={tab} onValueChange={setTab}><TabsList className="lesson-tabs"><TabsTrigger value="file">File saya</TabsTrigger><TabsTrigger value="autodesk">Viewer Autodesk</TabsTrigger></TabsList><TabsContent value="file"><div className="panel mt-5"><h2>Buka STL atau OBJ</h2><p className="mt-3">Buka model hasil latihanmu untuk melihat bentuknya dari berbagai sisi. Pilih file dari perangkat; pratinjau ini belum dikumpulkan ke guru.</p><label className="upload-zone mt-5"><Upload size={25}/><span>Pilih model STL / OBJ · maksimal 20 MB</span><input aria-label="Pilih file model 3D" type="file" accept=".stl,.obj" onChange={e => { const f = e.target.files?.[0]; if (!f)
    return; if (f.size > 20 * 1024 * 1024 || !/^.+\.(stl|obj)$/i.test(f.name)) {
    toast.error('Pilih STL atau OBJ maksimal 20 MB.');
    return;
} setFile(f); }}/></label>{file ? <div className="mt-5"><Viewer file={file} height={450}/><button className="text-link mt-3" onClick={() => setFile(null)}>Tutup pratinjau</button></div> : <div className="mt-5"><NoData title="Modelmu akan tampil di sini" text="STL/OBJ menampilkan geometri. File sumber F3D/F3Z tidak dibaca langsung oleh viewer ini."/></div>}<a className="text-link mt-5" href="#portofolio">Kumpulkan file sumber melalui portofolio <ArrowRight size={16}/></a></div></TabsContent><TabsContent value="autodesk"><div className="panel mt-5"><h2>Tampilkan desain dari Autodesk</h2><p className="mt-3">Buka tautan berbagi Fusion di Autodesk, pilih Share → Embed, lalu salin URL pada src atau kode iframe. Izinkan akses hanya sesuai kesepakatan kelas; jangan publikasikan desain rahasia.</p><label className="field mt-5">URL atau kode Embed Autodesk<textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Tempel URL HTTPS dari Embed Autodesk…"/></label><button className="action" onClick={showEmbed}>Tampilkan model</button>{embed && <><iframe className="autodesk-frame mt-5" title="Model Autodesk dari tautan pengguna" src={embed} allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"/><p className="smallprint mt-3">Viewer memerlukan internet dan izin akses Autodesk. Jika tidak termuat, <a className="text-link" href={embed} target="_blank" rel="noreferrer">buka di Autodesk</a>.</p></>}<div className="notice mt-5">Tautan Drive ke F3D/F3Z hanya menyimpan sumber desain. Viewer Autodesk adalah layanan terpisah; website ini tidak mengubah file Drive menjadi CAD secara otomatis.</div><a className="text-link mt-4" href="https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-embed-a-viewer-of-a-Fusion-360-design-into-a-website.html" target="_blank" rel="noreferrer">Panduan resmi Embed Autodesk <ExternalLink size={14}/></a></div></TabsContent></Tabs></>; }
