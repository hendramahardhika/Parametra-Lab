import { useState } from 'react';
import { exportLocalData } from './storage';
import { toast } from 'sonner';
export function LocalNotice(){
 const [busy,setBusy]=useState(false);
 async function exportNotes(){setBusy(true);try{await exportLocalData();toast.success('Catatan diekspor. Simpan juga berkas CAD asli secara terpisah.')}catch(e){toast.error(e instanceof Error?e.message:'Ekspor belum berhasil.')}finally{setBusy(false)}}
 return <div className="notice local-notice"><div><b>Versi lokal · tanpa login</b><p>Progres dan arsip lokal hanya tersimpan di browser ini. Pengiriman ke guru dilakukan terpisah melalui formulir Google Drive di Portofolio, setelah diaktifkan guru.</p></div><button className="action ghost small" disabled={busy} onClick={()=>void exportNotes()}>{busy?'Mengekspor…':'Ekspor catatan'}</button></div>
}
