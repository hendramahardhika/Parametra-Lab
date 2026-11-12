# Parametra Lab
Pendamping praktik CAD kelas XI Teknik Pemesinan. Siswa mengamati gambar dan model asli, menyusun rencana, menggunakan klinik kesalahan, lalu memeriksa hasil di Autodesk Fusion.

## Membuka dan mengunggah
Klik dua kali **index.html** untuk belajar tanpa internet. Semua PDF, mesh STL, pratinjau sketsa, dan panduan antarmuka sudah tertanam. Tidak perlu ekstrak, login, CDN, server, atau instal aplikasi tambahan untuk membuka website. Membuat dan mengukur desain tetap dilakukan di Fusion.

Untuk GitHub Pages, **cukup unggah index.html** ke akar repositori tujuan. Pilih penerbitan dari branch yang memuat file itu dengan folder **/(root)**. Jika ingin membagikan hanya website siswa, gunakan repositori kosong dan unggah file tersebut saja. Jangan unggah folder lama, daftar kelas, data penilaian, berkas konfigurasi privat, atau riwayat Git lama.

## Alur untuk siswa
Beranda menampilkan peta empat modul dan animasi piston. Pilih **Modul belajar** untuk langsung melihat model 3D **Jobsheet 3 · Dudukan Poros**. Gunakan pilihan Jobsheet 3–6 untuk mengganti komponen, atau **Semua modul** untuk memilih tahap lain. Pada ruang praktik, PDF bisa diletakkan di bawah atau di kanan model pada layar lebar; pada ponsel PDF tersusun di bawah. **Pustaka materi** membuka daftar jobsheet, **Portofolio** merangkum catatan, dan **Progres saya** menampilkan checklist lokal.

1. Pilih jobsheet dan buka gambar kerja PDF. Pada latihan 3D, tekan ▶ untuk memutar model 360° secara berulang dan tekan jeda untuk mengamati detailnya. Buka **Potongan**, lalu pilih **XY**, **XZ**, atau **YZ**. Arsiran menandai bagian padat yang terpotong. Pilih **Balik sisi** untuk melihat separuh lainnya atau **Utuh** untuk menampilkan seluruh model. Latihan sketsa menggunakan gambar 2D.
2. Tulis rencana. Buka petunjuk satu per satu bila perlu.
3. Pilih gejala di Klinik kesalahan, coba perbaikan pada model Fusion, dan catat hasilnya.
4. Bandingkan dengan jobsheet asli, ukur di Fusion, lalu isi checklist dan refleksi.

Catatan dan checklist tersimpan per jobsheet di browser/perangkat yang digunakan, tanpa unggahan ke guru. Pada komputer bersama, jangan mengisi data pribadi. Mode privat atau kebijakan browser dapat membatasi penyimpanan.

## Mengedit
Folder **local/** berisi halaman.html (struktur dan gaya), app.js (alur belajar), viewer.js (pratinjau STL), materi.json (materi dan aset), animation-piston-white.mp4 (animasi piston), dan build.mjs (pembuat HTML mandiri). Lakukan perubahan pada file sumber ini.
Dengan Node.js dan npm, jalankan **npm run build:offline** setelah mengubah sumber; tidak perlu npm install. Untuk pratinjau, **npm run dev**, lalu buka alamat lokal yang tercetak dan muat ulang setelah perubahan.

