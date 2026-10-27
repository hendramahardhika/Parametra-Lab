# Parametra Lab

## Tampilan ponsel

- Pada layar di bawah 768 px, gunakan navigasi bawah: Beranda, Modul, Lab 3D, Progres, dan Menu. Pustaka, Portofolio, serta Panel guru tetap tersedia melalui Menu. Tombol silang menutup menu.
- Kartu materi disusun satu kolom, pilihan bagian modul dua kolom. Tombol viewer 3D berada di bawah gambar; geser daftar tombol ke samping untuk melihat perintah lainnya. PDF di kanan otomatis menjadi di bawah pada area yang sempit.
- Di Lab 3D, geser toolbar untuk memilih perintah. Ketuk **Ukuran & properti** di bawah kanvas untuk membuka/melipat pengaturan. Memilih Create/Modify otomatis membuka pengaturan. Tombol +/− membantu zoom tanpa mouse. Mode layar penuh memperluas editor dan menyembunyikan navigasi bawah sementara.
- Pengisian angka tetap menggunakan mm; perubahan tampilan tidak mengubah ukuran latihan atau data tersimpan. Proses 3D tetap bergantung kemampuan grafis HP; gunakan komputer untuk latihan yang lebih nyaman.
- Untuk membuka melalui tautan di HP, hasil terbaru perlu dipasang pada hosting yang aktif bersama berkas pendampingnya. Perubahan lokal tidak otomatis memperbarui alamat website daring.

## Aktivasi pembaruan otomatis Google Drive

Versi `index.html` sekarang memiliki bar **Atur Drive**, antrean progres/kuis, dan antrean berkas Portofolio. Layanan Google harus diaktifkan satu kali oleh pemilik akun sebelum pengiriman daring dapat berjalan. Ikuti [panduan aktivasi](integrations/google-drive/AKTIVASI.md). Tiga tab rekap ditambahkan tanpa menghapus tab spreadsheet lama. URL deployment belum diisi; jangan menganggap data sudah terkirim sampai ada status konfirmasi Google. Bagian penyimpanan lokal di bawah tetap berlaku sebagai penyimpanan pertama dan cadangan offline.

## Buka langsung tanpa login — versi lokal

Klik dua kali **`index.html`** pada folder Parametra Lab. Pilih Chrome atau Edge jika Windows menanyakan aplikasi pembukanya. Tidak perlu menjalankan server, membuka terminal, atau masuk ke ChatGPT.

Materi, kuis, dan pemuat STL/OBJ ada dalam HTML; PDF dan video adalah berkas pendamping. Pertahankan folder `public/jobsheets/` serta video `Dokumen/Fusion/Animasi/Animation Piston.mp4` bersama `index.html`. Untuk GitHub Pages, unggah ketiganya dengan susunan folder yang sama. Tautan Google Drive dan viewer Autodesk tetap memerlukan internet serta izin akses masing-masing.

Versi lokal berbeda dari website daring yang dijelaskan pada bagian-bagian berikut:

- Satu profil belajar untuk satu browser pada lokasi file ini. Isi nama dan kelas melalui Portofolio.
- Progres, kuis, refleksi, dan salinan karya disimpan **di browser ini saja**, bukan pada server, bukan pada file HTML, dan bukan otomatis pada folder Windows atau Drive.
- Tidak ada akun siswa/guru. Ruang tinjauan lokal terbuka bagi siapa pun yang memakai profil browser yang sama. Nilai lokal dapat diedit dan bukan nilai ujian resmi yang terlindungi.
- Memindahkan/menamai ulang file, berganti browser, menggunakan mode privat, atau membersihkan data browser dapat membuat catatan sebelumnya tidak terlihat atau hilang. Gunakan lokasi tetap dan browser biasa.
- Tombol **Ekspor catatan** menghasilkan JSON berisi profil, progres, kuis, refleksi, dan metadata karya. Berkas CAD tidak ikut dalam JSON; simpan sumber CAD asli secara terpisah. Ekspor ini untuk arsip; belum tersedia tombol pemulihan JSON.
- Untuk mengirim karya ke guru, buka folder Drive kelas lalu unggah berkas secara manual. Menekan “Simpan karya di perangkat” bukan pengumpulan daring.
- Jika penyimpanan browser ditolak/penuh, website menampilkan pesan gagal. Jangan menganggap pekerjaan tersimpan sebelum ada konfirmasi berhasil.

`index.html` merupakan hasil pembuatan dari materi dan tampilan yang sama dengan versi daring. Sumber pembuatannya berada di `local/`; pengembang dapat memperbaruinya dengan `node local/build.mjs` setelah mengubah materi atau kode.

**Website daring dan pengaturan aksesnya tidak diubah oleh penambahan versi lokal ini.** Bagian berikut mendokumentasikan versi daring/server.

Media pendamping praktik Autodesk Fusion untuk TFLM–Perancangan / TPB-MAPIL, kelas XI Teknik Pemesinan, SMK Muhammadiyah 3 Yogyakarta.

## Mulai belajar

1. Buka Beranda → Mulai perjalanan, atau pilih Modul belajar.
   Setiap kartu modul menyediakan tiga pilihan: Part 3D, Modul pembelajaran, dan Jobsheet PDF. Menu Jobsheet PDF sudah digabungkan ke dalam Modul belajar.
2. Ikuti jobsheet satu langkah per satu langkah. Buka tiga tingkat petunjuk sesuai kebutuhan.
3. Gunakan Panduan langkah untuk urutan petunjuk teks otomatis. Tahap assembly menyediakan video piston sebagai referensi; praktik CAD sebenarnya tetap dilakukan di Fusion pada komputer.
4. Masuk untuk menyimpan checklist, kuis, refleksi, dan karya. Kuis dapat dicoba tanpa masuk, tetapi hasil tamu tidak tersimpan.
5. Di Portofolio, isi nama dan kelas, pilih modul, lalu unggah berkas atau tempel tautan karya. Setiap pengumpulan menjadi versi baru.

## Isi website

- 4 tahap berurutan: pengenalan Fusion, sketch 2D, membuat part 3D, assembly piston.
- 19 langkah/checklist, 57 petunjuk bertingkat, 12 soal kuis dengan pembahasan.
- 15 PDF asli: 2 sketch, 6 part, 5 komponen assembly, serta Full dan Isometris sebagai acuan rakitan. Buka Modul belajar → pilih modul → Jobsheet PDF untuk pratinjau, membuka, atau mengunduh dokumen.
- Pilihan Part 3D pada setiap modul menampilkan keterangan belum tersedia karena file STL materi belum ditambahkan.
- Lab STL/OBJ lokal, penampil Embed Autodesk, video referensi piston, klinik kesalahan, glosarium, dan cetak panduan. F3D belum dapat dipratinjau langsung.
- Penyimpanan akun: progres, percobaan kuis, refleksi, dan portofolio.
- Ruang guru: ringkasan kelas, penilaian dan umpan balik, tahap PTK, folder Drive, ekspor CSV.

## Penting sebelum dipakai di kelas

- Dimensi mengikuti PDF asli tanpa perubahan. PDF Part 3D nomor 1 dan 2 ternyata identik dengan PDF sketch 2D. Website memberi catatan agar guru menentukan instruksi dan ukuran pembentukan 3D yang belum tersedia; tidak ada ukuran tambahan yang dikarang.
- Panduan otomatis adalah teks, bukan rekaman layar Fusion. Video piston bukan pratinjau CAD siswa dan bukan pemeriksaan tabrakan. Lakukan Interference dan verifikasi gerak di Fusion.
- Progres baru memakai ID modul 8–11; ID lama 0–7 tidak dipakai ulang. Riwayat lama tidak dihapus dan ditandai sebagai arsip, sehingga tidak menyelesaikan checklist materi baru secara otomatis.
- Tautan berbagi website awal bersifat **privat untuk pemilik**. Akses siswa harus diatur secara eksplisit sebelum pembelajaran; jangan menganggap penerbitan privat berarti siswa sudah mendapat akses.
- Akun guru belum ditetapkan. Isi `TEACHER_EMAILS` pada pengaturan runtime website dengan email akun guru, pisahkan dengan koma. Nilai ini hanya dibaca server. Tidak ada pendaftaran guru otomatis oleh siswa.
- Akun yang masuk dan belum termasuk daftar guru tetap menjadi siswa. Ruang guru tidak dapat dibuka hanya dengan mengubah alamat halaman.
- Folder Drive diatur oleh akun guru pada Ruang guru. Belum ada sinkronisasi otomatis ke Google Drive atau permintaan akses akun Google.
- Simpan data pribadi siswa seperlunya. Ekspor untuk artikel PTK harus dianonimkan. Susun kebijakan akses dan masa simpan bersama sekolah sebelum mengumpulkan data nyata.

## Alur berkas Fusion dan Drive

**Sumber desain:** simpan F3D/F3Z, unggah langsung ke Portofolio (maksimal 20 MB) atau unggah secara manual ke Drive dan tempel tautannya.

**Pratinjau 3D:** ekspor STL/OBJ melalui Save As Mesh. Jika berkas ada di Drive, unduh dahulu, kemudian pilih di Lab 3D → File saya. Pemrosesan pratinjau terjadi pada perangkat; pemilihan file di Lab bukan pengumpulan ke guru.

**Viewer Autodesk:** gunakan tautan berbagi Fusion dan menu Embed; tempel URL src atau kode iframe ke Lab 3D → Viewer Autodesk. Hanya domain Autodesk yang diizinkan. Akses dan ketersediaan model bergantung pada Autodesk serta izin pemilik model.

Drive tidak menerjemahkan F3D menjadi model interaktif di website ini. Berkas yang diunggah langsung melalui Portofolio disimpan pada penyimpanan website, bukan Drive.

Rujukan: [panduan Embed Autodesk](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-embed-a-viewer-of-a-Fusion-360-design-into-a-website.html), [Save As Mesh](https://help.autodesk.com/cloudhelp/ENU/Fusion-Mesh/files/MESH-SAVE-AS-MESH.htm).

## Catatan penelitian

Jejak klik, bantuan, kuis, dan pengumpulan merupakan data aktivitas. Data tersebut **bukan pengukuran motivasi yang sudah tervalidasi**. Gunakan bersama observasi kolaborator, angket yang sesuai, dan rubrik unjuk kerja. Kuis konsep tidak menggantikan nilai praktik CAD.

Label Pra-tindakan, Siklus I, dan Siklus II mengikuti pengaturan guru saat data dikirim. Label folder PPL/Siklus dari bahan asal tidak otomatis disamakan dengan siklus PTK penelitian ini.

## Menjalankan dari folder ini

Untuk mengedit proyek dengan Antigravity, pilih **Open Folder** dan buka folder `Parametra Lab` ini. Tidak ada file penghubung khusus yang diperlukan. `AGENTS.md` menyediakan petunjuk kerja proyek.

Edit file sumber di `app/`, `components/`, `lib/`, atau `local/` — jangan mengedit `index.html` langsung karena file itu dibuat otomatis. Persyaratan proyek adalah Node.js 22.13 atau lebih baru.

- Untuk pratinjau saat mengedit dengan pembaruan otomatis, buka terminal pada folder Parametra Lab dan jalankan `npm run dev`, lalu buka alamat lokal yang ditampilkan. Hentikan dengan `Ctrl+C`.
- Untuk memperbarui website satu-file yang dibuka dengan klik ganda, jalankan `npm run build:offline`. Setelah selesai, buka kembali `index.html` di Chrome atau Edge.
- Di Command Prompt, masuk ke folder ini dengan `cd /d "D:\PPG\Semester 2\Seminar Ilmiah\Parametra Lab"`, lalu jalankan perintah di atas. Pertama kali di komputer baru, pasang dependensi dengan `npm run install:ci`.

File `Buka Parametra Lab.cmd` menjalankan versi pratinjau server. Untuk melihat versi mandiri tanpa server, klik dua kali `index.html`.

Alamat lokal hanya untuk komputer ini. Untuk HP siswa gunakan alamat website daring dan atur hak aksesnya, bukan alamat localhost.

Pratinjau lokal menggunakan akun simulasi `seedy@sites.test` ketika tombol Masuk ditekan; ini **bukan akun ChatGPT sungguhan**. Data lokal terpisah dari website daring. Jangan memakai simulasi lokal sebagai sistem identitas kelas. Akun guru lokal dinonaktifkan setelah pengujian.

## Berkas untuk pengembangan

- `lib/curriculum.ts`: materi, soal, glosarium, dan klinik.
- `lib/jobsheets.json`: daftar PDF, kategori, urutan, serta lokasi dokumen asli. Jika menambah dokumen baru, perbarui daftar ini dan langkah materi yang terkait.
- `Dokumen/Jobsheet/`: PDF sumber milik guru, tidak diubah oleh build.
- `public/jobsheets/`: salinan untuk ditampilkan di web. Dibuat ulang oleh `npm run prepare:jobsheets`, `npm run dev`, `npm run build`, dan `npm run build:offline`.
- `app/components/jobsheets.tsx`: pustaka dan penampil PDF. Pratinjau menggunakan kemampuan PDF browser; tombol Buka/Unduh disediakan bila HP tidak mendukung pratinjau.
- `scripts/check-curriculum.mjs`: pengujian urutan, konsistensi PDF, progres, kuis, dan tautan. Jalankan `node scripts/check-curriculum.mjs`.
- `app/parametra.tsx`: navigasi dan beranda.
- `app/components/learning.tsx`: modul, Lab, portofolio, progres, ruang guru.
- `app/components/cad-viewer.tsx`: model dan penampil 3D.
- `app/globals.css`: tema dan tampilan responsif.
- `app/api/`: aturan penyimpanan, validasi, dan otorisasi server.
- `db/schema.ts` dan `drizzle/`: skema serta migrasi basis data.

Jangan menghapus `.wrangler` jika data pratinjau lokal masih dibutuhkan. Jangan membagikan `.env`, isi `node_modules`, atau data uji lokal sebagai data penelitian.
