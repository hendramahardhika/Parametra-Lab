"use client";
import { ExternalLink, Upload } from 'lucide-react';
import config from '@/lib/drive-upload.json';

export function DriveUpload() {
    if (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true') return <section className="panel" aria-labelledby="drive-upload-title"><div className="panel-head"><h2 id="drive-upload-title">Pengiriman karya otomatis</h2><Upload size={20}/></div><p className="mt-3">Simpan berkas dan refleksi melalui formulir Portofolio di bawah. Salinan lokal disimpan lebih dulu; setelah Atur Drive diaktifkan, karya masuk antrean pengiriman ke Drive guru secara otomatis.</p><p className="smallprint mt-3">Periksa status di bagian atas halaman. Karya baru dianggap diterima setelah Google memberi bukti penerimaan. Memilih file di Viewer atau menyimpan draf Lab 3D belum mengumpulkan karya.</p></section>;
    // Only a public deployment URL belongs here, never a password or OAuth secret.
    const ready = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.webAppUrl);
    return <section className="panel" aria-labelledby="drive-upload-title">
        <div className="panel-head"><h2 id="drive-upload-title">Kumpulkan tugas ke Google Drive</h2><span className="pill">{ready ? 'Pengumpulan daring' : 'Belum diaktifkan'}</span></div>
        <p>Pilih berkas CAD atau PDF, isi nama, kelas, dan modul melalui formulir pengumpulan. Formulir dibuka di tab baru dan memerlukan internet, bukan akun ChatGPT.</p>
        {ready ? <a className="action mt-4" href={config.webAppUrl} target="_blank" rel="noopener noreferrer"><Upload size={17}/> Buka formulir pengumpulan <ExternalLink size={16}/></a> : <p className="notice mt-4">Guru masih menyiapkan izin Google Drive. Belum ada berkas yang dapat dikirim melalui fitur ini.</p>}
        <p className="smallprint mt-4">Tugas baru dianggap terkirim setelah formulir menampilkan nomor bukti penerimaan. Riwayat di bawah adalah arsip terpisah, bukan daftar unggahan Drive.</p>
    </section>;
}
