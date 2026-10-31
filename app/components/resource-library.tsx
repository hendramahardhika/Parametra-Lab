"use client";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Box, Download, ExternalLink, Eye, FileText, FolderOpen, GraduationCap, Image as ImageIcon, Layers, Library, Play, Search, X } from 'lucide-react';
import { learningResources, readableSize, resourceStages, resourceUrl, type LearningResource, type ResourceFormat } from '@/lib/learning-resources';
import type { Stage } from '@/lib/jobsheets';

const categoryOrder = ['Media pembelajaran', 'Bahan ajar', 'LKM', 'Jobsheet', 'Model 3D', 'Gambar sketch', 'File CAD', 'Animasi', 'Referensi CAD', 'ATP', 'RPP', 'Asesmen', 'Rubrik', 'Aset desain'];
function CategoryIcon({ category, size = 24 }: { category: string; size?: number }) {
  const Icon = category === 'Media pembelajaran' ? Layers : category === 'Model 3D' || category === 'File CAD' ? Box : category === 'Animasi' ? Play : category === 'Aset desain' || category === 'Gambar sketch' ? ImageIcon : category === 'Bahan ajar' || category === 'Referensi CAD' ? BookOpen : FileText;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true"/>;
}
function previewFormat(resource: LearningResource) {
  return resource.formats.find(file => ['pdf', 'png', 'jpg', 'jpeg', 'mp4'].includes(file.extension));
}
function DownloadLink({ file, small = false }: { file: ResourceFormat; small?: boolean }) {
  return <a className={`action ghost${small ? ' small' : ''}`} href={resourceUrl(file.asset)} download={file.name} aria-label={`Unduh ${file.name}`}><Download size={15}/>{file.extension.toUpperCase()}</a>;
}

export function ResourceLibrary({ audience = 'student', stage }: { audience?: 'student' | 'teacher'; stage?: Stage }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [module, setModule] = useState('all');
  const [cycle, setCycle] = useState('all');
  const [preview, setPreview] = useState<LearningResource | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const previewId = useId();
  const isTeacher = audience === 'teacher';
  const available = useMemo(() => learningResources.filter(resource => resource.audience === audience && (!stage || resource.stages.includes(stage))).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || (a.meeting || 0) - (b.meeting || 0) || a.title.localeCompare(b.title, 'id')), [audience, stage]);
  const categories = categoryOrder.filter(value => available.some(resource => resource.category === value));
  const filtered = available.filter(resource => (category === 'all' || resource.category === category) && (module === 'all' || resource.stages.includes(module)) && (cycle === 'all' || resource.cycle === cycle) && [resource.title, resource.description, resource.category, resource.cycle, resource.moduleTitle, ...resource.formats.map(file => file.name)].join(' ').toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID')));
  const selectedFile = preview ? previewFormat(preview) : undefined;
  const fileCount = available.reduce((total, resource) => total + resource.formats.length, 0);
  useEffect(() => {
    if (preview) {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      previewRef.current?.focus({ preventScroll: true });
    }
  }, [preview]);
  function clearPreview() { setPreview(null); }
  function reset() { setQuery(''); setCategory('all'); setModule('all'); setCycle('all'); clearPreview(); }
  const stageTitle = resourceStages.find(item => item.key === stage)?.title;
  return <div className={`resource-library${stage ? ' is-embedded' : ''}`}>
    {!stage && isTeacher && <a className="text-link mb-5" href="#guru"><ArrowLeft size={16}/> Kembali ke panel guru</a>}
    {!stage ? <section className={`resource-hero${isTeacher ? ' is-teacher' : ''}`}>
      <div className="resource-hero-copy"><span className="eyebrow">{isTeacher ? 'RUANG GURU · PERANGKAT PEMBELAJARAN' : 'PUSTAKA MATERI · AUTODESK FUSION'}</span><h1>{isTeacher ? <>Siapkan pembelajaran.<br/><span>Dampingi setiap proses.</span></> : <>Bekal praktik,<br/><span>semua di sini.</span></>}</h1><p>{isTeacher ? 'ATP, RPP, instrumen asesmen, rubrik, dan aset desain. Temukan perangkat yang sesuai dengan siklus dan pertemuan.' : 'Dari mengenal Fusion hingga merakit piston. Buka materi, lihat gambar kerja, dan siapkan file praktikmu.'}</p><div className="resource-hero-meta"><span><Library size={16}/>{available.length} koleksi</span><span><FolderOpen size={16}/>{fileCount} berkas</span><span>Siklus 2 & 4</span></div></div>
      <div className="resource-hero-art" aria-hidden="true"><div className="resource-book-back"/><div className="resource-book"><span className="eyebrow">PARAMETRA / XI</span>{isTeacher ? <GraduationCap size={62} strokeWidth={1}/> : <BookOpen size={62} strokeWidth={1}/>}<strong>{isTeacher ? 'Perangkat ajar' : 'Fusion Learning'}</strong><span>TEKNIK PEMESINAN</span><i/></div><span className="resource-art-note">6 PERTEMUAN / 2 SIKLUS</span></div>
    </section> : <div className="resource-module-intro"><span className="resource-intro-icon"><BookOpen size={25}/></span><div><span className="eyebrow muted">BAHAN BELAJAR · {stageTitle}</span><h2>Pelajari, lihat, lalu praktikkan.</h2><p>Materi asli guru untuk mendampingi latihan pada modul ini.</p></div><a className="text-link" href="#pustaka">Semua materi <ArrowRight size={16}/></a></div>}

    <section className="resource-filter-panel" aria-label="Cari dan pilih materi">
      <div className="resource-filter-main"><label className="resource-search"><Search size={20}/><span className="sr-only">Cari {isTeacher ? 'perangkat ajar' : 'materi'}</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); clearPreview(); }} placeholder={isTeacher ? 'Cari RPP, rubrik, asesmen pertemuan…' : 'Cari materi, jobsheet, atau nama part…'}/></label>
        {!stage && !isTeacher && <label className="resource-select"><span>Modul</span><select value={module} onChange={event => { setModule(event.target.value); clearPreview(); }}><option value="all">Semua modul</option>{resourceStages.map(item => <option value={item.key} key={item.key}>{item.title}</option>)}</select></label>}
        <label className="resource-select"><span>Siklus</span><select value={cycle} onChange={event => { setCycle(event.target.value); clearPreview(); }}><option value="all">Semua siklus</option><option>Siklus 2</option><option>Siklus 4</option><option>Umum</option></select></label>
      </div>
      <div className="resource-category-filters" role="group" aria-label="Jenis dokumen"><button type="button" aria-pressed={category === 'all'} onClick={() => { setCategory('all'); clearPreview(); }}>Semua jenis <span>{available.length}</span></button>{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => { setCategory(value); clearPreview(); }}>{value}<span>{available.filter(item => item.category === value).length}</span></button>)}</div>
    </section>

    {preview && selectedFile && <section ref={previewRef} tabIndex={-1} id={previewId} className="resource-preview" aria-label={`Pratinjau ${preview.title}`}>
      <div className="resource-preview-heading"><div><span className="eyebrow">PRATINJAU · {selectedFile.extension.toUpperCase()}</span><h2>{preview.title}</h2><p>{preview.cycle}{preview.meeting ? ` · Pertemuan ${preview.meeting}` : ''} · {readableSize(selectedFile.bytes)}</p></div><button type="button" className="resource-close" aria-label="Tutup pratinjau" onClick={() => { clearPreview(); openerRef.current?.focus(); }}><X size={21}/></button></div>
      {selectedFile.extension === 'pdf' ? <iframe className="resource-pdf" src={`${resourceUrl(selectedFile.asset)}#view=FitH`} title={`PDF ${preview.title}`}/> : selectedFile.extension === 'mp4' ? <video className="resource-video" controls playsInline preload="metadata" src={resourceUrl(selectedFile.asset)} aria-label={preview.title}/> : <div className="resource-image"><img src={resourceUrl(selectedFile.asset)} alt={preview.title}/></div>}
      <div className="resource-preview-footer"><p>Jika pratinjau tidak tampil, buka berkas di tab baru atau unduh.</p><div><a className="action ghost small" href={resourceUrl(selectedFile.asset)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>Buka berkas</a>{preview.formats.map(file => <DownloadLink file={file} key={file.asset} small/>)}</div></div>
    </section>}

    <div className="resource-results-heading"><div><h2>{stage ? 'Materi pendamping modul' : isTeacher ? 'Koleksi perangkat ajar' : 'Pilih bahan belajarmu'}</h2><p aria-live="polite">{filtered.length} koleksi{filtered.length !== available.length ? ` dari ${available.length}` : ''} · PDF dan sumber edit dikelompokkan</p></div>{(query || category !== 'all' || module !== 'all' || cycle !== 'all') && <button type="button" className="text-link" onClick={reset}><X size={15}/>Reset filter</button>}</div>
    {filtered.length ? <div className="resource-grid">{filtered.map(resource => {
      const canPreview = previewFormat(resource);
      const modelStage = resource.stages.length === 1 ? resourceStages.find(item => item.key === resource.stages[0]) : undefined;
      return <article className={`resource-card resource-kind-${resource.category === 'Media pembelajaran' ? 'slides' : resource.category === 'Model 3D' || resource.category === 'File CAD' ? 'model' : 'document'}`} key={resource.id}>
        <div className={`resource-card-visual${resource.cover ? ' has-cover' : ''}`}>{resource.cover ? <img src={resourceUrl(resource.cover)} alt={`Pratinjau ${resource.title}`} loading="lazy" decoding="async"/> : <><span className="resource-visual-icon"><CategoryIcon category={resource.category} size={35}/></span><span className="resource-visual-label">{resource.category}</span></>}<span className="resource-cycle">{resource.cycle}</span></div>
        <div className="resource-card-body"><div className="resource-card-meta"><span>{resource.category}</span>{resource.meeting && <span>Pertemuan {resource.meeting}</span>}</div><h3>{resource.title}</h3><p>{resource.description}</p><div className="resource-file-meta">{resource.formats.map(file => file.extension.toUpperCase()).join(' + ')}<span>·</span>{readableSize(resource.formats[0].bytes)}{resource.stages.length === 1 && <><span>·</span>{resource.moduleTitle}</>}</div>
          <div className="resource-card-actions">{canPreview ? <button type="button" className="action small" aria-controls={previewId} aria-expanded={preview?.id === resource.id} aria-label={`Pratinjau ${resource.title}`} onClick={event => { openerRef.current = event.currentTarget; setPreview(resource); }}><Eye size={16}/>Pratinjau</button> : resource.category === 'Model 3D' && modelStage ? <a className="action small" href={`#modul/${modelStage.module}/part3d`}><Box size={16}/>Lihat 3D</a> : <a className="action small" href={resourceUrl(resource.formats[0].asset)} download={resource.formats[0].name}><Download size={16}/>Unduh file</a>}
          {resource.formats.filter(file => canPreview || resource.category === 'Model 3D' || file !== resource.formats[0]).map(file => <DownloadLink file={file} key={file.asset} small/>)}</div>
        </div>
      </article>;
    })}</div> : <div className="resource-empty"><Search size={32}/><h3>Materi belum ditemukan.</h3><p>Coba kata lain atau tampilkan kembali seluruh koleksi.</p><button type="button" className="action ghost" onClick={reset}>Tampilkan semua</button></div>}
    {!stage && <div className="resource-library-note"><BookOpen size={20}/><p>{isTeacher ? 'Gunakan PDF untuk membaca dan mencetak. File Word tersedia untuk menyiapkan perangkat pembelajaran.' : 'Gunakan PDF untuk membaca atau mencetak. File CAD dibuka melalui Fusion atau aplikasi CAD yang sesuai; model STL interaktif tersedia di modul.'}</p></div>}
  </div>;
}
