# Pustaka materi Parametra Lab

## Membuka materi

- Pilih **Pustaka materi** pada sidebar untuk materi siswa.
- Gunakan pencarian, pilihan modul, siklus, atau jenis dokumen.
- Klik **Pratinjau** untuk membuka PDF, gambar, atau MP4 pada halaman yang sama. Gunakan tombol format untuk mengunduh berkas asli.
- PDF dan DOCX yang berpasangan tampil dalam satu kartu. File F3D, IPT, dan AVI diunduh untuk dibuka pada aplikasi yang sesuai.
- Setiap modul memiliki tab **Bahan belajar** yang menampilkan koleksi terkait.
- **Ruang guru → Perangkat ajar** memuat ATP, RPP, asesmen, rubrik, sumber Word jobsheet, dan aset desain.

## Lokasi berkas

Sumber asli berada di `Dokumen/`. Inventaris mencakup 80 berkas dari folder TFLM-Perancangan dan dikelompokkan menjadi 65 koleksi. Build membuat metadata `lib/learning-resources.generated.json` dan menyalin berkas tanpa perubahan ke `public/library/`.

Seluruh 65 koleksi memiliki gambar pratinjau dalam `Dokumen/Aset Desain/Pratinjau Materi/koleksi/`. PDF memakai halaman pertama, gambar memakai gambar asli, video memakai cuplikan, STL memakai render geometri, dan F3D memakai pratinjau bawaan Fusion. Jobsheet Word memakai PDF pasangan; ATP yang tidak memiliki PDF memakai ringkasan isi Word dengan label yang jelas. Semua gambar ditampilkan utuh dalam bingkai berukuran seragam.

`lib/resource-preview-manifest.json` mencatat gambar serta sumbernya. Jika sumber berubah, buat ulang pratinjau dengan `scripts/render-resource-previews.py` (memerlukan Python dengan Pillow/NumPy, Poppler, FFmpeg, dan Node dengan dukungan Zstandard), lalu jalankan build. Build memeriksa bahwa seluruh koleksi memiliki gambar yang sesuai dengan sumbernya.

Jalankan `npm run build:offline` setelah mengganti sumber atau pengaturan pustaka. Untuk penggunaan lokal, buka `index.html` dan pertahankan folder `public/` di sampingnya. Jika membagikan web, sertakan seluruh folder `public/` agar PDF, gambar, video, dan file CAD dapat dibuka.

## Akses dan penerbitan

Pengelompokan perangkat guru pada edisi lokal adalah navigasi, bukan perlindungan akun. Versi server memeriksa peran guru sebelum menampilkan halaman perangkat ajar, tetapi aset statis bukan tempat menyimpan dokumen rahasia.

Pembaruan ini tersimpan pada web lokal. Layanan Sites mengembalikan `project_not_found` untuk identitas hosting yang tercatat; penerbitan daring belum dilakukan. Konfigurasi proyek dan audiens hosting belum diubah.
