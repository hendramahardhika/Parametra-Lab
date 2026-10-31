"use client";
import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Box, Download, ExternalLink, FileText } from 'lucide-react';
import models from '@/lib/part-model-data.generated.json';
import { jobsheetsFor, jobsheetUrl } from '@/lib/jobsheets';

const CadViewer = dynamic(() => import('./cad-viewer'), { ssr: false, loading: () => <p className="notice">Menyiapkan penampil 3D…</p> });
const sheets = jobsheetsFor('part');

function ModelPreview({ jobsheetId, children }: { jobsheetId: string; children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const entry = models.find(m => m.jobsheetId === jobsheetId);
    if (!entry) return;
    let url = '';
    try {
      const bytes = Uint8Array.from(atob(entry.base64), char => char.charCodeAt(0));
      const modelFile = new File([bytes], entry.source, { type: 'model/stl' });
      url = URL.createObjectURL(modelFile);
      setFile(modelFile);
      setDownloadUrl(url);
    } catch {
      setError('Model tidak dapat dimuat. Silakan muat ulang halaman.');
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [jobsheetId]);
  return <>
    {error ? <p className="notice warning" role="alert">{error}</p> : file ? <CadViewer file={file} height={420} upAxis="z"/> : <p className="notice">Memuat model STL…</p>}
    <div className="part-action-row mt-4">
      {file && downloadUrl ? <a className="action ghost" href={downloadUrl} download={file.name}><Download size={16}/><span>Unduh STL</span></a> : <button className="action ghost" type="button" disabled><Download size={16}/><span>Unduh STL</span></button>}
      {children}
    </div>
  </>;
}

export function PartPreview() {
  const [selected, setSelected] = useState(models[0]?.jobsheetId || 'part-3');
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfPosition, setPdfPosition] = useState<'below' | 'right'>('below');
  const sheet = sheets.find(s => s.id === selected)!;
  const available = models.some(model => model.jobsheetId === selected);
  const pdfActions = <><button type="button" className="action" aria-expanded={pdfOpen} aria-controls="part-jobsheet-preview" onClick={() => setPdfOpen(open => !open)}><FileText size={16}/><span>{pdfOpen ? 'Tutup pratinjau PDF' : `Buka jobsheet ${sheet.number} PDF`}</span></button><a className="action ghost" href={jobsheetUrl(sheet)} download={sheet.source.split('/').pop()}><Download size={16}/><span>Unduh PDF</span></a></>;
  return <section className="panel part-preview" aria-label="Model part 3D guru">
    <div className="panel-head"><div><span className="eyebrow muted">MODEL ASLI GURU</span><h2 className="mt-2">Jelajahi part 3D</h2></div><Box size={24}/></div>
    <p>Pilih jobsheet, lalu seret model untuk memutar atau gulir untuk memperbesar. Tombol putar menjalankan rotasi tampilan, bukan animasi proses pembuatan di Fusion.</p>
    <div className="part-model-options" role="group" aria-label="Pilih jobsheet part 3D">{sheets.map(s => <button type="button" key={s.id} className={s.id === selected ? 'action' : 'action ghost'} aria-pressed={s.id === selected} onClick={() => setSelected(s.id)}><span>Jobsheet {s.number} · {s.title}</span>{!models.some(m => m.jobsheetId === s.id) && <small>STL belum tersedia</small>}</button>)}</div>
    <h3 className="mb-4">Jobsheet {sheet.number} · {sheet.title}</h3>
    <div className="part-pdf-position" role="group" aria-label="Posisi pratinjau PDF">
      <span>Posisi PDF:</span>
      <button type="button" className={pdfPosition === 'below' ? 'action small' : 'action ghost small'} aria-pressed={pdfPosition === 'below'} onClick={() => { setPdfPosition('below'); setPdfOpen(true); }}>PDF di bawah</button>
      <button type="button" className={pdfPosition === 'right' ? 'action small' : 'action ghost small'} aria-pressed={pdfPosition === 'right'} onClick={() => { setPdfPosition('right'); setPdfOpen(true); }}>PDF di kanan</button>
    </div>
    {pdfPosition === 'right' && pdfOpen && <p className="smallprint part-pdf-mobile-note mb-3">Di layar sempit, PDF ditampilkan di bawah model agar tetap terbaca.</p>}
    <div className={`part-preview-layout${pdfOpen && pdfPosition === 'right' ? ' is-side-by-side' : ''}`}>
    <div className="part-preview-model">{available ? <ModelPreview key={selected} jobsheetId={selected}>{pdfActions}</ModelPreview> : <><p className="notice">Model STL {sheet.title} belum ditambahkan. Gambar acuan tetap tersedia pada jobsheet PDF.</p><div className="link-row mt-4">{pdfActions}</div></>}</div>
    <div id="part-jobsheet-preview" hidden={!pdfOpen}>{pdfOpen && <section className="part-inline-pdf" aria-label={`Pratinjau jobsheet ${sheet.number}`}>
      <h3 className="sr-only">Jobsheet {sheet.number} · {sheet.title}</h3>
      <iframe key={sheet.id} className="pdf-frame" src={`${jobsheetUrl(sheet)}#view=FitH`} title={`PDF Jobsheet ${sheet.number} — ${sheet.title}`}/>
      <p className="smallprint mt-3">Jika browser tidak mendukung pratinjau PDF, gunakan Unduh PDF atau <a className="text-link" href={jobsheetUrl(sheet)} target="_blank" rel="noopener noreferrer">buka di tab baru <ExternalLink size={14}/></a>.</p>
    </section>}</div>
    </div>
    {sheet.note && <p className="notice warning mt-4">{sheet.note}</p>}
    <p className="smallprint mt-3">STL menampilkan bentuk permukaan tanpa riwayat sketch, fitur, atau ukuran parametrik. Gunakan PDF sebagai acuan dimensi.</p>
  </section>;
}
