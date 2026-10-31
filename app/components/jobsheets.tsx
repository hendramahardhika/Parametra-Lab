"use client";
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, FileText } from 'lucide-react';
import { jobsheetsFor, jobsheetUrl, stages, type Stage } from '@/lib/jobsheets';

export function JobsheetPanel({ stage, stepIndex, onPracticeSelect }: { stage: Stage; stepIndex?: number; onPracticeSelect?: (index: number) => void }) {
  const sheets = jobsheetsFor(stage);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (stepIndex !== undefined && sheets.length) {
      const practiceCount = sheets.filter(s => s.role === 'practice').length;
      setSelected(Math.min(stepIndex, practiceCount, sheets.length - 1));
      setPreview(false);
    }
  }, [stepIndex, stage]);
  const sheet = sheets[selected];
  if (!sheet) return <div className="notice">Bahan ajar dan slide pengenalan Fusion tersedia pada tab <a className="text-link" href="#modul/8/dokumen">Bahan belajar <ArrowRight size={15}/></a>. Pilih Modul pembelajaran untuk mengikuti langkah praktik.</div>;
  const url = jobsheetUrl(sheet);
  const choose = (i: number) => { setSelected(i); setPreview(false); if (sheets[i]?.role === 'practice') onPracticeSelect?.(i); };
  return <section className="panel jobsheet-panel" aria-label="Dokumen jobsheet">
    <div className="panel-head"><div><span className="eyebrow muted">DOKUMEN ASLI GURU</span><h2 className="mt-2">Jobsheet PDF</h2></div><span className="pill">{sheets.length} dokumen</span></div>
    <p className="mb-4">Ikuti nomor jobsheet secara berurutan. Ukuran dan gambar acuan mengikuti PDF asli; petunjuk website adalah pendamping praktik.</p>
    <ol className="document-list">{sheets.map((s, i) => <li key={s.id}><button type="button" onClick={() => choose(i)} aria-current={i === selected ? 'true' : undefined}><FileText size={19}/><span><b>{s.number ? `Jobsheet ${s.number}` : 'Acuan assembly'}</b><span>{s.title}</span></span><small>{s.pages} hal.</small></button></li>)}</ol>
    <div className="document-selection" aria-live="polite"><span className="eyebrow muted">{sheet.number ? `JOBSHEET ${sheet.number}` : 'DOKUMEN ACUAN'}</span><h3 className="mt-2">{sheet.title}</h3>{sheet.note && <p className="notice warning mt-4">{sheet.note}</p>}
      <div className="link-row mt-4"><button className="action" onClick={() => setPreview(!preview)}>{preview ? 'Tutup pratinjau' : 'Pratinjau PDF'}</button><a className="action ghost" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Buka PDF</a><a className="action ghost" href={url} download={sheet.source.split('/').pop()}><Download size={16}/> Unduh PDF</a></div>
      {preview && <iframe key={sheet.id} src={url} title={`PDF ${sheet.number ? 'Jobsheet ' + sheet.number : 'Acuan'} — ${sheet.title}`} className="pdf-frame mt-4"/>}
      <p className="smallprint mt-3">Jika pratinjau kosong atau tidak didukung browser HP, gunakan Buka PDF atau Unduh PDF. PDF berisi gambar teknik; tidak dapat diputar seperti model 3D.</p>
      <div className="step-actions"><button className="action ghost small" disabled={selected === 0} onClick={() => choose(selected - 1)}><ArrowLeft size={15}/> Dokumen sebelumnya</button><button className="action ghost small" disabled={selected === sheets.length - 1} onClick={() => choose(selected + 1)}>Dokumen berikutnya <ArrowRight size={15}/></button></div>
    </div>
  </section>;
}

export function JobsheetLibrary() {
  const [stage, setStage] = useState<Stage>('sketch');
  return <><div className="page-intro"><div><div className="eyebrow muted mb-3">PUSTAKA JOBSHEET</div><h1>Gambar acuan, satu tempat.</h1><p>Mulai dari sketch 2D, lanjut part 3D, kemudian assembly piston. Nomor pada PDF asli tetap dipertahankan.</p></div></div>
    <div className="stage-tabs" role="group" aria-label="Tahap jobsheet">{stages.filter(s => s.key !== 'intro').map(s => <button key={s.key} className={stage === s.key ? 'action' : 'action ghost'} aria-pressed={stage === s.key} onClick={() => setStage(s.key)}>{s.title}</button>)}</div>
    <JobsheetPanel key={stage} stage={stage}/><a className="text-link" href={`#modul/${stages.find(s => s.key === stage)?.module}`}>Buka panduan tahap ini <ArrowRight size={16}/></a>
  </>;
}

