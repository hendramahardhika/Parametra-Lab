"use client";
import { useEffect, useState } from 'react';
import { Cloud, CloudCheck, CloudOff, RefreshCw, Settings2, ExternalLink, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { configureDriveSync, driveSyncChanged, driveSyncState, flushDriveSync, pauseDriveSync, postDrivePayload, readDriveSyncConfig, reportDriveSyncError, type DriveSyncState } from '@/lib/drive-sync';
import { queueActiveDriveBackup } from '@/local/storage';
import { studentIdentityChanged } from '@/lib/student-identity';
import destinations from '@/lib/drive-sync.json';

const empty: DriveSyncState = { configured: false, hasCode: false, paused: false, pending: 0, lastSync: '', error: '', busy: false };
export function DriveAutoSync() {
    const [status, setStatus] = useState(empty), [open, setOpen] = useState(false), [url, setUrl] = useState(''), [code, setCode] = useState(''), [working, setWorking] = useState(false), [message, setMessage] = useState('');
    const local = process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true';
    useEffect(() => {
        if (!local) return;
        let live = true;
        const refresh = () => { void driveSyncState().then(s => { if (live) setStatus(s); }).catch(e => { if (live) setStatus(s => ({ ...s, error: e.message })); }); };
        const backup = () => { void queueActiveDriveBackup().then(() => flushDriveSync()).catch(reportDriveSyncError); refresh(); };
        const online = () => { void flushDriveSync(true).catch(reportDriveSyncError); refresh(); };
        refresh(); backup();
        const timer = setInterval(() => { void flushDriveSync().catch(reportDriveSyncError); refresh(); }, 15000);
        window.addEventListener(driveSyncChanged, refresh); window.addEventListener(studentIdentityChanged, backup); window.addEventListener('online', online); window.addEventListener('offline', refresh); window.addEventListener('focus', refresh);
        return () => { live = false; clearInterval(timer); window.removeEventListener(driveSyncChanged, refresh); window.removeEventListener(studentIdentityChanged, backup); window.removeEventListener('online', online); window.removeEventListener('offline', refresh); window.removeEventListener('focus', refresh); };
    }, [local]);
    if (!local) return null;
    function show() { setUrl(readDriveSyncConfig().url); setCode(''); setMessage(''); setOpen(true); }
    async function activate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); if (working) return; setWorking(true); setMessage('');
        try {
            configureDriveSync(url, code);
            await postDrivePayload(url.trim(), code, { version: 1, action: 'ping' });
            configureDriveSync(url, code, true);
            await queueActiveDriveBackup();
            setCode(''); setMessage('Layanan Google terverifikasi. Antrean akan dikirim otomatis; tunggu status tersinkron.');
            void flushDriveSync(true).catch(reportDriveSyncError);
        } catch (e) { setMessage(e instanceof Error ? e.message : 'Aktivasi belum berhasil.'); }
        finally { setWorking(false); }
    }
    const synced = status.configured && status.hasCode && !status.paused && !status.pending && !!status.lastSync && !status.error;
    const label = !status.configured ? 'Drive belum diaktifkan' : status.paused || !status.hasCode ? 'Drive menunggu aktivasi' : status.busy ? 'Mengirim pembaruan ke Drive…' : status.error ? 'Pembaruan Drive menunggu' : status.pending ? `${status.pending} kiriman menunggu Drive` : synced ? 'Progres tersinkron ke Drive' : 'Drive siap menerima pembaruan';
    const root = process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? 'public/integrations/google-drive/' : '/integrations/google-drive/';
    return <><div className={`drive-sync-strip${synced ? ' is-synced' : ''}`} role="status"><span>{synced ? <CloudCheck size={18}/> : status.error ? <CloudOff size={18}/> : <Cloud size={18}/>}<b>{label}</b>{status.lastSync && <small>Konfirmasi terakhir: {new Date(status.lastSync).toLocaleString('id-ID')}</small>}</span><div>{status.configured && status.hasCode && !status.paused && <button disabled={status.busy} onClick={() => void queueActiveDriveBackup().then(() => flushDriveSync(true)).catch(reportDriveSyncError)}><RefreshCw size={14}/> Coba sinkron</button>}<button onClick={show}><Settings2 size={15}/> Atur Drive</button></div></div>
        <Dialog open={open} onOpenChange={next => { if (!working) { setOpen(next); if (!next) setCode(''); } }}><DialogContent className="student-dialog drive-sync-dialog"><DialogTitle>Sinkronisasi otomatis Google Drive</DialogTitle><DialogDescription>Progres, kuis, dan karya yang disimpan lewat Portofolio dikirim ke layanan Google guru. Draf Lab 3D tetap disimpan terpisah.</DialogDescription>
            <div className="notice"><b>Aktivasi satu kali oleh guru</b><ol><li>Buat proyek di <a href="https://script.google.com/home" target="_blank" rel="noreferrer">Google Apps Script</a>, lalu tambahkan tiga berkas berikut.</li><li>Isi Script property <code>CLASS_CODE</code> (minimal 12 karakter), jalankan <code>setupAutoSync</code>, dan setujui izin pada akun Google pemilik folder.</li><li>Deploy sebagai Web app yang dijalankan sebagai akun guru. Salin URL <code>/exec</code> ke kolom di bawah.</li></ol><div className="drive-sync-downloads">{['Code.gs', 'Sync.gs', 'Index.html', 'AKTIVASI.md'].map(file => <a key={file} href={root + file} download><Download size={13}/>{file}</a>)}</div><p className="smallprint mt-2">Panduan menjelaskan izin deployment dan batas penggunaan kode kelas. Sheet serta isi folder Drive tetap mengikuti izin Google Anda.</p></div>
            <form className="student-form" onSubmit={activate}><fieldset className="student-fields" disabled={working}><label className="field">URL deployment Apps Script<input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec"/></label><label className="field">Kode sinkronisasi dari guru<input type="password" minLength={12} maxLength={200} required autoComplete="off" value={code} onChange={e => setCode(e.target.value)} placeholder="Kode CLASS_CODE, bukan PIN siswa"/></label><p className="smallprint mb-4">Kode disimpan hanya untuk tab ini. PIN siswa dan kata sandi Google tidak dikirim oleh web.</p><button className="action student-submit" disabled={working}>{working ? 'Memeriksa layanan Google…' : 'Verifikasi dan aktifkan otomatis'}</button></fieldset></form>
            {message && <p className="notice" role="status">{message}</p>}{status.error && <p className="notice warning" role="alert">{status.error}</p>}<div className="drive-sync-links"><a href={destinations.spreadsheetUrl} target="_blank" rel="noreferrer">Buka rekap di Google Sheets <ExternalLink size={13}/></a><a href={destinations.folderUrl} target="_blank" rel="noreferrer">Buka folder Drive <ExternalLink size={13}/></a></div>{status.configured && <button className="student-sign-out" onClick={pauseDriveSync}>Jeda pengiriman berikutnya</button>}<p className="smallprint">Akses panel lokal belum khusus guru. Kode kelas membantu membatasi kiriman, tetapi tidak memverifikasi identitas siswa. Sinkronisasi ini menyimpan cadangan daring; pemulihan otomatis ke browser lain belum tersedia.</p>
        </DialogContent></Dialog></>;
}
