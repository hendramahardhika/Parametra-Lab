"use client";
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from 'react';
import { Box, MousePointer2, Hand, Minus, RectangleHorizontal, Circle, Ruler, Trash2, Undo2, Redo2, Save, FolderOpen, FilePlus2, Download, Maximize2, Minimize2, MoveUp, PencilRuler, ChevronRight, Check, Magnet, Grid2X2, ZoomIn, ZoomOut, Scan, CircleHelp, X, Layers, Copy, Play } from 'lucide-react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { toast } from 'sonner';
import { cadDraftKey, createCadGeometry, emptyProject, entityName, entityPoints, resolveSketchSnap, round, sketchBounds, sketchSvg, validateProject, type CadProject, type Point, type SketchEntity, type SketchSnap } from '@/lib/cad-workbench';
import WorkbenchView from './cad-workbench-view';
import { ModelToolbar, ModelCommandPanel, ModelCommandIcon } from './cad-model-commands';
import { commandNames, type ModelCommand } from '@/lib/cad-modeling';
import type { ExamplePracticeRequest } from '@/lib/cad-command-examples';

type Tool = 'select' | 'pan' | 'line' | 'rect' | 'circle' | 'dimension';
const tools = [
    { id: 'select', label: 'Pilih', icon: MousePointer2, key: 'V' }, { id: 'pan', label: 'Geser', icon: Hand, key: 'H' },
    { id: 'line', label: 'Garis', icon: Minus, key: 'L' }, { id: 'rect', label: 'Persegi', icon: RectangleHorizontal, key: 'R' },
    { id: 'circle', label: 'Lingkaran', icon: Circle, key: 'C' }, { id: 'dimension', label: 'Ukuran', icon: Ruler, key: 'D' },
] as const;
const tips: Record<Tool, string> = { select: 'Klik objek untuk memilih. Seret objek untuk memindahkannya.', pan: 'Seret kanvas untuk menggeser pandangan.', line: 'Klik titik awal lalu titik akhir. Tahan Shift untuk garis horizontal / vertikal.', rect: 'Klik dua sudut berlawanan, atau klik lalu seret untuk membuat persegi.', circle: 'Klik pusat lingkaran, lalu klik tepinya untuk menentukan radius.', dimension: 'Klik objek, lalu ubah ukuran tepatnya pada panel Properti.' };
const id = () => `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
function download(content: BlobPart, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function Numeric({ label, value, min = -10000, max = 10000, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (n: number) => void }) {
    const [draft, setDraft] = useState(String(round(value)));
    useEffect(() => setDraft(String(round(value))), [value]);
    function apply() {
        const n = Number(draft);
        if (!draft.trim() || !Number.isFinite(n) || n < min || n > max) { setDraft(String(round(value))); toast.error(`${label}: isi angka ${min} hingga ${max} mm.`); return; }
        if (n !== value) onChange(round(n));
    }
    return <label className="cad-number"><span>{label}</span><div><input type="number" min={min} max={max} step="0.1" value={draft} onChange={e => setDraft(e.target.value)} onBlur={apply} onKeyDown={e => { if (e.key === 'Enter') { apply(); e.currentTarget.blur(); } }}/><small>mm</small></div></label>;
}
function Entity({ entity: e, selected = false }: { entity: SketchEntity; selected?: boolean }) {
    const props = { 'data-entity': e.id, className: `cad-entity${selected ? ' selected' : ''}`, vectorEffect: 'non-scaling-stroke' as const };
    if (e.kind === 'circle') return <circle {...props} cx={e.x} cy={e.y} r={e.a}/>;
    if (e.kind === 'rect') return <rect {...props} x={e.x} y={e.y} width={e.a} height={e.b}/>;
    return <g data-entity={e.id}><line x1={e.x} y1={e.y} x2={e.a} y2={e.b} stroke="transparent" strokeWidth={14} vectorEffect="non-scaling-stroke"/><line {...props} x1={e.x} y1={e.y} x2={e.a} y2={e.b}/></g>;
}
function SnapIndicator({ target, scale: s }: { target: SketchSnap; scale: number }) {
    const x = target.x, y = -target.y;
    return <g pointerEvents="none" aria-hidden="true" data-snap-kind={target.kind}>
        <circle cx={x} cy={y} r={10 * s} fill="#fff" fillOpacity={.65} stroke="#244b70" strokeOpacity={.18} strokeWidth={4 * s}/>
        {target.kind === 'endpoint' ? <rect x={x - 5 * s} y={y - 5 * s} width={10 * s} height={10 * s} fill="#edf8ff" stroke="#1685e3" strokeWidth={1.5 * s}/> : target.kind === 'midpoint' ? <path d={`M ${x} ${y - 6 * s} l ${6 * s} ${11 * s} h ${-12 * s} Z`} fill="#edf8ff" stroke="#1685e3" strokeWidth={1.5 * s}/> : <circle cx={x} cy={y} r={5.5 * s} fill="#fff" stroke="#1685e3" strokeWidth={1.8 * s}/>}
        <circle cx={x} cy={y} r={1.8 * s} fill="#1685e3"/>
        <rect x={x + 15 * s} y={y - 26 * s} width={(target.label.length * 5.7 + 15) * s} height={21 * s} rx={4 * s} fill="#fff" stroke="#c5dcef" strokeWidth={s}/>
        <text x={x + 22 * s} y={y - 12 * s} fill="#245d92" fontSize={10 * s} fontFamily="Segoe UI, Arial, sans-serif">{target.label}</text>
    </g>;
}
function Dimension({ e, scale }: { e: SketchEntity; scale: number }) {
    const s = scale, font = 11 * s, offset = 15 * s;
    const style = { fontSize: font, strokeWidth: s };
    if (e.kind === 'circle') return <g className="cad-dimension" style={style}><line x1={e.x - e.a} y1={-e.y} x2={e.x + e.a} y2={-e.y}/><text x={e.x} y={-e.y - 4 * s} textAnchor="middle">Ø {round(e.a * 2)}</text></g>;
    if (e.kind === 'line') return <g className="cad-dimension" style={style}><text x={(e.x + e.a) / 2} y={-(e.y + e.b) / 2 - 7 * s} textAnchor="middle">{round(Math.hypot(e.a - e.x, e.b - e.y))}</text></g>;
    return <g className="cad-dimension" style={style}><path d={`M ${e.x} ${-e.y + 4 * s} v ${offset} M ${e.x + e.a} ${-e.y + 4 * s} v ${offset} M ${e.x} ${-e.y + offset} h ${e.a}`}/><text x={e.x + e.a / 2} y={-e.y + offset - 3 * s} textAnchor="middle">{round(e.a)}</text><line x1={e.x + e.a + offset} y1={-e.y} x2={e.x + e.a + offset} y2={-e.y - e.b}/><text x={e.x + e.a + offset + 4 * s} y={-e.y - e.b / 2}>{round(e.b)}</text></g>;
}

export default function CadWorkbench({ owner = 'guest', ownerName, practiceRequest, onTutorial }: { owner?: string; ownerName?: string; practiceRequest?: ExamplePracticeRequest | null; onTutorial?: () => void }) {
    const [history, setHistory] = useState<CadProject[]>([emptyProject()]), [cursor, setCursor] = useState(0);
    const project = history[cursor];
    const [titleDraft, setTitleDraft] = useState(project.name);
    useEffect(() => setTitleDraft(project.name), [project.name]);
    const [loaded, setLoaded] = useState(false), [saveState, setSaveState] = useState('Memuat…'), [storageBlocked, setStorageBlocked] = useState(false);
    const [tool, setTool] = useState<Tool>('select'), [mode, setMode] = useState<'sketch' | 'solid'>('sketch'), [selected, setSelected] = useState('');
    const [start, setStart] = useState<Point | null>(null), [pointer, setPointer] = useState<Point>({ x: 0, y: 0 }), [moving, setMoving] = useState<SketchEntity | null>(null);
    const [hoverSnap, setHoverSnap] = useState<SketchSnap | null>(null);
    const [command, setCommand] = useState<ModelCommand | null>(null), [preview, setPreview] = useState<CadProject | null>(null);
    const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
    const propertiesId = useId();
    useEffect(() => { if (command) setMobilePropertiesOpen(true); }, [command]);
    const practiced = useRef<number | null>(null);
    const [snap, setSnap] = useState(true), [grid, setGrid] = useState(true), [dimensions, setDimensions] = useState(true), [help, setHelp] = useState(false), [expanded, setExpanded] = useState(false);
    const [view, setView] = useState({ x: 0, y: 0, width: 180 }), [size, setSize] = useState({ width: 800, height: 550 });
    const svg = useRef<SVGSVGElement>(null), area = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), latest = useRef(project);
    const drag = useRef<{ type: 'pan' | 'move' | 'draw'; pixel: Point; world: Point; view: typeof view; entity?: SketchEntity } | null>(null);
    const active = project.entities.find(e => e.id === selected);
    latest.current = project;
    const height = view.width * size.height / size.width, scale = view.width / size.width;
    const box = { x: view.x - view.width / 2, y: -view.y - height / 2, w: view.width, h: height };
    useEffect(() => setHoverSnap(null), [snap, tool, mode, view, size]);
    const displayed = preview || project;
    const featureName = commandNames[project.operation?.kind || 'extrude'];
    const result = useMemo(() => {
        if (!displayed.extruded) return { geometry: null, error: '' };
        try { return { geometry: createCadGeometry(displayed), error: '' }; } catch (e) { return { geometry: null, error: (e as Error).message }; }
    }, [displayed.entities, displayed.depth, displayed.plane, displayed.extruded, displayed.operation, displayed.modifier]);
    useEffect(() => () => result.geometry?.dispose(), [result]);
    function commit(next: CadProject) {
        try { next = validateProject(next); } catch (e) { toast.error((e as Error).message); return; }
        if (JSON.stringify(next) === JSON.stringify(project)) return;
        const previous = history.slice(0, cursor + 1).slice(-59); setHistory([...previous, next]); setCursor(previous.length);
    }
    function persist(p = latest.current) {
        try { localStorage.setItem(cadDraftKey(window.location.pathname, owner), JSON.stringify(p)); setSaveState('Tersimpan di browser'); return true; }
        catch { setSaveState('Belum tersimpan · unduh proyek'); return false; }
    }
    useEffect(() => {
        try {
            const raw = localStorage.getItem(cadDraftKey(window.location.pathname, owner));
            if (raw) { const p = validateProject(JSON.parse(raw)); setHistory([p]); setCursor(0); fit(p); }
        } catch { setStorageBlocked(true); setSaveState('Draf gagal dibaca · simpan salinan JSON'); toast.error('Draf tersimpan tidak dapat dibaca. Gunakan Unduh proyek untuk menyimpan latihan baru.'); }
        setLoaded(true);
        // Each owner is mounted independently by LabView.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner]);
    useEffect(() => {
        if (!loaded || storageBlocked) return;
        setSaveState('Menyimpan…');
        const timer = setTimeout(() => persist(project), 450);
        return () => { clearTimeout(timer); persist(project); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project, loaded, storageBlocked]);
    useEffect(() => {
        const el = area.current; if (!el) return;
        const resize = new ResizeObserver(entries => { const r = entries[0].contentRect; setSize({ width: Math.max(1, r.width), height: Math.max(1, r.height) }); }); resize.observe(el);
        const wheel = (e: WheelEvent) => { if (!svg.current) return; e.preventDefault(); setView(v => ({ ...v, width: Math.max(10, Math.min(30000, v.width * (e.deltaY > 0 ? 1.12 : .89))) })); };
        el.addEventListener('wheel', wheel, { passive: false });
        return () => { resize.disconnect(); el.removeEventListener('wheel', wheel); };
    }, []);
    function fit(p = project) { const b = sketchBounds(p.entities); setView({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, width: Math.max(80, (b.maxX - b.minX) * 1.5, (b.maxY - b.minY) * size.width / size.height * 1.5) }); }
    function cancel() { setStart(null); setMoving(null); setHoverSnap(null); setCommand(null); setPreview(null); drag.current = null; }
    function choose(t: Tool) { cancel(); setMode('sketch'); setTool(t); }
    function undo() { cancel(); if (cursor) setCursor(cursor - 1); }
    function redo() { cancel(); if (cursor < history.length - 1) setCursor(cursor + 1); }
    function remove() { if (!active) return; commit({ ...project, entities: project.entities.filter(e => e.id !== selected) }); setSelected(''); }
    function changeEntity(update: Partial<SketchEntity>) { if (active) commit({ ...project, entities: project.entities.map(e => e.id === active.id ? { ...e, ...update } : e) }); }
    function duplicate() { if (!active) return; const e = { ...active, id: id(), x: active.x + 10, y: active.y + 10, ...(active.kind === 'line' ? { a: active.a + 10, b: active.b + 10 } : {}) }; commit({ ...project, entities: [...project.entities, e] }); setSelected(e.id); }
    function extrude() {
        const next: CadProject = { ...project, operation: { kind: 'extrude' }, modifier: undefined, extruded: true };
        try { const g = createCadGeometry(next); g.dispose(); commit(next); cancel(); setMode('solid'); toast.success('Profil berhasil dibentuk menjadi model 3D.'); }
        catch (e) { toast.error((e as Error).message); }
    }
    function openCommand(c: ModelCommand) { cancel(); setMode('solid'); setCommand(c); }
    function applyCommand(p: CadProject) {
        try { const g = createCadGeometry(p); g.dispose(); commit(p); cancel(); setMode('solid'); toast.success(`${commandNames[command || 'extrude']} diterapkan.`); }
        catch (e) { toast.error((e as Error).message); }
    }
    function samplePoint(e: ReactPointerEvent<SVGSVGElement>, snapTo = true) {
        const r = e.currentTarget.getBoundingClientRect();
        const p = { x: box.x + (e.clientX - r.left) / r.width * box.w, y: -box.y - (e.clientY - r.top) / r.height * box.h };
        const alignment = snapTo && e.shiftKey && start && tool === 'line' ? Math.abs(p.x - start.x) > Math.abs(p.y - start.y) ? { axis: 'y' as const, value: start.y } : { axis: 'x' as const, value: start.x } : undefined;
        return resolveSketchSnap(p, project.entities, scale, snap && snapTo, alignment);
    }
    function point(e: ReactPointerEvent<SVGSVGElement>, snapTo = true): Point { return samplePoint(e, snapTo).point; }
    function makeEntity(a: Point, b: Point): SketchEntity {
        if (tool === 'rect') return { id: id(), kind: 'rect', x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), a: round(Math.abs(b.x - a.x)), b: round(Math.abs(b.y - a.y)) };
        if (tool === 'circle') return { id: id(), kind: 'circle', x: a.x, y: a.y, a: round(Math.hypot(b.x - a.x, b.y - a.y)), b: 0 };
        return { id: id(), kind: 'line', x: a.x, y: a.y, a: b.x, b: b.y };
    }
    function finish(b: Point, a = start) {
        if (!a || Math.hypot(b.x - a.x, b.y - a.y) < .1) return;
        const entity = makeEntity(a, b);
        if (entity.kind === 'rect' && (entity.a < .1 || entity.b < .1)) return;
        commit({ ...project, entities: [...project.entities, entity] }); setSelected(entity.id); setStart(null); drag.current = null;
    }
    function down(e: ReactPointerEvent<SVGSVGElement>) {
        if (e.button !== 0 && e.button !== 1) return;
        e.preventDefault(); e.currentTarget.focus();
        const sample = samplePoint(e), p = sample.point; setPointer(p); setHoverSnap(tool === 'pan' || e.button === 1 ? null : sample.target);
        const pixel = { x: e.clientX, y: e.clientY };
        if (tool === 'pan' || e.button === 1) { drag.current = { type: 'pan', pixel, world: p, view }; e.currentTarget.setPointerCapture(e.pointerId); return; }
        if (tool === 'select' || tool === 'dimension') {
            const hit = (e.target as Element).closest('[data-entity]')?.getAttribute('data-entity') || '';
            setSelected(hit);
            const entity = project.entities.find(o => o.id === hit);
            if (entity && tool === 'select') { drag.current = { type: 'move', pixel, world: point(e, false), view, entity }; e.currentTarget.setPointerCapture(e.pointerId); }
            return;
        }
        if (start) { finish(p); return; }
        setStart(p); drag.current = { type: 'draw', pixel, world: p, view }; e.currentTarget.setPointerCapture(e.pointerId);
    }
    function move(e: ReactPointerEvent<SVGSVGElement>) {
        const sample = samplePoint(e), p = sample.point; setPointer(p); setHoverSnap(tool === 'pan' || drag.current?.type === 'move' || drag.current?.type === 'pan' ? null : sample.target);
        const d = drag.current; if (!d) return;
        if (d.type === 'pan') setView({ ...d.view, x: d.view.x - (e.clientX - d.pixel.x) * scale, y: d.view.y + (e.clientY - d.pixel.y) * scale });
        if (d.type === 'move' && d.entity) {
            const raw = point(e, false); let dx = raw.x - d.world.x, dy = raw.y - d.world.y;
            if (snap) { dx = Math.round(dx); dy = Math.round(dy); }
            const o = d.entity; setMoving({ ...o, x: round(o.x + dx), y: round(o.y + dy), ...(o.kind === 'line' ? { a: round(o.a + dx), b: round(o.b + dy) } : {}) });
        }
    }
    function up(e: ReactPointerEvent<SVGSVGElement>) {
        const d = drag.current; if (!d) return;
        if (d.type === 'move' && moving) { commit({ ...project, entities: project.entities.map(o => o.id === moving.id ? moving : o) }); setMoving(null); }
        if (d.type === 'draw' && Math.hypot(e.clientX - d.pixel.x, e.clientY - d.pixel.y) > 5) finish(point(e), d.world);
        drag.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
    function shortcuts(e: KeyboardEvent<HTMLElement>) {
        if ((e.target as HTMLElement).closest('input,textarea,select')) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); if (!storageBlocked) persist(); return; }
        if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
        if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (k === 'escape') { cancel(); setTool('select'); setHelp(false); return; }
        if (k === 'delete' || k === 'backspace') { e.preventDefault(); remove(); return; }
        const next = tools.find(t => t.key.toLowerCase() === k); if (next) { e.preventDefault(); choose(next.id); }
        if (k === 'e') { e.preventDefault(); mode === 'solid' ? openCommand('extrude') : extrude(); }
        if (mode === 'solid' && project.extruded && (!project.operation || project.operation.kind === 'extrude')) {
            if (k === 'q') { e.preventDefault(); openCommand('presspull'); }
            if (k === 'f') { e.preventDefault(); openCommand('fillet'); }
        }
    }
    const filename = (project.name.replace(/[^\p{L}\p{N}_-]/gu, '-').slice(0, 60) || 'latihan');
    async function open(file?: File) {
        if (!file) return;
        try {
            if (file.size > 1024 * 1024) throw Error('File proyek maksimal 1 MB.');
            const p = validateProject(JSON.parse(await file.text()));
            commit(p); cancel(); setSelected(''); setMode('sketch'); fit(p); toast.success('Proyek dibuka. Undo tersedia untuk kembali ke latihan sebelumnya.');
        } catch (e) { toast.error((e as Error).message || 'File proyek tidak dapat dibaca.'); }
    }
    function exportStl() {
        try {
            const geometry = createCadGeometry(project), material = new THREE.MeshBasicMaterial();
            try { const mesh = new THREE.Mesh(geometry, material); mesh.updateMatrixWorld(true); const bytes = new STLExporter().parse(mesh, { binary: true }); download(new Uint8Array(bytes.buffer as ArrayBuffer), filename + '.stl', 'application/octet-stream'); }
            finally { geometry.dispose(); material.dispose(); }
        } catch (e) { toast.error((e as Error).message); }
    }
    function example() {
        const p: CadProject = { ...emptyProject(), name: 'Latihan plat berlubang', entities: [
            { id: id(), kind: 'rect', x: -40, y: -25, a: 80, b: 50 },
            { id: id(), kind: 'circle', x: -25, y: 0, a: 6, b: 0 }, { id: id(), kind: 'circle', x: 25, y: 0, a: 6, b: 0 },
        ] }; commit(p); setMode('sketch'); cancel(); setSelected(''); fit(p);
    }
    useEffect(() => {
        if (!loaded || !practiceRequest || practiced.current === practiceRequest.token) return;
        practiced.current = practiceRequest.token;
        const p = validateProject(practiceRequest.project);
        commit(p); cancel(); setSelected(''); fit(p); setMode('solid'); setCommand(practiceRequest.command);
        toast.success(`Contoh ${commandNames[practiceRequest.command]} dibuka. Ubah parameter lalu Terapkan; Undo tersedia.`);
        // Import only once after this student's own draft has loaded.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded, practiceRequest]);
    const shown = project.entities.map(e => moving?.id === e.id ? moving : e);
    const draft = start && ['rect', 'circle', 'line'].includes(tool) ? makeEntity(start, pointer) : null;
    const gridStep = view.width > 3000 ? 500 : view.width > 800 ? 100 : view.width > 300 ? 20 : 5;
    return <section className={`cad-workbench${expanded ? ' cad-expanded' : ''}`} aria-label="Editor latihan CAD" onKeyDown={shortcuts}>
        <div className="cad-project-bar"><div className="cad-project-title"><span className="cad-brand-icon"><PencilRuler size={22}/></span><div><span className="cad-eyebrow">PARAMETRA / DESIGN STUDIO</span><input aria-label="Nama proyek" value={titleDraft} maxLength={80} onChange={e => setTitleDraft(e.target.value)} onBlur={() => { if (titleDraft.trim()) commit({ ...project, name: titleDraft.trim() }); else setTitleDraft(project.name); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/></div></div><div className="cad-project-actions">
            {onTutorial && <button className="cad-tutorial-shortcut" onClick={onTutorial}><Play size={16}/><span>Contoh animasi</span></button>}
            <button title="Proyek baru (dapat di-undo)" onClick={() => { commit(emptyProject()); cancel(); setSelected(''); setMode('sketch'); fit(emptyProject()); }}><FilePlus2 size={17}/><span>Baru</span></button>
            <button onClick={() => fileInput.current?.click()}><FolderOpen size={17}/><span>Buka</span></button><input ref={fileInput} type="file" accept=".json" hidden aria-label="Buka proyek Lab 3D" onChange={e => { void open(e.target.files?.[0]); e.target.value = ''; }}/>
            <button disabled={storageBlocked || !loaded || !!command} onClick={() => { if (persist()) toast.success('Proyek tersimpan di browser ini.'); else toast.error('Penyimpanan browser tidak tersedia. Gunakan Unduh proyek.'); }}><Save size={17}/><span>Simpan</span></button>
            <button className="cad-export" disabled={!!command} onClick={() => download(JSON.stringify(project, null, 2), filename + '.parametra.json', 'application/json')}><Download size={17}/><span>Unduh proyek</span></button>
            <button aria-label={expanded ? 'Keluar layar luas' : 'Perluas ruang kerja'} title="Perluas ruang kerja" onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
        </div></div>
        <div className="cad-mode-bar"><div role="tablist" aria-label="Ruang kerja"><button role="tab" aria-selected={mode === 'sketch'} onClick={() => { cancel(); setMode('sketch'); }}><PencilRuler size={16}/> Sketch 2D</button><button role="tab" aria-selected={mode === 'solid'} onClick={() => { cancel(); setMode('solid'); }}><Box size={16}/> Model 3D</button></div><span><i/> {saveState}</span></div>
        {mode === 'solid' ? <ModelToolbar project={project} command={command} canUndo={cursor > 0} canRedo={cursor < history.length - 1} undo={undo} redo={redo} onCommand={openCommand} onSketch={() => choose('select')} onHelp={() => setHelp(!help)}/> : <div className="cad-toolbar" aria-label="Perintah gambar"><div className="cad-tool-group">{tools.map(t => <button key={t.id} aria-pressed={tool === t.id} title={`${t.label} (${t.key})`} onClick={() => choose(t.id)}><t.icon size={22}/><span>{t.label}</span></button>)}</div><div className="cad-tool-group cad-edit-tools"><button disabled={!active} onClick={duplicate} title="Salin objek"><Copy size={20}/><span>Salin</span></button><button disabled={!active} onClick={remove} title="Hapus (Delete)"><Trash2 size={20}/><span>Hapus</span></button><button disabled={!cursor} onClick={undo} title="Undo (Ctrl+Z)"><Undo2 size={20}/><span>Undo</span></button><button disabled={cursor === history.length - 1} onClick={redo} title="Redo (Ctrl+Y)"><Redo2 size={20}/><span>Redo</span></button></div><button className="cad-extrude-button" disabled={!project.entities.length} onClick={extrude} title="Extrude (E)"><MoveUp size={22}/><span>Extrude</span></button><button className="cad-help-button" aria-label="Panduan editor" aria-expanded={help} onClick={() => setHelp(!help)}><CircleHelp size={20}/></button></div>}
        {help && <div className="cad-help"><button aria-label="Tutup panduan" onClick={() => setHelp(false)}><X size={18}/></button><strong>Mulai dari bentuk sederhana</strong><p>1. Pilih Persegi atau Lingkaran, lalu klik dua titik di kanvas. 2. Pilih objek untuk mengubah ukuran dalam mm. 3. Tentukan tebal dan klik Extrude.</p><p>Lingkaran di dalam persegi menjadi lubang tembus. Garis harus membentuk rangkaian tertutup. Profil yang bersilangan perlu dirapikan sebelum extrude.</p><small>V Pilih · H Geser · L Garis · R Persegi · C Lingkaran · D Ukuran · E Extrude · Esc Batal · Ctrl+Z Undo. Snap mengikuti grid 1 mm dan ujung garis.</small></div>}
        <div className="cad-body"><aside className="cad-browser"><div className="cad-panel-heading"><Layers size={16}/><span>OBJEK DESAIN</span><b>{project.entities.length}</b></div><div className="cad-tree-root"><Box size={17}/><strong>{project.name}</strong></div><div className="cad-tree-plane"><ChevronRight size={13}/> Origin <span>{project.plane}</span></div><button className="cad-sketch-row" onClick={() => choose('select')}><ChevronRight size={13}/><PencilRuler size={15}/> Sketch 1 <small>{project.plane}</small></button><div className="cad-entity-list">{project.entities.map((e, i) => <button key={e.id} aria-pressed={selected === e.id} onClick={() => { setSelected(e.id); choose('select'); }}>{e.kind === 'circle' ? <Circle size={15}/> : e.kind === 'rect' ? <RectangleHorizontal size={15}/> : <Minus size={15}/>}<span>{entityName(e)} {i + 1}</span></button>)}{!project.entities.length && <p>Objek yang kamu gambar akan muncul di sini.</p>}</div>{project.extruded && <button className="cad-sketch-row" onClick={() => openCommand(project.operation?.kind || 'extrude')}><ChevronRight size={13}/><ModelCommandIcon command={project.operation?.kind || 'extrude'} size={15}/> {featureName} 1</button>}{project.modifier && <button className="cad-sketch-row" onClick={() => openCommand(project.modifier!.kind)}><ChevronRight size={13}/><ModelCommandIcon command={project.modifier.kind} size={15}/>{commandNames[project.modifier.kind]} 1</button>}<div className="cad-quick-start"><span className="cad-eyebrow">LATIHAN BEBAS</span><h3>Dari sketch ke solid.</h3><p>Coba plat berlubang, lalu ubah ukuran dan ketebalannya.</p><button onClick={example}>Buka contoh <ChevronRight size={15}/></button><small>Contoh bebas, bukan ukuran jobsheet.</small></div></aside>
        <div className="cad-stage" ref={area}>
            {mode === 'sketch' ? <><svg ref={svg} className={`cad-sketch-canvas tool-${tool}`} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} preserveAspectRatio="none" tabIndex={0} role="img" aria-label="Kanvas sketch. Pilih alat lalu klik titik awal dan akhir. Ukuran juga dapat diisi pada panel properti." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setHoverSnap(null)} onPointerCancel={cancel} onContextMenu={e => { e.preventDefault(); cancel(); }}>
                <defs><pattern id="cad-grid-small" width={gridStep} height={gridStep} patternUnits="userSpaceOnUse"><path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="#dbe6f2" strokeWidth={.65 * scale}/></pattern><pattern id="cad-grid-large" width={gridStep * 5} height={gridStep * 5} patternUnits="userSpaceOnUse"><rect width={gridStep * 5} height={gridStep * 5} fill="url(#cad-grid-small)"/><path d={`M ${gridStep * 5} 0 L 0 0 0 ${gridStep * 5}`} fill="none" stroke="#c1d3e7" strokeWidth={scale}/></pattern></defs>
                <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={grid ? 'url(#cad-grid-large)' : '#f9fbfe'}/><line x1={box.x} y1={0} x2={box.x + box.w} y2={0} stroke="#d78181" strokeWidth={scale}/><line x1={0} y1={box.y} x2={0} y2={box.y + box.h} stroke="#7ba98b" strokeWidth={scale}/>
                <g transform="scale(1,-1)">{shown.map(e => <Entity key={e.id} entity={e} selected={selected === e.id}/>)}{draft && <g className="cad-draft"><Entity entity={draft}/></g>}{start && <circle cx={start.x} cy={start.y} r={3.5 * scale} fill="#ff7a24"/>}{active && entityPoints(active).filter((_, i) => active.kind !== 'circle' || i % 24 === 0).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.7 * scale} fill="#fff" stroke="#ff7a24" strokeWidth={1.5 * scale} pointerEvents="none"/>)}</g>
                {dimensions && shown.map(e => <Dimension key={e.id} e={e} scale={scale}/>)}<circle cx={0} cy={0} r={2.5 * scale} fill="#fa7b24" pointerEvents="none"/>{snap && hoverSnap && <SnapIndicator target={hoverSnap} scale={scale}/>}
            </svg><div className="cad-view-badge"><span>SKETCH</span><b>{project.plane}</b></div>{!project.entities.length && !start && <div className="cad-empty-canvas"><PencilRuler size={33}/><h3>Mulai gambar pertamamu.</h3><p>Pilih alat di atas, lalu gambar di grid.</p></div>}<div className="cad-canvas-controls"><button aria-label="Perbesar sketch" title="Perbesar" onClick={() => setView(v => ({ ...v, width: Math.max(10, v.width * .8) }))}><ZoomIn size={17}/></button><button aria-label="Perkecil sketch" title="Perkecil" onClick={() => setView(v => ({ ...v, width: Math.min(30000, v.width * 1.25) }))}><ZoomOut size={17}/></button><button title="Sesuaikan gambar" aria-label="Sesuaikan gambar dengan kanvas" onClick={() => fit()}><Scan size={17}/></button><span/ ><button aria-pressed={snap} onClick={() => setSnap(!snap)} title="Snap 1 mm dan ujung objek"><Magnet size={16}/> Snap</button><button aria-pressed={grid} onClick={() => setGrid(!grid)} title="Tampilkan grid"><Grid2X2 size={17}/></button><button aria-pressed={dimensions} onClick={() => setDimensions(!dimensions)} title="Tampilkan ukuran"><Ruler size={17}/></button></div></> : result.geometry ? <WorkbenchView geometry={result.geometry}/> : <div className="cad-solid-empty"><Box size={48}/><h3>{result.error ? 'Periksa profil sketch.' : 'Ubah sketch menjadi model 3D.'}</h3><p>{result.error || 'Buat profil tertutup, tentukan ketebalan, lalu klik Extrude.'}</p><button onClick={() => { cancel(); setMode('sketch'); }}>Kembali ke Sketch</button></div>}
        </div>
        <button type="button" className="cad-mobile-properties-toggle" aria-expanded={mobilePropertiesOpen} aria-controls={propertiesId} onClick={() => setMobilePropertiesOpen(open => !open)}><Ruler size={18}/><span>Ukuran & properti{command ? ` · ${commandNames[command]}` : ''}</span><ChevronRight size={18}/></button>
        <aside id={propertiesId} className={`cad-properties${mobilePropertiesOpen ? ' is-mobile-open' : ''}`}><div className="cad-panel-heading"><Ruler size={16}/> PROPERTI <span>mm</span></div><section><label className="cad-plane-label">Bidang sketch<select disabled={!!command} value={project.plane} onChange={e => commit({ ...project, plane: e.target.value as CadProject['plane'] })}>{['XY', 'XZ', 'YZ'].map(p => <option key={p}>{p}</option>)}</select></label><small>Satu bidang untuk seluruh sketch.</small></section>{mode === 'solid' ? command ? <ModelCommandPanel key={`${command}:${cursor}`} command={command} project={project} error={result.error} onPreview={setPreview} onApply={applyCommand} onCancel={cancel}/> : <section className="cad-solid-properties"><span className="cad-eyebrow">CREATE / MODIFY</span><h3>{project.extruded ? `${featureName} 1` : 'Mulai bentuk 3D'}</h3><p>Pilih perintah di toolbar atas. Atur nilainya, periksa pratinjau, lalu klik Terapkan.</p>{project.extruded && <button className="cad-apply" onClick={() => openCommand(project.operation?.kind || 'extrude')}>Edit {featureName}</button>}{project.modifier && <><p>Modify aktif: {commandNames[project.modifier.kind]} · {project.modifier.size} mm</p><button className="cad-apply" onClick={() => commit({ ...project, modifier: undefined })}>Hapus Modify</button></>}<small>Modify latihan tersedia pada hasil Extrude. Fillet dan Chamfer diterapkan pada tepi atas/bawah; Shell membuka sisi atas.</small>{result.error && <p className="cad-error" role="alert">{result.error}</p>}</section> : <><section><div className="cad-property-title"><PencilRuler size={16}/><h3>{active ? entityName(active) : 'Pilih objek'}</h3></div>{active ? <div className="cad-properties-inputs" key={active.id}>
            <Numeric label={active.kind === 'line' ? 'Awal X' : 'Posisi X'} value={active.x} onChange={x => changeEntity({ x })}/><Numeric label={active.kind === 'line' ? 'Awal Y' : 'Posisi Y'} value={active.y} onChange={y => changeEntity({ y })}/>
            {active.kind === 'rect' && <><Numeric label="Panjang" min={.1} value={active.a} onChange={a => changeEntity({ a })}/><Numeric label="Lebar" min={.1} value={active.b} onChange={b => changeEntity({ b })}/></>}
            {active.kind === 'circle' && <Numeric label="Diameter" min={.2} max={20000} value={active.a * 2} onChange={d => changeEntity({ a: d / 2 })}/>}
            {active.kind === 'line' && <><Numeric label="Akhir X" value={active.a} onChange={a => changeEntity({ a })}/><Numeric label="Akhir Y" value={active.b} onChange={b => changeEntity({ b })}/><Numeric label="Panjang" min={.1} value={Math.hypot(active.a - active.x, active.b - active.y)} onChange={n => { const angle = Math.atan2(active.b - active.y, active.a - active.x); changeEntity({ a: round(active.x + n * Math.cos(angle)), b: round(active.y + n * Math.sin(angle)) }); }}/><div className="cad-align"><button onClick={() => changeEntity({ b: active.y })}>Horizontal</button><button onClick={() => changeEntity({ a: active.x })}>Vertikal</button></div></>}
        </div> : <p>Klik objek pada kanvas atau daftar di kiri untuk mengatur ukuran dan posisinya.</p>}</section><section><div className="cad-property-title"><MoveUp size={16}/><h3>Extrude</h3></div><Numeric label="Ketebalan" min={.1} max={1000} value={project.depth} onChange={depth => commit({ ...project, depth })}/><button className="cad-apply" disabled={!project.entities.length} onClick={extrude}><Check size={16}/>Bentuk dengan Extrude</button><small>Profil di dalam profil menjadi lubang tembus. Untuk Revolve, Sweep, dan Loft, pilih tab Model 3D.</small>{result.error && <p className="cad-error" role="alert">{result.error}</p>}</section></>}<section className="cad-output"><span className="cad-eyebrow">HASIL LATIHAN</span><button disabled={!project.entities.length || !!command} onClick={() => download(sketchSvg(project), filename + '.svg', 'image/svg+xml')}><Download size={15}/> Unduh sketch SVG</button><button disabled={!project.extruded || !result.geometry || !!command} onClick={exportStl}><Download size={15}/> Unduh model STL</button></section></aside></div>
        <div className="cad-timeline"><span>URUTAN FITUR</span><button aria-pressed={mode === 'sketch'} onClick={() => choose('select')}><PencilRuler size={16}/> Sketch 1</button>{project.extruded && <><ChevronRight size={14}/><button aria-pressed={mode === 'solid' && !command} onClick={() => { cancel(); setMode('solid'); }}><ModelCommandIcon command={project.operation?.kind || 'extrude'} size={16}/>{featureName} 1</button></>}{project.modifier && <><ChevronRight size={14}/><button onClick={() => openCommand(project.modifier!.kind)}><ModelCommandIcon command={project.modifier.kind} size={16}/>{commandNames[project.modifier.kind]} 1</button></>}<small>{project.entities.length} objek · {project.plane} · mm</small></div><div className="cad-status" role="status"><span>{mode === 'sketch' ? tips[tool] : command ? `Pratinjau ${commandNames[command]} · Terapkan untuk menyimpan, atau Batal.` : 'Seret untuk orbit · gulir untuk zoom · tombol kanan untuk pan.'}</span><span>{mode === 'sketch' ? `X ${round(pointer.x)} · Y ${round(pointer.y)}` : 'E Extrude · Q Press Pull · F Fillet'}</span></div><div className="cad-storage-note">{ownerName ? `Draf ${ownerName}` : 'Draf tamu'} disimpan di browser ini. Unduh proyek JSON untuk cadangan atau melanjutkan di perangkat lain. Editor latihan dasar; hasil bukan file F3D.</div>
    </section>;
}
