// Use existing prepared assets for UI-only updates when original teaching files are unavailable.
// Normal builds still prepare all source documents as before.
if (!process.argv.includes('--use-prepared-assets')) await import('../scripts/prepare-jobsheets.mjs');
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function replace(source,from,to){if(!source.includes(from))throw Error('Local build source changed: '+from.slice(0,90));return source.replaceAll(from,to)}
function localSource(source,file){source="import { localFetch as fetch, downloadLocalWork } from '@/local/storage';\n"+source;
 if(file.endsWith('parametra.tsx')){
  // The standalone edition opens directly; omit the entire account control.
  const accountStart=source.indexOf('{data.user ? <div className="account">');
  const accountEnd=source.indexOf('</header>',accountStart);
  if(accountStart<0||accountEnd<0)throw Error('Local build account boundary missing');
  source=source.slice(0,accountStart)+source.slice(accountEnd);
  source=replace(source,'Jelajahi materi tanpa masuk. Masuk untuk menyimpan progres, hasil kuis, dan karya. Progres berasal dari pemeriksaan mandiri; keterampilan dinilai guru melalui hasil praktik.','Materi, kuis, dan model latihan dapat digunakan tanpa internet. Drive dan viewer Autodesk tetap memerlukan internet. Simpan berkas CAD asli secara terpisah; data browser dapat hilang jika data situs dibersihkan.');
 }else{
  const start=source.indexOf('function SignIn()');const end=source.indexOf('function NoData(',start);if(start<0||end<0)throw Error('SignIn boundary missing');source=source.slice(0,start)+'function SignIn(){return <div className="notice">Klik Sign in di kanan atas untuk menyimpan dan melanjutkan progres milikmu. Materi tetap dapat dibaca tanpa masuk.</div>}\n'+source.slice(end);
  const profileStart=source.indexOf('<div className="panel"><h2>Identitas belajar</h2>');
  const profileEnd=source.indexOf('<form className="panel" onSubmit=',profileStart);
  if(profileStart<0||profileEnd<0)throw Error('Local profile panel boundary missing');
  source=source.slice(0,profileStart)+'<div className="panel"><h2>Identitas belajar</h2><p className="mt-3">{data.profiles[0]?.name} · {data.profiles[0]?.class_name} · Presensi {data.profiles[0]?.attendance}</p><p className="smallprint mt-2">Profil mengikuti Sign in. Ubah identitas melalui avatar di kanan atas.</p></div>'+source.slice(profileEnd);
  source=replace(source,'<a className="text-link" href={`/api/portfolio?id=${encodeURIComponent(s.id)}`}><Download size={16}/> Unduh berkas</a>','<button className="text-link" onClick={() => void downloadLocalWork(s.id).catch(e=>toast.error(e.message))}><Download size={16}/> Unduh berkas lokal</button>');
  source=replace(source,'Karya berhasil dikumpulkan.','Karya tersimpan lokal. Periksa status antrean Drive di bagian atas.');
  source=replace(source,'Simpan file sumber, tautan model, dan refleksi. Setiap pengumpulan menjadi versi baru.','Kirim tugas melalui formulir Google Drive jika sudah diaktifkan guru. Penyimpanan salinan di browser tersedia secara terpisah di bawah.');
  source=replace(source,'Berkas disimpan di Parametra Lab, bukan otomatis di Drive.','Berkas disimpan di browser. Setelah Atur Drive aktif, salinan masuk antrean otomatis; tunggu bukti penerimaan di bagian atas.');
  source=replace(source,'Berkas dan refleksi dapat dilihat oleh kamu serta guru yang berwenang. Tautan eksternal mengikuti izin Drive/Autodesk. Hindari data pribadi sensitif.','Siapa pun yang memakai profil browser ini dapat melihat catatan dan berkas lokal. Versi ini tidak memiliki akun atau perlindungan akses guru. Simpan berkas asli di folder terpisah.');
  source=replace(source,">Kumpulkan versi terbaru<",">Simpan versi terbaru secara lokal<");
  source=replace(source,"{busy ? 'Mengumpulkan…' : 'Kumpulkan karya'}","{busy ? 'Menyimpan…' : 'Simpan karya di perangkat'}");
  source=replace(source,">Dikumpulkan {new Date(s.created)",">Disimpan lokal {new Date(s.created)");
  source=replace(source,'title="Dampingi prosesnya." text="Tinjau jejak belajar, beri umpan balik, dan gunakan data aktivitas sebagai pelengkap observasi."','title="Ruang tinjauan lokal." text="Hanya memuat data siswa yang sedang masuk pada browser ini; bukan dashboard seluruh kelas atau ruang guru yang terlindungi."');
  source=replace(source,'Ringkasan kelas','Ringkasan perangkat ini');
  source=replace(source,'Tinjau karya siswa','Tinjau karya pada perangkat ini');
  source=replace(source,'Simpan penilaian','Simpan catatan penilaian lokal');
  source=replace(source,'Kuis formatif untuk belajar, bukan pengganti penilaian praktik oleh guru.','Kuis latihan lokal; jawaban dinilai pada perangkat ini. Hasilnya bukan nilai ujian resmi atau pengganti penilaian praktik oleh guru.');
 }
 return source;
}
const js=await build({absWorkingDir:root,entryPoints:['local/main.tsx'],bundle:true,write:false,format:'iife',platform:'browser',target:['es2022'],minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_LOCAL_EDITION':'"true"'},legalComments:'inline',plugins:[{name:'local-edition',setup(b){b.onResolve({filter:/^next\/dynamic$/},()=>({path:path.join(root,'local/dynamic.tsx')}));b.onLoad({filter:/[\\/]app[\\/](?:parametra|components[\\/]learning)\.tsx$/},async args=>({contents:localSource(await readFile(args.path,'utf8'),args.path),loader:'tsx',resolveDir:path.dirname(args.path)}))}}]});
const cssPath=path.join(root,'app/globals.css');
const cssSource=(await readFile(cssPath,'utf8')).replace('@import "tailwindcss";','@import "tailwindcss" source(none);')+'\n@source "./";\n@source "../components";\n@source "../local";';
const css=await postcss([tailwind({base:root,optimize:true})]).process(cssSource,{from:cssPath});
const icon=await readFile(path.join(root,'public/favicon.svg'),'utf8');
const html=`<!doctype html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#125bce"><meta name="color-scheme" content="light"><title>Parametra Lab — Versi Lokal</title><meta name="description" content="Pembelajaran Autodesk Fusion kelas XI. Buka langsung tanpa server dan tanpa login."><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}"><style>${css.css.replaceAll('</style','<\\/style')}
</style></head><body><div id="root"><p style="padding:32px;font-family:Arial,sans-serif">Memuat Parametra Lab…</p></div><noscript>Aktifkan JavaScript untuk menggunakan modul, kuis, dan Lab 3D.</noscript><script>${js.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
await writeFile(path.join(root,'index.html'),html,'utf8');
console.log(`index.html dibuat: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB. Mandiri: tidak memerlukan server, CDN, atau login.`);
