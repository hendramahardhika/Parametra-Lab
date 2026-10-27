# Pemeriksaan Parametra Lab

## Perpindahan kelas panel guru — 27 Oktober 2026

- Wadah daftar siswa kini memakai key kelas dan ref gulir. Memilih kelas mengganti daftar/judul/indikator aktif, menghapus pencarian dan pilihan siswa sebelumnya, serta mengembalikan gulir ke atas sebelum dan setelah render. Klik ulang kelas aktif juga kembali ke atas. Mengubah pencarian kembali ke hasil pertama.
- `node scripts/check-teacher-class-switch.mjs` lulus dengan data sintetis: perpindahan dua arah, klik kelas aktif, filter, pilihan siswa, dan posisi gulir tanpa mengubah data/progres. Pemeriksaan memakai state/ref komponen, bukan browser langsung.
- TypeScript dan build offline lulus; `index.html` diperbarui. Perubahan tetap lokal, belum diterbitkan ke hosting.

## Penambahan daftar XI TP 1 — 27 Oktober 2026

- XI TP 1 ditambahkan dengan 24 nama dari foto, presensi 1–24. XI TP 2 tetap dipertahankan. Nama identik tidak membuat progres kedua kelas tercampur; identitas tetap berdasarkan kelas dan presensi.
- Pengujian IndexedDB terisolasi memastikan 48 entri awal tampil tanpa login, urutan presensi benar, aktivitas awal kosong, progres lama digabung tanpa duplikasi, dan pemisahan kelas tetap berlaku. Tidak membaca atau mengubah data browser pengguna.
- Pemeriksaan penyimpanan/identitas, TypeScript, dan build offline lulus. `index.html` dibuat ulang. Pembaruan masih lokal; tidak ada deployment daring pada pekerjaan ini.

## Pembaruan tampilan ponsel — 27 Oktober 2026

- Navigasi bawah tersedia di bawah 768 px, dengan tautan aktif mengikuti rute modul. Menu HP dapat dibuka dari bawah, ditutup melalui tombol silang, dan menutup saat halaman dipilih.
- Kartu materi satu kolom, tab modul dua kolom, formulir minimum 16 px, tombol utama/alat minimum 44 px. Toolbar viewer ditempatkan di bawah model pada HP. Area aman layar berponi dan ruang navigasi bawah diperhitungkan; zoom halaman tidak dinonaktifkan.
- Lab memakai toolbar geser dan panel Ukuran & properti yang dapat dilipat. Memilih Create/Modify membuka properti. Perubahan panel/navigasi tidak mengubah riwayat draf. Resolusi rendering 3D dibatasi 1,5× pada perangkat pointer sentuh untuk mengurangi beban grafis.
- `node scripts/check-mobile-layout.mjs` lulus: aturan CSS 320/360/390/430/600/767 px dan desktop 768/1024/1440 px, status navigasi, buka/tutup menu dan panel, pembukaan panel oleh perintah, serta viewport HTML mandiri. Pemeriksaan ini membaca CSS dan state komponen, **bukan pengukuran layout/render browser**.
- Pemeriksaan CAD, delapan contoh animasi, toggle/posisi PDF, menu Section Analysis, dan TypeScript lulus. `npm run build:offline` membuat ulang `index.html` sekitar 5,11 MB.
- Tampilan dan gesture pada browser HP fisik belum diverifikasi ulang karena jalur pratinjau browser lokal tidak tersedia. Pembaruan tersimpan lokal; hosting lama tidak ditemukan, sehingga belum ada deployment daring untuk perubahan ini.

## Penyederhanaan menu modul — 26 Oktober 2026

- Jobsheet PDF digabungkan ke Modul belajar. Setiap kartu modul memiliki pintasan Part 3D, Modul pembelajaran, dan Jobsheet PDF; halaman modul memiliki tiga pilihan yang sama.
- PDF dipindahkan ke bagian Jobsheet PDF pada modul terkait. Materi, petunjuk, kuis, dan refleksi berada di Modul pembelajaran. Bagian Part 3D menampilkan status belum tersedia karena STL materi belum ditambahkan.
- Tautan lama `#jobsheet` diarahkan ke jobsheet sketch. Tautan tiap bagian menggunakan ID modul dan bagian terkait.
- Build lokal selesai dengan exit 0 dan menghasilkan ulang `index.html`. Pemeriksaan TypeScript tanpa emit selesai dengan exit 0. Pemeriksaan whitespace diff juga lulus.
- Pemeriksaan render seluruh aplikasi melalui Node tidak selesai dan dihentikan; tidak dihitung sebagai pengujian yang lulus. Interaksi dan tampilan browser belum diverifikasi ulang. Pembaruan ini tersimpan pada proyek lokal.

## Pembaruan alur materi dan jobsheet — 26 Oktober 2026

- Alur baru: pengenalan Fusion, sketch 2D, part 3D, assembly piston. Beranda, modul, klinik, pilihan portofolio, progres, dan referensi Lab telah disesuaikan.
- 15 PDF terdaftar: 2 sketch, 6 part, 5 komponen assembly, Full, dan Isometris. Urutan nomor per kelompok diuji. Salinan di `public/jobsheets/` cocok byte demi byte dengan sumber; PDF asli tidak diedit.
- Dua PDF pertama pada folder Part 3D identik dengan PDF Sketch 2D. Peringatan ditampilkan di pustaka dan panduan; tidak ditambahkan dimensi yang tidak tersedia.
- `node scripts/check-curriculum.mjs` lulus: urutan dokumen, ID modul, checklist, kuis, navigasi tahap, isolasi progres lama, dan render daftar/tautan PDF untuk versi lokal serta server.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false` selesai dengan exit 0.
- `node local/build.mjs` selesai dengan exit 0; menghasilkan `index.html` sekitar 1,20 MB. Pemeriksaan sintaks JavaScript hasil bundle lulus; materi baru dan jalur PDF relatif tersedia tanpa tautan login ChatGPT.
- `npm run build` menyelesaikan lima tahap build produksi. Peringatan non-fatal: beberapa bundle lebih dari 500 kB dan klasifikasi route statis/dinamis belum didukung penuh oleh Vinext. Ini bukan bukti penerbitan online.
- Teks seluruh PDF diperiksa; contoh halaman sketch, part, dan isometris assembly juga dirender dan ditinjau. Berkas tidak dimodifikasi.
- Pemeriksaan interaksi/tampilan browser, termasuk klik ganda `file://` dan layar HP, belum terverifikasi ulang: akses browser lokal dinonaktifkan dalam pengaturan aplikasi. Uji render daftar PDF bukan pengganti uji browser.
- Penerbitan online tidak dilakukan: koneksi Sites mengembalikan `project_not_found` untuk identitas proyek yang tersimpan. Identitas dan pengaturan akses tidak diganti.
- Penyimpanan nyata siswa, viewer Autodesk, dan pembacaan F3D tidak diuji atau diubah dalam pembaruan ini.

## Arsip pemeriksaan — 28 September 2026

Catatan berikut adalah pengujian versi sebelumnya, bukan klaim pengujian ulang tampilan/materi terbaru.

## Tambahan: index.html lokal tanpa login

- Berhasil dibuat sebagai satu HTML mandiri (sekitar 1,21 MB), dengan CSS, JavaScript, materi, dan pustaka 3D di dalam file.
- Pemeriksaan tipe dan sintaks JavaScript berhasil. Tidak ada script/CSS eksternal, alamat server localhost, atau tautan login/logout ChatGPT dalam hasil HTML.
- Fungsi penyimpanan lokal diuji menggunakan tiruan IndexedDB dalam memori: profil, checklist, kuis, refleksi, validasi tautan, penyimpanan berkas, penilaian lokal, dan pembacaan ulang berhasil. Pengujian ini tidak membuktikan izin atau persistensi IndexedDB pada browser tertentu.
- Pembukaan langsung `file://` tidak dapat diverifikasi lewat browser pemeriksaan Codex karena kebijakan browser menolak protokol tersebut. Tidak dilakukan pengelakan atau perubahan keamanan browser. Pengguna perlu mencoba klik ganda `index.html` di File Explorer dengan Chrome/Edge.
- Versi lokal tidak memiliki autentikasi atau sinkronisasi antarsiswa/perangkat. Pengaturan akses website daring tetap tidak berubah.

## Versi daring/server sebelumnya

## Berhasil diperiksa

- Pemeriksaan tipe seluruh kode aplikasi tanpa error.
- Pembuatan versi produksi dengan server, D1, dan R2.
- Penyimpanan profil, checklist, petunjuk, hasil kuis, dan refleksi; pembacaan ulang dari penyimpanan lokal.
- Penghitungan nilai kuis di server; jawaban/nomor modul tidak valid ditolak.
- Pengunggahan berkas uji, pengunduhan ulang, dan penolakan pengunduhan tanpa masuk.
- Permintaan penyimpanan tanpa identitas dan dari origin berbeda ditolak.
- Akun guru simulasi dapat memberi nilai dan umpan balik; akun biasa ditolak ketika meminta data guru.
- Navigasi modul, petunjuk bertingkat, kuis dan pembahasan lewat antarmuka. Kuis Base dengan jawaban benar menghasilkan 100/100.
- Model 3D tampil pada beranda; kontrol 3D dan parameter tersedia.
- Tampilan modul pada ukuran HP: tidak ada luapan horizontal pada pemeriksaan DOM.
- WebMCP membaca progres dan membuka modul yang sama dengan antarmuka; nomor modul tidak valid ditolak.

## Batas pemeriksaan

- Pengujian penyimpanan memakai data sintetis lokal, bukan siswa nyata. Data berada di `.wrangler`, tidak ikut diterbitkan. Profil diberi nama “Uji Lokal Parametra”.
- Izin guru lokal dikembalikan kosong setelah pengujian. Akun guru produksi belum ditetapkan.
- Belum ada file sumber Fusion atau tautan Embed desain pengguna untuk uji integrasi Autodesk end-to-end. Pemuat STL/OBJ tersedia, tetapi file CAD nyata pengguna perlu diuji saat diberikan.
- Belum ada folder Drive kelas. Tautan Drive disimpan sebagai tautan; tidak ada unggah otomatis atau sinkronisasi Drive.
- Uji HP menggunakan ukuran browser, bukan pengujian pada seluruh perangkat fisik.
- Efektivitas media, validitas instrumen motivasi, dimensi jobsheet, dan rubrik penelitian belum diuji dengan peserta didik.

Materi dan model perlu ditinjau guru sebelum digunakan sebagai perangkat pembelajaran atau tindakan penelitian.
