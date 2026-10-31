"use client";
import { useState } from 'react';
import { Download, ExternalLink, FileText, PencilRuler } from 'lucide-react';
import { jobsheetsFor, jobsheetUrl, sketchPreviewUrl } from '@/lib/jobsheets';

export function SketchPreview() {
  const sheets = jobsheetsFor('sketch').filter(sheet => sheet.previewAsset);
  const [selected, setSelected] = useState(0);
  const [pdfOpen, setPdfOpen] = useState(false);
  const sheet = sheets[selected];
  if (!sheet) return <div className="notice">Gambar sketch belum ditambahkan.</div>;
  const imageUrl = sketchPreviewUrl(sheet);
  const pdfUrl = jobsheetUrl(sheet);
  return <section className="panel sketch-preview" aria-label="Preview Sketch 2D">
    <div className="panel-head"><div><span className="eyebrow muted">GAMBAR ACUAN GURU</span><h2 className="mt-2">Preview Sketch 2D</h2></div><PencilRuler size={24}/></div>
    <p className="mb-4">Pilih jobsheet untuk melihat gambar secara utuh. Buka gambar ukuran penuh untuk memeriksa detail dimensi.</p>
    <div className="stage-tabs" role="group" aria-label="Pilih gambar sketch">{sheets.map((item, i) => <button key={item.id} type="button" className={selected === i ? 'action' : 'action ghost'} aria-pressed={selected === i} onClick={() => { setSelected(i); setPdfOpen(false); }}>Jobsheet {item.number} · {item.title}</button>)}</div>
    <figure className="sketch-figure">
      <a href={imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buka gambar ukuran penuh ${sheet.title}`}><img key={sheet.id} src={imageUrl} alt={`Gambar teknik sketch 2D ${sheet.title} beserta dimensi acuan`} /></a>
      <figcaption>Jobsheet {sheet.number} · {sheet.title}</figcaption>
    </figure>
    <div className="link-row mt-4">
      <a className="action ghost" href={imageUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Gambar ukuran penuh</a>
      <button type="button" className="action" aria-expanded={pdfOpen} aria-controls="sketch-pdf-preview" onClick={() => setPdfOpen(!pdfOpen)}><FileText size={16}/>{pdfOpen ? 'Tutup PDF' : 'Pratinjau jobsheet PDF'}</button>
      <a className="action ghost" href={pdfUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Buka PDF</a>
      <a className="action ghost" href={pdfUrl} download={sheet.source.split('/').pop()}><Download size={16}/> Unduh PDF</a>
    </div>
    <div id="sketch-pdf-preview">{pdfOpen && <iframe key={sheet.id} className="pdf-frame mt-4" src={pdfUrl} title={`Jobsheet ${sheet.number} — ${sheet.title}`}/>}</div>
    <p className="smallprint mt-3">Gambar ini adalah acuan 2D, bukan model 3D yang dapat diputar. Jika pratinjau PDF tidak muncul di HP, gunakan Buka PDF atau Unduh PDF.</p>
  </section>;
}
