"use client";
import { useEffect, useMemo, useState } from 'react';
import { PencilRuler, Undo2, Redo2, X, Check, CircleHelp } from 'lucide-react';
import type { CadProject } from '@/lib/cad-workbench';
import { sketchBounds } from '@/lib/cad-workbench';
import { commandNames, type ModelCommand } from '@/lib/cad-modeling';

const create: ModelCommand[] = ['extrude', 'revolve', 'sweep', 'loft'];
const modify: ModelCommand[] = ['presspull', 'fillet', 'chamfer', 'shell'];
const descriptions: Record<ModelCommand, string> = {
    extrude: 'Tarik profil tertutup menjadi solid. Profil di dalam profil menjadi lubang tembus.',
    revolve: 'Putar satu profil tertutup mengelilingi sumbu vertikal sketch. Profil harus berada di kanan sumbu.',
    sweep: 'Gerakkan satu profil tanpa lubang mengikuti jalur busur. Pusat profil mengikuti jalur secara otomatis.',
    loft: 'Hubungkan dua profil persegi atau lingkaran pada bidang sejajar. Hanya dua profil ini yang dipakai dalam sketch.',
    presspull: 'Ubah tinggi total hasil Extrude. Isi tinggi akhir yang diinginkan.',
    fillet: 'Bulatkan seluruh tepi atas dan bawah Extrude. Gunakan satu profil cembung tanpa lubang.',
    chamfer: 'Buat bidang miring 45° pada seluruh tepi atas dan bawah Extrude. Gunakan satu profil cembung tanpa lubang.',
    shell: 'Buka sisi atas Extrude dan buat dinding serta dasar dengan tebal yang sama. Gunakan satu profil cembung tanpa lubang.',
};
export function ModelCommandIcon({ command, size = 23 }: { command: ModelCommand; size?: number }) {
    const paths: Record<ModelCommand, React.ReactNode> = {
        extrude: <><path d="m5 17 7 4 7-4V9l-7 4-7-4v8Zm0-8 7-4 7 4M12 13v8M12 2v8m-3-5 3-3 3 3"/></>,
        revolve: <><path d="M12 2v20M8 6C1 8 1 16 8 18m8 0c7-2 7-10 0-12m2-2-3 2 3 3"/><path d="M9 8H6v8h3"/></>,
        sweep: <><path d="M4 19V9a6 6 0 0 1 6-6h9M10 19V11a2 2 0 0 1 2-2h7"/><ellipse cx="7" cy="19" rx="3" ry="2"/><path d="m19 1 3 5-3 5"/></>,
        loft: <><path d="m4 19 8 3 8-3-8-3-8 3Zm3-14 5 2 5-2-5-3-5 3ZM4 19 7 5m13 14L17 5M12 7v9"/></>,
        presspull: <><path d="m4 17 8 4 8-4-8-4-8 4Zm8-4V2m-3 3 3-3 3 3M8 9h8"/></>,
        fillet: <><path d="M3 21V3h18M3 15a12 12 0 0 1 12-12"/><path d="M7 21V15a8 8 0 0 1 8-8h6" strokeDasharray="2 3"/></>,
        chamfer: <><path d="M3 21V3h18M3 15 15 3"/><path d="m7 21 14-14" strokeDasharray="2 3"/></>,
        shell: <><path d="m3 7 9-4 9 4v12l-9 3-9-3V7Zm0 0 9 4 9-4M12 11v11"/><path d="m7 7 5-2 5 2-5 2-5-2Z"/></>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[command]}</svg>;
}
export function ModelToolbar({ project, command, undo, redo, canUndo, canRedo, onCommand, onSketch, onHelp }: { project: CadProject; command: ModelCommand | null; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; onCommand: (c: ModelCommand) => void; onSketch: () => void; onHelp: () => void }) {
    const canModify = project.extruded && (!project.operation || project.operation.kind === 'extrude');
    return <div className="cad-toolbar cad-model-toolbar" aria-label="Perintah Model 3D">
        <div className="cad-model-toolset"><div className="cad-tool-group"><button onClick={onSketch}><PencilRuler size={22}/><span>Edit sketch</span></button></div><span>SKETCH</span></div>
        {[{ name: 'CREATE', commands: create }, { name: 'MODIFY', commands: modify }].map(group => <div className="cad-model-toolset" key={group.name}><div className="cad-tool-group" role="group" aria-label={group.name}>{group.commands.map(c => <button key={c} disabled={group.name === 'CREATE' ? !project.entities.length : !canModify} title={group.name === 'MODIFY' && !canModify ? 'Gunakan hasil Extrude untuk perintah Modify latihan.' : descriptions[c]} aria-pressed={command === c} onClick={() => onCommand(c)}><ModelCommandIcon command={c}/><span>{commandNames[c]}</span></button>)}</div><span>{group.name}</span></div>)}
        <div className="cad-model-toolset"><div className="cad-tool-group cad-edit-tools"><button disabled={!canUndo} onClick={undo} title="Undo"><Undo2 size={20}/><span>Undo</span></button><button disabled={!canRedo} onClick={redo} title="Redo"><Redo2 size={20}/><span>Redo</span></button></div><span>RIWAYAT</span></div><button className="cad-help-button" aria-label="Panduan editor" onClick={onHelp}><CircleHelp size={20}/></button>
    </div>;
}
export function ModelCommandPanel({ command, project, error, onPreview, onApply, onCancel }: { command: ModelCommand; project: CadProject; error: string; onPreview: (p: CadProject) => void; onApply: (p: CadProject) => void; onCancel: () => void }) {
    const op = project.operation, bounds = sketchBounds(project.entities), profiles = project.entities.filter(e => e.kind !== 'line');
    const [depth, setDepth] = useState(String(project.depth));
    const [angle, setAngle] = useState(String(op?.kind === command && (op.kind === 'revolve' || op.kind === 'sweep') ? op.angle : command === 'revolve' ? 360 : 90));
    const [axis, setAxis] = useState(String(op?.kind === 'revolve' ? op.axis : bounds.minX));
    const [radius, setRadius] = useState(String(op?.kind === 'sweep' ? op.radius : Math.max(30, bounds.maxX - bounds.minX)));
    const [amount, setAmount] = useState(String(project.modifier?.kind === command ? project.modifier.size : 1));
    const [bottom, setBottom] = useState(op?.kind === 'loft' ? op.bottom : profiles[0]?.id || '');
    const [top, setTop] = useState(op?.kind === 'loft' ? op.top : profiles[1]?.id || '');
    const [aligned, setAligned] = useState(op?.kind === 'loft' ? op.aligned : true);
    const n = (value: string) => value.trim() ? Number(value) : NaN;
    const candidate = useMemo((): CadProject => {
        const p = { ...project, extruded: true };
        if (command === 'presspull') return { ...p, depth: n(depth) };
        if (command === 'fillet' || command === 'chamfer' || command === 'shell') return { ...p, modifier: { kind: command, size: n(amount) } };
        const base = { ...p, modifier: undefined };
        if (command === 'revolve') return { ...base, operation: { kind: 'revolve', axis: n(axis), angle: n(angle) } };
        if (command === 'sweep') return { ...base, operation: { kind: 'sweep', radius: n(radius), angle: n(angle) } };
        if (command === 'loft') return { ...base, depth: n(depth), operation: { kind: 'loft', bottom, top, aligned } };
        return { ...base, depth: n(depth), operation: { kind: 'extrude' } };
    }, [project, command, depth, angle, axis, radius, amount, bottom, top, aligned]);
    useEffect(() => onPreview(candidate), [candidate, onPreview]);
    const number = (label: string, value: string, update: (s: string) => void, min: number, max: number, unit = 'mm') => <label className="cad-command-field"><span>{label}</span><div><input type="number" value={value} onChange={e => update(e.target.value)} min={min} max={max} step={unit === '°' ? 1 : .1}/><small>{unit}</small></div></label>;
    const profileSelect = (label: string, value: string, update: (s: string) => void) => <label className="cad-command-field"><span>{label}</span><select value={value} onChange={e => update(e.target.value)}><option value="">Pilih profil</option>{profiles.map((p, i) => <option key={p.id} value={p.id}>{p.kind === 'circle' ? 'Lingkaran' : 'Persegi'} {i + 1}</option>)}</select></label>;
    return <section className="cad-command-panel"><div className="cad-command-title"><ModelCommandIcon command={command} size={20}/><h3>{commandNames[command]}</h3><button aria-label="Batalkan perintah" onClick={onCancel}><X size={16}/></button></div><p>{descriptions[command]}</p>
        {['extrude', 'loft', 'presspull'].includes(command) && number(command === 'presspull' ? 'Tinggi akhir' : 'Tinggi / jarak', depth, setDepth, .1, 1000)}
        {command === 'revolve' && <>{number('Posisi X sumbu', axis, setAxis, -10000, 10000)}{number('Sudut putar', angle, setAngle, 1, 360, '°')}<small>Sumbu sejajar arah vertikal sketch.</small></>}
        {command === 'sweep' && <>{number('Radius jalur', radius, setRadius, .1, 10000)}{number('Sudut busur', angle, setAngle, 1, 180, '°')}<small>Jalur busur tegak terhadap bidang sketch.</small></>}
        {command === 'loft' && <>{profileSelect('Profil bawah', bottom, setBottom)}{profileSelect('Profil atas', top, setTop)}<label className="cad-command-check"><input type="checkbox" checked={aligned} onChange={e => setAligned(e.target.checked)}/> Sejajarkan pusat profil</label></>}
        {['fillet', 'chamfer', 'shell'].includes(command) && <>{number(command === 'fillet' ? 'Radius' : command === 'chamfer' ? 'Jarak' : 'Tebal dinding', amount, setAmount, .1, 1000)}{project.modifier && <small>Penerapan ini mengganti {commandNames[project.modifier.kind]} sebelumnya.</small>}</>}
        {error ? <p className="cad-error" role="alert">{error}</p> : <div className="cad-preview-ready"><Check size={13}/> Pratinjau siap</div>}
        <div className="cad-command-actions"><button onClick={onCancel}>Batal</button><button disabled={!!error} onClick={() => onApply(candidate)}><Check size={14}/> Terapkan</button></div><small>Perubahan disimpan setelah klik Terapkan.</small>
    </section>;
}
