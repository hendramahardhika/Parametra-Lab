# Google Form diagnostik final Autodesk Fusion

Paket versi kuis 1.2 ini membuat Google Form untuk kondisi awal sebelum pembelajaran berbantuan Parametra Lab. Struktur menggunakan form diagnostik sebelumnya, dengan soal visualisasi, pengecoh yang diperbaiki, dua uraian pengetahuan, dan enam butir kemandirian awal. **Mode kuis aktif: 12 pilihan ganda memiliki kunci dan poin otomatis; 2 uraian memiliki poin untuk penilaian manual guru.** Versi ini memperbaiki kegagalan `setPoints(0)` saat membuat identitas/angket dan dapat melanjutkan form parsial versi kuis 1.1.

## Cara membuat form

1. Buka [Google Apps Script](https://script.google.com/) dengan akun guru, lalu buat **Proyek baru**. Pisahkan dari proyek form lama dan sinkronisasi Drive.
2. Buka `Diagnostik-Fusion-Final.gs` dari paket ini. Salin **seluruh isi file**, termasuk data gambar pada bagian paling bawah, ke `Code.gs`. Simpan.
3. Pilih fungsi **buatDiagnostikFusionFinal**, lalu klik **Jalankan**. Tinjau dan setujui izin Google untuk membuat/mengakses Google Forms pada akun tersebut.
4. Setelah eksekusi selesai, buka **Log eksekusi**, lalu buka URL berlabel **EDIT GURU**. Skrip membuat form sebagai **draf**.
5. Buka **Setelan > Jadikan ini sebagai kuis**; mode kuis sudah diaktifkan skrip. Pada **Rilis nilai**, pilih **Nanti, setelah peninjauan manual**. Pada pengaturan yang boleh dilihat responden, nonaktifkan **Jawaban yang benar** dan informasi nilai lain yang belum ingin dibagikan. Waktu rilis nilai tidak memiliki setter di FormApp, sehingga langkah ini harus dilakukan di editor. Pengaturan awal Google dapat merilis nilai segera; jangan membagikan form sebelum memeriksanya.
6. Periksa 6 halaman, 4 gambar, kunci B1–B12, poin 1 pada setiap PG, dan poin 3 pada C1–C2 melalui editor/Pratinjau. Uji satu pengisian contoh di form uji: B2 kunci C, pilihan A harus mendapat 0/1, pilihan C mendapat 1/1. Telaah soal bersama guru pamong; revisi yang diperlukan dilakukan sebelum pengumpulan data utama.
7. Klik **Publikasikan** di Google Forms dan atur siapa yang dapat merespons. Pastikan akun/perangkat siswa yang dituju dapat membuka form. Bagikan tautan responden, bukan URL edit.
8. Buka tab **Jawaban/Respons > Individual** untuk melihat pilihan dan poin setiap siswa; pilihan ganda dinilai otomatis oleh Google Forms. Tampilan per pertanyaan juga dapat digunakan untuk meninjau jawaban kelas. Jika menginginkan rekap Google Sheets, hubungkan melalui ikon Sheets. Skrip tidak membuat spreadsheet atau trigger tambahan; penilaian PG memakai fitur kuis bawaan.

Tidak memerlukan deployment Web app, URL `/exec`, pengunggahan gambar manual, atau tautan gambar publik. Keempat PNG sudah tertanam dalam satu file skrip. Folder gambar hanya disediakan untuk peninjauan atau penyuntingan manual.

**Status paket:** kode dan struktur telah diuji dengan mock lokal; belum dieksekusi pada akun Google dan belum ada URL Google Form nyata yang dihasilkan dari sesi ini. Warna tema dan header dekoratif diatur melalui editor Google Forms bila diinginkan.

## Struktur form

| Halaman | Isi | Isian wajib |
| --- | --- | ---: |
| 1 | Nama, kelas XI TP 1/XI TP 2, presensi ketik; A1 pengalaman, A2 perangkat, A3 internet | 6 |
| 2 | B1–B12 pilihan ganda, empat opsi materi dan E Belum tahu; gambar pada B2, B9, B10, B11 | 12 |
| 3 | C1–C2 uraian penalaran yang dinilai guru | 2 |
| 4 | D1–D9 pemetaan kesulitan, termasuk visualisasi bentuk 2D–3D | 9 |
| 5 | E1–E6 frekuensi perilaku belajar mandiri awal | 6 |
| 6 | F1 kebutuhan utama, F2 dukungan yang dapat diakses, F3–F4 refleksi terbuka | 4 |
| Total | 3 identitas dan 36 pertanyaan | **39** |

Ada lima perpindahan halaman, sehingga keseluruhannya enam halaman. Empat gambar dan judul bagian bukan isian tambahan. Butir skala ditampilkan sebagai pertanyaan satu per satu agar pilihan terbaca pada HP tanpa tabel kisi yang lebar.

Waktu 30–35 menit adalah perkiraan yang perlu diperiksa melalui uji coba, bukan durasi yang telah terukur. Form tidak menggunakan timer. Siswa tidak perlu membuka Autodesk Fusion atau Parametra Lab untuk menjawab. Soal berfungsi memetakan kondisi awal; pilihan Belum tahu disediakan untuk semua pilihan ganda pengetahuan. Pertanyaan refleksi menerima keterangan belum berpengalaman atau tidak mengalami kesulitan.

## Mengulang skrip dan form lama

- ID kuis disimpan pada Script Properties bernama `PARAMETRA_DIAGNOSTIK_FINAL_V2_QUIZ_FORM_ID`. ID ini terpisah dari versi form biasa V1, form diagnostik lama, dan angket tanggapan. Jika Anda pernah menjalankan versi biasa V1, kode kuis ini membuat form baru; respons pada form terdahulu tidak dipindahkan atau diubah.
- Menjalankan kembali fungsi pada proyek yang sama setelah selesai hanya mencetak tautan. Item, pengaturan, dan jawaban yang telah terkumpul tidak diubah.
- Jika pembuatan terhenti di tengah, jalankan kembali pada proyek yang sama. Skrip melanjutkan item berdasarkan judul/tipe dan tidak menghapus item yang sudah ada. Jangan mengganti judul item atau memublikasikan form selama pembuatan belum selesai.
- Jika form yang belum selesai sudah memiliki respons, skrip menghentikan perubahan. Jika ada duplikasi judul, skrip juga menghentikan proses agar dapat ditinjau melalui editor.
- Perubahan pada kode setelah status selesai tidak otomatis diterapkan ke form lama. Gunakan editor sebelum penelitian, atau proyek baru untuk versi instrumen baru. Jangan mencampur hasil dari versi soal berbeda tanpa pencatatan.
- Lock mencegah dua pemanggilan fungsi pada proyek yang sama membuat form secara bersamaan. File yang sudah dihapus dari akun tidak dibuat ulang diam-diam; pemanggilan akan menghasilkan kesalahan untuk ditinjau.

## Penilaian dan data penelitian

Form berupa **kuis dengan kunci jawaban dan poin aktif**. Kunci B1–B12 disimpan sebagai pengaturan jawaban benar di Google Forms, sehingga guru dapat langsung melihat benar/salah dan poin per soal setelah pengiriman. Agar kunci tidak langsung dibuka kepada siswa pada pretest, pilih rilis nilai setelah peninjauan manual melalui editor sebelum publikasi. Kunci dan rubrik juga tersedia dalam `KUNCI-DIAGNOSTIK-FINAL-GURU.md`.

- Pilihan ganda B1–B12: benar = 1; salah atau E Belum tahu = 0, otomatis melalui kunci kuis. Catat proporsi Belum tahu per butir secara terpisah. Contoh B2: kunci C; jawaban A memperoleh 0/1, C memperoleh 1/1.
- Uraian C1–C2: masing-masing 0–3 menurut rubrik, **dinilai manual** pada tab Jawaban/Respons. Nilai maksimum kuis 18. Angka total yang terlihat sebelum uraian diperiksa belum merupakan nilai akhir. Nilai pengetahuan keseluruhan = `(skor B + skor C) / 18 × 100` setelah kedua uraian selesai dinilai.
- Semua identitas, pengalaman, akses, kesulitan, kemandirian, dan kebutuhan menggunakan nilai bawaan 0 poin tanpa kunci jawaban benar/salah. Skrip hanya memanggil `setPoints` untuk poin positif dan tidak memanggil `setPoints(0)`. Bagian tersebut tidak memengaruhi nilai pengetahuan.
- Respons yang belum ada atau pengisian yang tidak lengkap secara administratif tidak otomatis diberi nol. Angka nol digunakan ketika jawaban pada tes memang salah/Belum tahu atau uraian belum menunjukkan indikator yang dinilai.
- Data ini mengukur pemahaman konsep dan penalaran CAD sesuai kisi-kisi. Keterampilan praktik tetap diperiksa melalui model/file serta rubrik RPP yang berlaku. Paket tidak mengubah bobot atau KKTP praktik.

**Kesulitan D1–D9:** kolom jawaban terakhir adalah kategori belum mempelajari/mencoba, bukan skor 6 atau skor 5. Laporkan terpisah. Untuk distribusi/rata-rata numerik, hanya gunakan respons 1–5 pada butir tersebut; cantumkan jumlah siswa yang menjawab numerik.

**Kemandirian E1–E6:** gunakan enam pernyataan dan skala yang sama pada akhir Siklus I dan II. Sesuaikan petunjuk waktu menjadi pengalaman selama siklus yang dinilai. Jawaban Belum pernah praktik CAD diperlakukan sebagai belum dapat dinilai, bukan Tidak pernah (1). Jika menggunakan rerata per siswa, jelaskan jumlah butir terjawab dan aturan kelengkapannya; jangan membandingkan rerata dari kumpulan butir berbeda seolah-olah setara. Angket adalah laporan diri, sehingga diperkuat observasi guru pamong atas perilaku yang sama. Meminta bantuan yang tepat bukan perilaku negatif.

**Perbandingan pengetahuan:** B1–B11 dan C1–C2 dirancang sebagai calon indikator inti yang muncul pada materi pertemuan 1–3 dan diterapkan lagi pada pertemuan 4–6. B12 adalah indikator assembly, sehingga bukan bagian inti untuk tes akhir Siklus I bila assembly belum diajarkan. Jika memakai bagian inti yang setara pada tiga tahap, maksimum skornya **17**; jangan membandingkan nilai total `/18` dari pretest dengan nilai inti `/17` atau tes materi berbeda. Susun padanan soal yang ditelaah dari kisi-kisi dan pertahankan kondisi tes serta penskoran. Kesetaraan dan kualitas butir tetap perlu diuji; label inti pada kode bukan bukti validasi.

F3–F4 dianalisis sebagai tema kebutuhan/strategi. Gunakan jawaban aktual dan kutipan tanpa identitas pada laporan. Temuan dapat mendukung pemilihan media cetak, offline, pendampingan, maupun web sesuai kebutuhan dan akses. Asesmen awal tidak membuktikan efektivitas Parametra Lab.

## Pemeriksaan sebelum penelitian

Final di sini berarti paket siap dijalankan dan ditelaah. Instrumen belum melalui validasi ahli, uji keterbacaan pada siswa, analisis kesukaran/daya pembeda, atau uji reliabilitas. Sebelum digunakan sebagai instrumen PTK, periksa kesesuaian indikator bersama guru pamong/DPL dan lakukan uji coba seperlunya. Kunci dan rubrik adalah usulan penilaian tes ini; kriteria praktik pada RPP tidak berubah.

Identitas digunakan untuk pencocokan antarwaktu. Email tidak dikumpulkan oleh skrip dan ringkasan jawaban publik dinonaktifkan. Form tidak membatasi satu respons per akun sehingga guru perlu memeriksa pengisian ganda berdasarkan kelas/presensi. Kebijakan akun sekolah tetap dapat memengaruhi akses. Bagikan hanya tautan responden; berkas kunci/kode/panduan dan respons digunakan oleh guru.

## Rujukan teknis

- [FormApp dan pembuatan form sebagai draf](https://developers.google.com/apps-script/reference/forms/form-app).
- [Form dan pengaturan jawaban](https://developers.google.com/apps-script/reference/forms/form).
- [ImageItem untuk gambar tertanam](https://developers.google.com/apps-script/reference/forms/image-item).
- [MultipleChoiceItem: kunci pilihan dan poin](https://developers.google.com/apps-script/reference/forms/multiple-choice-item).
- [ParagraphTextItem: poin uraian](https://developers.google.com/apps-script/reference/forms/paragraph-text-item).
- [Bantuan Google: membuat, menilai, dan merilis nilai kuis](https://support.google.com/docs/answer/7032287?hl=en).

Pengujian lokal: `node scripts/check-diagnostic-final.mjs`. Gambar dibuat ulang melalui `scripts/build-diagnostic-final-assets.py`. Naskah siswa dan kunci dibuat ulang melalui `node scripts/build-diagnostic-final-notes.mjs`.
