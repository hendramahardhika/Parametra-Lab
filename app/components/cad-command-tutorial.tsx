"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Check, PencilRuler, MousePointer2, ArrowUpRight } from 'lucide-react';
import { commandNames, type ModelCommand } from '@/lib/cad-modeling';
import { commandExample, exampleCommands, exampleMoment, exampleStepTime, exampleTotal, type CommandExample } from '@/lib/cad-command-examples';
import { exampleDrawing, paintExample, prepareExampleDrawing, type ExampleDrawing } from '@/lib/cad-example-renderer';
import { ModelCommandIcon } from './cad-model-commands';

function DemoCanvas({ example, elapsed, onAdvance }: { example: CommandExample; elapsed: number; onAdvance: () => void }) {
    const canvas = useRef<HTMLCanvasElement>(null), prepared = useMemo(() => prepareExampleDrawing(example), [example]);
    const [drawing, setDrawing] = useState<ExampleDrawing | null>(null), [error, setError] = useState('');
    const { step, progress } = exampleMoment(elapsed);
    useEffect(() => {
        const context = canvas.current?.getContext('2d');
        if (!context) { setError('Kanvas animasi belum tersedia pada browser ini. Petunjuk langkah tetap dapat dibaca.'); return; }
        try {
            const frame = exampleDrawing(prepared, step, progress);
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.round(800 * pixelRatio), height = Math.round(500 * pixelRatio);
            if (canvas.current!.width !== width || canvas.current!.height !== height) { canvas.current!.width = width; canvas.current!.height = height; }
            context.setTransform(width / 800, 0, 0, height / 500, 0, 0);
            paintExample(context, frame, step, progress); setDrawing(frame); setError('');
        } catch (e) { setError(e instanceof Error ? e.message : 'Pratinjau contoh belum tersedia.'); }
    }, [prepared, step, progress]);
    const selection = example.steps[step].target === 'profile' || example.steps[step].target === 'reference';
    const pointer = drawing?.cursor;
    const click = step > 0 && step < 6 && progress > .38 && progress < .83;
    const instruction = step === 1 && example.category === 'Create' || step === 2 && example.category === 'Modify';
    return <div className="cad-demo-stage">
        <canvas ref={canvas} width={800} height={500} role="img" aria-label={`Animasi ${commandNames[example.command]}, tahap ${step + 1}: ${example.steps[step].title}`}/>
        {drawing && <svg className="cad-demo-overlay" viewBox="0 0 800 500" aria-label="Sasaran pilihan contoh animasi">
            <g className="cad-demo-command-chip" role="button" tabIndex={instruction ? 0 : -1} aria-label={`Pilih perintah ${commandNames[example.command]}`} onClick={() => { if (instruction) onAdvance(); }} onKeyDown={e => { if (instruction && ['Enter', ' '].includes(e.key)) { e.preventDefault(); onAdvance(); } }}>
                <rect x={22} y={24} width={195} height={48} rx={9} fill={instruction ? '#125bce' : '#ffffffed'} stroke={instruction ? '#125bce' : '#c7dced'}/>
                <text x={36} y={43} fontSize={9} letterSpacing={1.4} fill={instruction ? '#9cdefa' : '#7894ab'}>{example.category.toUpperCase()}</text><text x={36} y={61} fontSize={15} fontWeight={700} fill={instruction ? '#fff' : '#20588c'}>{commandNames[example.command]}</text>
            </g>
            {step === 4 && <g pointerEvents="none"><rect x={598} y={96} width={181} height={example.parameters.length * 26 + 58} rx={10} fill="#fff" stroke="#a8c9ec"/><text x={614} y={121} fontSize={11} fontWeight={700} fill="#125bce">PARAMETER</text>{example.parameters.map((p, i) => <text key={p} x={610} y={149 + i * 26} fontSize={11} fill="#315e83">{p}</text>)}</g>}
            {selection && <g role="button" tabIndex={0} className="cad-demo-target" aria-label={step === 3 ? example.command === 'revolve' ? 'Pilih axis atau sumbu putar' : example.steps[3].title : example.steps[2].title} onClick={onAdvance} onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); onAdvance(); } }}>
                <circle cx={drawing.target.x} cy={drawing.target.y} r={25} fill="#ff91251a" stroke="#f28c26" strokeWidth={1.5} strokeDasharray="4 4"/><circle cx={drawing.target.x} cy={drawing.target.y} r={7} fill="#fff" stroke="#f28c26" strokeWidth={2}/>
                <text x={drawing.target.x + 31} y={drawing.target.y - 12} fontSize={12} fill="#a95316" paintOrder="stroke" stroke="#fff" strokeWidth={4}>Klik untuk lanjut</text>
            </g>}
            {step === 5 && <g pointerEvents="none"><rect x={622} y={368} width={150} height={42} rx={8} fill="#125bce"/><text x={648} y={394} fontSize={13} fontWeight={700} fill="#fff">✓ Terapkan</text></g>}
            {pointer && step < 6 && <g pointerEvents="none" transform={`translate(${pointer.x} ${pointer.y})`}>
                {click && <circle r={9 + Math.sin(progress * Math.PI * 5) * 4} fill="#ff9a3025" stroke="#f58b23" strokeWidth={2}/>}
                <path d="m0 0 3 24 6-7 7 10 5-3-7-10 9-1Z" fill="#fff" stroke="#173e69" strokeWidth={1.6}/>
            </g>}
        </svg>}
        <div className="cad-demo-stage-label"><span>CONTOH ANIMASI</span><b>{step === 0 ? `Sketch ${example.initial.plane}` : step === 6 ? 'Hasil akhir' : `Tahap ${step + 1} / 7`}</b></div>
        {error && <div className="cad-render-error" role="alert">{error}</div>}
    </div>;
}
export default function CadCommandTutorial({ onPractice }: { onPractice: (example: CommandExample) => void }) {
    const [command, setCommand] = useState<ModelCommand>('revolve'), [elapsed, setElapsed] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
    const elapsedRef = useRef(0), example = useMemo(() => commandExample(command), [command]);
    const { step } = exampleMoment(elapsed), current = example.steps[step];
    function seek(time: number) { const next = Math.max(0, Math.min(exampleTotal, time)); elapsedRef.current = next; setElapsed(next); }
    function jump(index: number) { setPlaying(false); seek(exampleStepTime(index)); }
    function choose(next: ModelCommand) { setPlaying(false); seek(0); setCommand(next); }
    useEffect(() => {
        if (!playing) return;
        let frame = 0, last = performance.now(), painted = last;
        const tick = (now: number) => {
            const delta = Math.min(100, now - last); last = now;
            if (!document.hidden) elapsedRef.current = Math.min(exampleTotal, elapsedRef.current + delta * speed);
            if (now - painted >= 50 || elapsedRef.current === exampleTotal) { setElapsed(elapsedRef.current); painted = now; }
            if (elapsedRef.current >= exampleTotal) { setPlaying(false); return; }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
    }, [playing, speed, command]);
    function play() { if (elapsed >= exampleTotal) seek(0); setPlaying(!playing); }
    return <section className="cad-command-tutorial" aria-label="Contoh animasi Create dan Modify">
        <div className="cad-demo-heading"><div><span className="eyebrow">BELAJAR LEWAT CONTOH</span><h2>Lihat perintahnya. Ikuti prosesnya.</h2><p>Pilih contoh, putar animasi, lalu coba sendiri di ruang desain.</p></div><span className="cad-demo-count">8 perintah · 7 langkah</span></div>
        <div className="cad-demo-command-list">{(['Create', 'Modify'] as const).map(category => <div className="cad-demo-command-group" key={category}><span>{category}</span><div>{exampleCommands.filter(c => commandExample(c).category === category).map(c => <button key={c} aria-pressed={command === c} onClick={() => choose(c)}><ModelCommandIcon command={c} size={24}/><b>{commandNames[c]}</b></button>)}</div></div>)}</div>
        <div className="cad-demo-layout"><aside className="cad-demo-steps"><div className="cad-demo-lesson-title"><ModelCommandIcon command={command} size={26}/><div><small>{example.category.toUpperCase()}</small><h3>{commandNames[command]}</h3></div></div><ol>{example.steps.map((s, i) => <li key={s.title}><button aria-current={i === step ? 'step' : undefined} onClick={() => jump(i)}><span className={i < step ? 'done' : ''}>{i < step ? <Check size={13}/> : i + 1}</span><span>{s.title}</span></button></li>)}</ol><div className="cad-demo-tip"><MousePointer2 size={16}/><p>Saat dijeda, klik sasaran oren di kanvas untuk melanjutkan pilihan.</p></div></aside>
            <div className="cad-demo-player"><DemoCanvas example={example} elapsed={elapsed} onAdvance={() => { if (step < 6) jump(step + 1); }}/><div className="cad-demo-caption" aria-live="polite"><span className="cad-demo-caption-step">{step + 1}</span><div><h3>{current.title}</h3><p>{current.detail}</p></div></div>
                <div className="cad-demo-controls"><div className="cad-demo-transport"><button aria-label="Langkah sebelumnya" disabled={step === 0} onClick={() => jump(step - 1)}><ChevronLeft size={19}/></button><button className="cad-demo-play" onClick={play} aria-label={playing ? 'Jeda animasi' : 'Putar animasi'}>{playing ? <Pause size={18}/> : <Play size={18}/>}<span>{playing ? 'Jeda' : 'Putar'}</span></button><button aria-label="Langkah berikutnya" disabled={step === 6} onClick={() => jump(step + 1)}><ChevronRight size={19}/></button><button aria-label="Ulangi animasi" title="Ulangi" onClick={() => { seek(0); setPlaying(true); }}><RotateCcw size={18}/></button></div><label className="cad-demo-speed">Kecepatan<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0,5×</option><option value={1}>1×</option><option value={1.5}>1,5×</option></select></label><span className="cad-demo-time">{Math.floor(elapsed / 1000)} / {Math.round(exampleTotal / 1000)} dtk</span></div>
                <label className="cad-demo-scrub"><span className="sr-only">Posisi animasi</span><input type="range" min={0} max={exampleTotal} step={50} value={elapsed} aria-valuetext={`Tahap ${step + 1}: ${current.title}`} onChange={e => { setPlaying(false); seek(Number(e.target.value)); }}/></label>
                <div className="cad-demo-bottom"><p>Contoh latihan bebas. Proses pembentukan diperlambat untuk memperlihatkan perubahan bentuk.</p><button className="action" onClick={() => onPractice(example)}><PencilRuler size={16}/> Coba di editor <ArrowUpRight size={16}/></button></div>
            </div></div>
    </section>;
}
