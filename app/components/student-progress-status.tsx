"use client";
import { useEffect, useState } from 'react';
import { Download, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { StudyData } from './learning';
import { exportLegacyData, exportLocalData, legacyDataAvailable } from '@/local/storage';

export function StudentProgressStatus({ data }: { data: StudyData }) {
    const [legacy, setLegacy] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_LOCAL_EDITION !== 'true') return;
        let alive = true;
        void legacyDataAvailable().then(value => { if (alive) setLegacy(value); }).catch(() => {});
        return () => { alive = false; };
    }, []);
    if (process.env.NEXT_PUBLIC_LOCAL_EDITION !== 'true') return null;
    const profile = data.profiles[0];
    async function exportData(old = false) {
        setBusy(true);
        try { await (old ? exportLegacyData() : exportLocalData()); }
        catch (error) { toast.error(error instanceof Error ? error.message : 'Ekspor belum berhasil.'); }
        finally { setBusy(false); }
    }
    return <>
        {profile && <section className="panel mb-5" aria-label="Progres siswa aktif">
            <div className="panel-head"><div><span className="eyebrow muted">PROGRES SISWA AKTIF</span><h2 className="mt-2">{profile.name}</h2></div><UserCircle size={28}/></div>
            <p>{profile.class_name} · Nomor presensi {profile.attendance}</p>
            <p className="smallprint mt-3">Data di halaman ini hanya untuk profil tersebut pada browser ini. Setelah Atur Drive diaktifkan, progres, kuis, dan karya Portofolio masuk antrean pengiriman otomatis. Periksa bukti sinkronisasi di bagian atas. Memulihkan progres ke browser lain belum otomatis.</p>
            <button className="action ghost small mt-4" disabled={busy} onClick={() => void exportData()}><Download size={16}/> Ekspor progres saya</button>
            <p className="smallprint mt-2">Ekspor berupa catatan JSON, tidak termasuk file CAD dan belum dapat diimpor melalui website.</p>
        </section>}
        {legacy && <details className="notice mb-5"><summary>Arsip lama sebelum pemisahan siswa</summary><p className="mt-3">Data lama tetap disimpan, tetapi tidak otomatis diberikan kepada siswa tertentu karena pemiliknya belum dapat dipastikan.</p><button className="action ghost small mt-3" disabled={busy} onClick={() => void exportData(true)}>Ekspor catatan lama</button><p className="smallprint mt-2">File CAD lama tetap berada di penyimpanan browser, tidak termasuk ekspor JSON. Jangan bersihkan data situs jika masih diperlukan.</p></details>}
    </>;
}
