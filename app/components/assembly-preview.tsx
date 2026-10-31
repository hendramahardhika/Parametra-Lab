"use client";
import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Box, Download, ExternalLink, FileText } from 'lucide-react';
import models from '@/lib/assembly-model-data.generated.json';
import { jobsheetsFor, jobsheetUrl } from '@/lib/jobsheets';

const CadViewer = dynamic(() => import('./cad-viewer'), { ssr: false, loading: () => <p className="notice">Menyiapkan penampil 3D…</p> });
const sheets = jobsheetsFor('assembly');
const modelSheetIds = ['assembly-full', 'assembly-1', 'assembly-2', 'assembly-3', 'assembly-4', 'assembly-5'];
const modelSheets = modelSheetIds.map(id => sheets.find(sheet => sheet.id === id)!).filter(Boolean);
const isometricSheet = sheets.find(sheet => sheet.id === 'assembly-isometris');

function AssemblyModel({ jobsheetId, children }: { jobsheetId: string; children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const entry = models.find(model => model.jobsheetId === jobsheetId);
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

export function AssemblyPreview() {
  const [selected, setSelected] = useState('assembly-full');
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfPosition, setPdfPosition] = useState<'below' | 'right'>('below');
  const sheet = modelSheets.find(item => item.id === selected)!;
  const fullAssembly = selected === 'assembly-full';
  const modelsForSheet = models.filter(model => model.jobsheetId === selected);
  const pdfActions = <><button type="button" className="action" aria-expanded={pdfOpen} aria-controls="assembly-jobsheet-preview" onClick={() => setPdfOpen(open => !open)}><FileText size={16}/><span>{pdfOpen ? 'Tutup pratinjau PDF' : fullAssembly ? 'Buka gambar rakitan PDF' : `Buka jobsheet ${sheet.number} PDF`}</span></button><a className="action ghost" href={jobsheetUrl(sheet)} download={sheet.source.split('/').pop()}><Download size={16}/><span>Unduh PDF</span></a></>;
  return <section className="panel part-preview assembly-preview" aria-label="Preview assembly piston">
    <div className="panel-head"><div><span className="eyebrow muted">MODEL ASLI GURU</span><h2 className="mt-2">Jelajahi Assembly Piston</h2></div><Box size={24}/></div>
    <p>Pilih model rakitan lengkap atau salah satu komponennya. Seret model untuk memutar dan gulir untuk memperbesar.</p>
    <div className="part-model-options" role="group" aria-label="Pilih model assembly">{modelSheets.map(item => <button type="button" key={item.id} className={item.id === selected ? 'action' : 'action ghost'} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}><span>{item.id === 'assembly-full' ? 'Rakitan lengkap · Assembly Piston' : `Jobsheet ${item.number} · ${item.title}`}</span></button>)}</div>
    <h3 className="mb-4">{fullAssembly ? 'Rakitan lengkap · Assembly Piston' : `Jobsheet ${sheet.number} · ${sheet.title}`}</h3>
    <div className="part-pdf-position" role="group" aria-label="Posisi pratinjau PDF">
      <span>Posisi PDF:</span>
      <button type="button" className={pdfPosition === 'below' ? 'action small' : 'action ghost small'} aria-pressed={pdfPosition === 'below'} onClick={() => { setPdfPosition('below'); setPdfOpen(true); }}>PDF di bawah</button>
      <button type="button" className={pdfPosition === 'right' ? 'action small' : 'action ghost small'} aria-pressed={pdfPosition === 'right'} onClick={() => { setPdfPosition('right'); setPdfOpen(true); }}>PDF di kanan</button>
    </div>
    {pdfPosition === 'right' && pdfOpen && <p className="smallprint part-pdf-mobile-note mb-3">Di layar sempit, PDF ditampilkan di bawah model agar tetap terbaca.</p>}
    <div className={`part-preview-layout${pdfOpen && pdfPosition === 'right' ? ' is-side-by-side' : ''}`}>
      <div className="part-preview-model">
        {modelsForSheet.length ? <AssemblyModel key={selected} jobsheetId={selected}>{pdfActions}</AssemblyModel> : <p className="notice">Model STL {sheet.title} belum ditambahkan.</p>}
        {fullAssembly && isometricSheet && <a className="text-link mt-3" href={jobsheetUrl(isometricSheet)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Gambar isometris dan daftar komponen (PDF)</a>}
      </div>
      <div id="assembly-jobsheet-preview" hidden={!pdfOpen}>{pdfOpen && <section className="part-inline-pdf" aria-label={`Pratinjau ${fullAssembly ? 'gambar rakitan' : `jobsheet ${sheet.number}`}`}>
        <h3 className="sr-only">{fullAssembly ? 'Gambar rakitan Assembly Piston' : `Jobsheet ${sheet.number} · ${sheet.title}`}</h3>
        <iframe key={sheet.id} className="pdf-frame" src={`${jobsheetUrl(sheet)}#view=FitH`} title={fullAssembly ? 'Gambar rakitan Assembly Piston' : `PDF Jobsheet ${sheet.number} — ${sheet.title}`}/>
        <p className="smallprint mt-3">Jika pratinjau PDF tidak didukung browser, gunakan Unduh PDF atau <a className="text-link" href={jobsheetUrl(sheet)} target="_blank" rel="noopener noreferrer">buka di tab baru <ExternalLink size={14}/></a>.</p>
      </section>}</div>
    </div>
    <p className="smallprint mt-3">STL hanya menampilkan bentuk mesh, tanpa riwayat fitur Fusion. Model rakitan lengkap dan komponennya dapat diputar; file unduhan tetap STL asli.</p>
  </section>;
}
