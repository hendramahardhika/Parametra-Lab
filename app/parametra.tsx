"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, BookOpen, Box, CircleHelp, LayoutDashboard, Library, GraduationCap, FolderOpen, ChevronRight, Layers, Monitor, PencilRuler, Wrench, ChartNoAxesCombined, LogOut } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { lessons, glossary, clinic, progressFor, lessonById } from '@/lib/curriculum';
import { LessonView, LabView, PortfolioView, TeacherView, ProgressView, type StudyData, type SaveAction } from './components/learning';
import { stages, pistonVideoUrl } from '@/lib/jobsheets';
import { StudentSignIn } from './components/student-sign-in';
import { LocalTeacherPanel } from './components/local-teacher-panel';
import { ResourceLibrary } from './components/resource-library';
import { DriveAutoSync } from './components/drive-auto-sync';
import { MobileNavigation } from './components/mobile-navigation';
import { studentIdentityChanged, studentIdentityKey } from '@/lib/student-identity';
const nav = [{ icon: LayoutDashboard, label: 'Beranda', path: '' }, { icon: BookOpen, label: 'Modul belajar', path: 'modul' }, { icon: Library, label: 'Pustaka materi', path: 'pustaka' }, { icon: Box, label: 'Lab 3D', path: 'lab' }, { icon: CircleHelp, label: 'Klinik kesalahan', path: 'klinik' }, { icon: FolderOpen, label: 'Portofolio', path: 'portofolio' }, { icon: ChartNoAxesCombined, label: 'Progres saya', path: 'progres' }];
const empty: StudyData = { user: null, teacher: false, events: [], submissions: [], profiles: [], settings: {} };
function Navigation({ route }: {
    route: string;
}) { const { setOpenMobile } = useSidebar(); return <SidebarMenu>{nav.map(({ icon: Icon, label, path }) => <SidebarMenuItem key={label}><SidebarMenuButton asChild isActive={route.split('/')[0] === path} className="h-11 px-3 text-[14px]"><a href={`#${path}`} onClick={() => setOpenMobile(false)}><Icon size={18}/><span>{label}</span></a></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>; }
function TeacherNavigation({ route }: { route: string }) {
    const { setOpenMobile } = useSidebar();
    return <SidebarGroup className="px-4 mt-3">
        <SidebarGroupLabel className="mb-2 sidebar-section-label tracking-widest text-xs">RUANG GURU</SidebarGroupLabel>
        <SidebarMenu><SidebarMenuItem>
            <SidebarMenuButton asChild isActive={route === 'guru'} className="h-11 px-3 text-[14px]">
                <a href="#guru" aria-current={route === 'guru' ? 'page' : undefined} onClick={() => setOpenMobile(false)}><GraduationCap size={18}/><span>Panel guru</span></a>
            </SidebarMenuButton>
        </SidebarMenuItem><SidebarMenuItem>
            <SidebarMenuButton asChild isActive={route === 'guru/dokumen'} className="h-11 px-3 text-[14px]">
                <a href="#guru/dokumen" aria-current={route === 'guru/dokumen' ? 'page' : undefined} onClick={() => setOpenMobile(false)}><FolderOpen size={18}/><span>Perangkat ajar</span></a>
            </SidebarMenuButton>
        </SidebarMenuItem></SidebarMenu>
    </SidebarGroup>;
}
export default function Parametra() {
    const [route, setRoute] = useState(''), [data, setData] = useState<StudyData>(empty), [loading, setLoading] = useState(true), [error, setError] = useState(''), [search, setSearch] = useState('');
    const refreshVersion = useRef(0);
    const refresh = useCallback(async () => { const version = ++refreshVersion.current; try {
        const r = await fetch('/api/study', { cache: 'no-store' });
        const d = await r.json() as StudyData & {
            error?: string;
        };
        if (!r.ok)
            throw new Error(d.error);
        if (version !== refreshVersion.current) return;
        setData(d);
        setError('');
    }
    catch (e) {
        if (version !== refreshVersion.current) return;
        setData(empty);
        setError(e instanceof Error ? e.message : 'Penyimpanan belum tersedia.');
    }
    finally {
        if (version === refreshVersion.current) setLoading(false);
    } }, []);
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_LOCAL_EDITION !== 'true') return;
        function changed() {
            // Clear previous pupil UI immediately; stale refreshes cannot restore it.
            ++refreshVersion.current;
            setData(empty); setError(''); setLoading(true);
            void refresh();
        }
        function otherTab(event: StorageEvent) {
            if (event.key === studentIdentityKey(window.location.pathname) || event.key === null) changed();
        }
        window.addEventListener(studentIdentityChanged, changed);
        window.addEventListener('storage', otherTab);
        return () => { window.removeEventListener(studentIdentityChanged, changed); window.removeEventListener('storage', otherTab); };
    }, [refresh]);
    useEffect(() => { const update = () => { const raw = window.location.hash.slice(1); const h = raw === 'jobsheet' ? 'modul/9/jobsheet' : raw; if (raw === 'jobsheet') window.history.replaceState(null, '', '#'+h); if (h === 'main')
        return; setRoute(h); setSearch(''); window.scrollTo({ top: 0, behavior: 'instant' }); }; update(); window.addEventListener('hashchange', update); void refresh(); return () => window.removeEventListener('hashchange', update); }, [refresh]);
    const save: SaveAction = async (payload, quiet = false) => { try {
        const r = await fetch('/api/study', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Parametra-Student': data.profiles[0]?.id || '' }, body: JSON.stringify(payload) });
        const result = await r.json() as Record<string, unknown> & {
            error?: string;
        };
        if (!r.ok)
            throw new Error(result.error);
        await refresh();
        if (!quiet)
            toast.success('Tersimpan.');
        return result;
    }
    catch (e) {
        toast.error(e instanceof Error ? e.message : 'Belum tersimpan. Coba lagi.');
        return null;
    } };
    useEffect(() => { type Tool = {
        name: string;
        description: string;
        inputSchema: object;
        annotations: {
            readOnlyHint: boolean;
        };
        execute: (x: unknown) => unknown;
    }; const context = (document as Document & {
        modelContext?: {
            registerTool: (tool: Tool, options: {
                signal: AbortSignal;
            }) => unknown;
        };
    }).modelContext; if (!context)
        return; const lifecycle = new AbortController(); const register = (tool: Tool) => { try {
        Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => { });
    }
    catch { } }; register({ name: 'read_learning_progress', description: 'Read the current signed-in learner progress and available modules without changing data.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => ({ signedIn: !!data.user, modules: lessons.map(m => ({ id: m.id, title: m.title, progress: progressFor(data.events, m.id) })) }) }); register({ name: 'navigate_learning_module', description: 'Open a learning module in the visible interface. Does not complete or save progress.', inputSchema: { type: 'object', properties: { module: { type: 'integer', enum: lessons.map(m => m.id) } }, required: ['module'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (value) => { const id = (value as {
            module?: unknown;
        })?.module; if (!Number.isInteger(id) || !lessonById(Number(id)))
            throw new Error('Pilih ID modul yang tersedia pada jalur belajar.'); window.location.hash = `modul/${id}`; setRoute(`modul/${id}`); return { openedModule: id, title: lessonById(Number(id))!.title }; } }); return () => lifecycle.abort(); }, [data]);
    const title = route.startsWith('modul/') ? 'Praktik terpandu' : nav.find(n => n.path === route)?.label || (route === 'guru/dokumen' ? 'Perangkat ajar' : route === 'guru' ? 'Ruang guru' : 'Halaman');
    const moduleRoute = /^modul\/(\d+)(?:\/(part3d|materi|jobsheet|dokumen))?$/.exec(route);
    const currentLesson = moduleRoute ? lessonById(Number(moduleRoute[1])) : undefined;
    const lessonSection = (moduleRoute?.[2] || 'materi') as 'part3d' | 'materi' | 'jobsheet' | 'dokumen';
    const completed = lessons.filter(m => progressFor(data.events, m.id) === 100).length;
    const cards = (items = lessons) => <div className="course-grid">{items.map(m => <article className="course-card" key={m.id}>
      <a className="course-main" href={`#modul/${m.id}`} aria-label={`Buka modul ${m.title}`}>
        <div className={`course-top tint-${m.id % 3}`}><span className="eyebrow">MODUL {String(m.order).padStart(2, '0')}</span>{m.stage === 'assembly' ? <Layers /> : m.stage === 'intro' || m.stage === 'sketch' ? <PencilRuler /> : <Box />}<span className="module-meeting">{m.meeting}</span></div>
        <div className="course-body"><h3>{m.title}</h3><p>{m.subtitle}</p><Progress className="mt-5 h-1.5" value={progressFor(data.events, m.id)} aria-label={`Progres ${m.title}`}/><div className="course-footer"><span>{progressFor(data.events, m.id)}% langkah diperiksa</span><ArrowRight size={16}/></div></div>
      </a>
      <div className="module-card-options" aria-label={`Pilihan ${m.title}`}>
        <a href={`#modul/${m.id}/part3d`}>{m.stage === 'intro' ? <Monitor size={17}/> : m.stage === 'sketch' ? <PencilRuler size={17}/> : <Box size={17}/>}<span>{m.stage === 'intro' ? 'Interface Autodesk Fusion' : m.stage === 'sketch' ? 'Preview Sketch 2D' : 'Part 3D'}</span></a>
        <a href={`#modul/${m.id}/materi`}><BookOpen size={17}/><span>Modul pembelajaran</span></a>
        <a href={`#modul/${m.id}/jobsheet`}><FolderOpen size={17}/><span>Jobsheet PDF</span></a>
        <a href={`#modul/${m.id}/dokumen`}><Library size={17}/><span>Bahan belajar</span></a>
      </div>
    </article>)}</div>;
    return <SidebarProvider style={{ '--sidebar-width': '248px' } as React.CSSProperties}><a href="#main" className="skip">Lewati ke isi</a><Sidebar><SidebarHeader className="p-6 pb-8"><a href="#" className="brand"><span className="mark"><Box size={25}/></span><span>Parametra Lab<small>FUSION LEARNING STUDIO</small></span></a></SidebarHeader><SidebarContent><SidebarGroup className="px-4"><SidebarGroupLabel className="mb-2 sidebar-section-label tracking-widest text-xs">RUANG BELAJAR</SidebarGroupLabel><Navigation route={route}/></SidebarGroup><TeacherNavigation route={route}/></SidebarContent><SidebarFooter className="p-5"><div className="subject-footer-card"><strong>TFLM–Perancangan</strong><span>XI · Teknik Pemesinan</span></div></SidebarFooter></Sidebar><SidebarInset><header className="app-topbar"><div className="crumb"><SidebarTrigger /><span className="optional">Parametra Lab</span><ChevronRight size={14}/><span className="text-[#22364e] font-medium">{title}</span></div><StudentSignIn />{data.user ? <div className="account"><a href="#portofolio" className="user-name">{data.profiles?.[0]?.name || data.user.name}</a><a className="action ghost small" aria-label="Keluar" href="/signout-with-chatgpt?return_to=/"><LogOut size={16}/></a></div> : <a href={`/signin-with-chatgpt?return_to=${encodeURIComponent('/#' + route)}`} target="_top" className="action ghost small">Masuk <ArrowUpRight size={15}/></a>}</header><main key={data.profiles[0]?.id || 'guest'} className="workspace" id="main" tabIndex={-1}><DriveAutoSync/>{error && <div className="notice warning" role="alert">{error} <button className="text-link" onClick={() => void refresh()}>Coba lagi</button></div>}{loading && <Skeleton className="h-2 w-full mb-3"/>}
 {route === '' && <><div className="page-intro home-intro"><div><div className="eyebrow muted mb-3">RUANG PRAKTIK DIGITAL · TEKNIK PEMESINAN</div><h1>Rancang idemu.<br/><span>Wujudkan dengan <em>Fusion.</em></span></h1><p>Pelajari langkahnya. Rancang komponennya. Lihat geraknya.</p></div><div className="blueprint-emblem" aria-hidden="true"><span className="emblem-orbit"/><Box size={64} strokeWidth={1.1}/><span className="emblem-label">SKETCH / MODEL / ASSEMBLY</span></div></div><div className="dashboard-grid"><section className="mission"><div className="mission-heading"><span className="eyebrow">PENGENALAN → SKETCH → PART → ASSEMBLY</span><h2>Dari sketch pertama, hingga rakitan bergerak.</h2><p>Kenali Fusion, kuasai sketch 2D, buat part 3D, lalu susun assembly piston.</p></div><div className="mission-video"><div className="simulation-bar"><span><span className="simulation-dot"/> PREVIEW ASSEMBLY</span><span>PISTON · FUSION</span></div><video src={pistonVideoUrl()} autoPlay loop muted playsInline controls aria-label="Video animasi Assembly Piston"/></div><div className="mission-bottom"><a className="action lime" href={`#modul/${lessons.find(m => progressFor(data.events, m.id) < 100)?.id ?? lessons[0].id}`}>{completed ? 'Lanjutkan belajar' : 'Mulai perjalanan'} <ArrowRight size={18}/></a><p>4 tahap · 11 jobsheet latihan · 2 acuan</p></div></section><aside><section className="panel"><div className="panel-head"><h2>Peta perjalananmu</h2><Layers size={19}/></div>{stages.map((s, i) => [String(i + 1).padStart(2, '0'), s.title, s.detail]).map(([n, t, d]) => <div className="learning-line" key={n}><span className="number">{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}</section><div className="tip mt-5"><Wrench size={20}/><h3 className="mt-3">Belajar sesuai ritmemu.</h3><p>Buka tutorial di HP, praktikkan di komputer. Petunjuk bertingkat siap membantu saat kamu menemui kendala.</p></div></aside></div><div className="section-title"><div><h2>Satu langkah lebih mahir.</h2><p>Mulai dari dasar, lanjutkan sampai rakitanmu bergerak.</p></div><a href="#modul" className="text-link">Semua modul <ArrowRight size={16}/></a></div>{cards()}<div className="notice mt-6">Jelajahi materi tanpa masuk. Masuk untuk menyimpan progres, hasil kuis, dan karya. Progres berasal dari pemeriksaan mandiri; keterampilan dinilai guru melalui hasil praktik.</div></>}
 {route === 'modul' && <><Intro kicker="JALUR BELAJAR" title="Dari sketsa hingga bergerak." text="Ikuti empat tahap: pengenalan Fusion, sketch 2D, membuat part 3D, dan assembly. Mulai dari Interface Autodesk Fusion, lalu jelajahi pratinjau, modul pembelajaran, jobsheet, dan bahan belajar sesuai tahapmu."/>{cards()}</>}
 {currentLesson && <LessonView key={currentLesson.id} lesson={currentLesson} section={lessonSection} data={data} save={save}/>}
 {route === 'pustaka' && <ResourceLibrary />}
 {route === 'guru/dokumen' && (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' || data.teacher ? <ResourceLibrary audience="teacher"/> : <section className="panel"><h1>Perangkat ajar guru</h1><p className="mt-4">Masuk dengan akun guru yang telah diberi akses untuk membuka perangkat pembelajaran.</p><a className="text-link mt-4" href="#guru">Buka ruang guru <ArrowRight size={16}/></a></section>)}
 {route === 'lab' && <LabView owner={data.profiles[0]?.id || data.user?.email || 'guest'} ownerName={data.profiles[0]?.name}/>}{route === 'portofolio' && <PortfolioView data={data} save={save} refresh={refresh}/>}{route === 'progres' && <ProgressView data={data}/>}{route === 'guru' && (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? <LocalTeacherPanel /> : <TeacherView data={data} save={save}/>)}
 {route === 'glosarium' && <><Intro kicker="KAMUS KECIL CAD" title="Kenali istilahnya." text="Arti istilah yang sering muncul di Fusion dan jobsheet."/><label className="field search-label">Cari istilah<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Misalnya: constraint, joint, mesh…" type="search"/></label><div className="glossary-grid">{glossary.filter(([t, d]) => (t + ' ' + d).toLowerCase().includes(search.toLowerCase())).map(([t, d]) => <article className="panel" key={t}><h3>{t}</h3><p className="mt-3">{d}</p></article>)}</div>{!glossary.some(([t, d]) => (t + ' ' + d).toLowerCase().includes(search.toLowerCase())) && <p className="notice">Istilah belum ditemukan. Coba kata lain.</p>}</>}
 {route === 'klinik' && <><Intro kicker="BERHENTI SEJENAK, CARI SEBABNYA" title="Kendala bukan jalan buntu." text="Periksa gejalanya, pahami penyebab yang mungkin, lalu coba perbaikan berikut."/><label className="field search-label">Cari kendala<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Misalnya: sketch bergeser, joint…" type="search"/></label><div className="stack">{clinic.filter(([t, d]) => (t + ' ' + d).toLowerCase().includes(search.toLowerCase())).map(([t, d, f, m]) => <details className="panel clinic" key={t}><summary>{t}<CircleHelp size={18}/></summary><div className="mt-4"><p><b>Kemungkinan penyebab:</b> {d}</p><p className="mt-3"><b>Coba langkah ini:</b> {f}</p><a className="text-link mt-4" href={`#modul/${m}`}>Buka modul terkait <ArrowRight size={16}/></a></div></details>)}</div>{!clinic.some(([t, d]) => (t + ' ' + d).toLowerCase().includes(search.toLowerCase())) && <p className="notice">Kendala belum ditemukan. Catat gejala dan tanyakan kepada guru.</p>}</>}
 {!['', 'modul', 'pustaka', 'lab', 'portofolio', 'progres', 'guru', 'guru/dokumen', 'glosarium', 'klinik'].includes(route) && !currentLesson && <div className="panel"><h1>Halaman tidak ditemukan.</h1><a href="#" className="action mt-5">Kembali ke beranda</a></div>}
 <footer className="page-footer"><span>Parametra Lab · Dari jobsheet hingga model bergerak.</span><span>SMK Muhammadiyah 3 Yogyakarta</span></footer></main><MobileNavigation route={route}/></SidebarInset><Toaster richColors position="bottom-right"/></SidebarProvider>;
}
export function Intro({ kicker, title, text }: {
    kicker: string;
    title: string;
    text: string;
}) { return <div className="page-intro"><div><div className="eyebrow muted mb-3">{kicker}</div><h1>{title}</h1><p>{text}</p></div></div>; }
