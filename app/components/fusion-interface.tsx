"use client";

import { useState } from 'react';
import { ExternalLink, Monitor, Lightbulb } from 'lucide-react';
import { fusionInterfaceDriveUrl, fusionInterfaceHelpUrl, fusionInterfaceImage, fusionInterfaceParts } from '@/lib/fusion-interface';

export function FusionInterface() {
  const [selected, setSelected] = useState(1);
  const part = fusionInterfaceParts[selected - 1];
  const imageUrl = `${process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? 'public/' : '/'}${fusionInterfaceImage}`;

  return <section className="fusion-interface" aria-labelledby="fusion-interface-title">
    <div className="panel fusion-interface-overview">
      <div className="panel-head"><div><span className="eyebrow muted">KENALI RUANG KERJAMU</span><h2 id="fusion-interface-title" className="mt-2">Interface Autodesk Fusion</h2></div><Monitor size={28} aria-hidden="true"/></div>
      <p>Interface berarti antarmuka atau tampilan tempat kamu bekerja. Amati nomor pada gambar, lalu pilih bagian yang ingin kamu pelajari.</p>
      <figure className="fusion-interface-figure">
        <a href={imageUrl} target="_blank" rel="noreferrer" aria-label="Buka gambar antarmuka Fusion ukuran penuh di tab baru">
          <img src={imageUrl} width={1008} height={567} alt="Antarmuka Fusion dengan nomor 1 Application Bar, 2 Data Panel, 3 Profile and Help, 4 Toolbar, 5 Browser, 6 ViewCube, 7 Canvas and Marking Menu, 8 Navigation Bar and Display Settings, dan 9 Timeline."/>
        </a>
        <figcaption>Klik gambar untuk membuka ukuran penuh di tab baru. Nomor penjelasan mengikuti gambar ini.</figcaption>
      </figure>
      <p className="smallprint">Gambar referensi menggunakan tampilan Fusion versi sebelumnya. Letak ikon dan pilihan menu pada komputer kamu dapat berbeda karena versi aplikasi, workspace, atau pengaturan akun.</p>
    </div>

    <div className="fusion-interface-layout">
      <nav className="panel fusion-interface-menu" aria-label="Pilih bagian antarmuka Fusion">
        <h3>Bagian antarmuka</h3>
        <div className="fusion-interface-options">{fusionInterfaceParts.map(item => <button key={item.number} type="button" aria-pressed={selected === item.number} aria-controls="fusion-interface-detail" onClick={() => setSelected(item.number)}>
          <span className="fusion-interface-number">{item.number}</span><span>{item.name}</span>
        </button>)}</div>
      </nav>
      <article id="fusion-interface-detail" className="panel fusion-interface-detail" aria-live="polite" aria-atomic="true">
        <div className="fusion-interface-detail-heading"><span className="fusion-interface-number">{part.number}</span><div><h3>{part.name}</h3><p>{part.title}</p></div></div>
        <p className="fusion-interface-location"><b>Letak:</b> {part.location}</p>
        <p>{part.description}</p>
        <ul>{part.points.map(point => <li key={point}>{point}</li>)}</ul>
        <div className="fusion-interface-practice"><Lightbulb size={21} aria-hidden="true"/><p><b>Coba di Fusion:</b> {part.practice}</p></div>
        <div className="fusion-interface-paging">
          <button className="action ghost small" type="button" disabled={selected === 1} onClick={() => setSelected(value => value - 1)}>Sebelumnya</button>
          <span>{selected} dari {fusionInterfaceParts.length}</span>
          <button className="action small" type="button" disabled={selected === fusionInterfaceParts.length} onClick={() => setSelected(value => value + 1)}>Berikutnya</button>
        </div>
      </article>
    </div>
    <div className="notice"><b>Ingat:</b> gambar ini adalah panduan mengenali antarmuka. Latihan membuat desain tetap dilakukan pada aplikasi Autodesk Fusion di komputer.</div>
    <div className="link-row smallprint fusion-interface-sources">
      <a className="text-link" href={fusionInterfaceDriveUrl} target="_blank" rel="noreferrer">Gambar referensi dari guru <ExternalLink size={14}/></a>
      <a className="text-link" href={fusionInterfaceHelpUrl} target="_blank" rel="noreferrer">Panduan resmi Autodesk <ExternalLink size={14}/></a>
    </div>
  </section>;
}
