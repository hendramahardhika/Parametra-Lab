// Mechanical exports from the same authoritative question data used by the form.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const dir=path.resolve('integrations/google-form');
const context=vm.createContext({});
vm.runInContext(await readFile(path.join(dir,'Diagnostik-Fusion-Final.gs'),'utf8'),context);
const data=context.paketDiagnostikFinal_();
const student=['# '+data.judul,'',data.deskripsi,''];
const teacher=['# Kunci dan rubrik diagnostik final untuk guru','',
  'Gunakan bersama versi kuis 1.2 tanggal 29 Oktober 2026. Kunci tersimpan dalam pengaturan kuis untuk menilai PG otomatis. Sebelum publikasi, atur Rilis nilai menjadi Nanti, setelah peninjauan manual dan periksa tampilan jawaban benar kepada responden. Jangan membagikan dokumen ini kepada siswa sebelum rangkaian pengukuran yang memerlukan kerahasiaan soal selesai.','',
  '## Kisi-kisi dan kunci pilihan ganda','',
  '| Soal | Kunci | Jawaban | Indikator | Bagian inti |',
  '| --- | --- | --- | --- | --- |'];
for(const [i,page] of data.halaman.entries()) {
  student.push('## Halaman '+(i+1)+' '+page.judul,'',page.petunjuk,'');
  for(const q of page.items) {
    const title=(q.kode?q.kode+'. ':'')+q.tanya;
    student.push('**'+title+'**','');
    if(q.petunjuk)student.push(q.petunjuk,'');
    if(q.gambar) {
      const absolute=path.join(dir,'gambar-diagnostik-final',q.gambar+'.png').replaceAll('\\','/');
      student.push('![Gambar untuk '+q.kode+'](<'+absolute+'>)','',q.alt,'');
    }
    if(q.opsi)student.push(...q.opsi.map(o=>'- '+o),'');
    else student.push(q.tipe==='essay'?'Jawaban paragraf.':'Jawaban singkat.','');
    if(Number.isInteger(q.benar)) teacher.push('| '+q.kode+' | '+String.fromCharCode(65+q.benar)+' | '+q.opsi[q.benar].slice(3)+' | '+q.indikator+' | '+(q.inti?'Ya':'Tidak; assembly')+' |');
  }
}
teacher.push('','## Rubrik uraian pengetahuan','');
for(const q of data.halaman.flatMap(h=>h.items).filter(q=>q.rubrik))teacher.push('### '+q.kode,'',q.tanya,'',...q.rubrik.map(r=>'- '+r),'','Skor maksimum 3; jika tidak menunjukkan indikator, skor 0. Nilai setiap unsur secara independen.');
teacher.push('','## Penghitungan nilai','',
  '- B1–B12: otomatis 1 untuk benar, 0 untuk salah/Belum tahu; maksimum 12. Contoh B2 berkunci C: memilih A mendapat 0/1, memilih C mendapat 1/1.',
  '- C1–C2: masing-masing maksimum 3; maksimum gabungan 6, dinilai manual oleh guru. Total kuis sebelum uraian diperiksa belum menjadi nilai akhir.',
  '- Buka Jawaban/Respons > Individual di Google Forms untuk memeriksa pilihan dan poin per soal. Identitas dan angket diberi 0 poin tanpa kunci benar/salah.',
  '- Nilai keseluruhan pengetahuan = `(jumlah B + jumlah C) / 18 × 100`.',
  '- Calon bagian inti lintas siklus: B1–B11 + C1–C2, maksimum 17. B12 hanya dinilai setelah sesuai cakupan pengukuran assembly.',
  '- Bandingkan hanya bagian dengan indikator, kondisi tes, dan aturan penilaian yang sebanding. Jangan menyamakan skor dari materi berbeda.',
  '- D dan E bukan nilai pengetahuan. Kategori belum mencoba/belum praktik tidak diberi skor numerik.',
  '- F3–F4 adalah refleksi kebutuhan dan tidak dinilai benar/salah.',
  '- Identitas yang belum mengisi belum memiliki nilai; jangan otomatis mengubah ketiadaan respons menjadi nol.','',
  'Rubrik praktik RPP tetap digunakan untuk menilai karya nyata. Instrumen ini belum melalui validasi/uji empiris.');
await writeFile(path.join(dir,'SOAL-DIAGNOSTIK-FINAL-SISWA.md'),student.join('\n')+'\n','utf8');
await writeFile(path.join(dir,'KUNCI-DIAGNOSTIK-FINAL-GURU.md'),teacher.join('\n')+'\n','utf8');
console.log('Generated student questions and separate teacher key from the form data.');
