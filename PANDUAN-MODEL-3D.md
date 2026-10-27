# Model part 3D

Buka Modul belajar → Membuat part 3D → Part 3D. Pilihan model mengikuti nomor jobsheet. Saat ini tersedia Dudukan Poros (3), Pulley (4), Flange Pipa (5), dan Bottle (6). Plat Sambungan (1) dan V Block (2) hanya berada di modul Sketch 2D.

Sumber STL ada di `Dokumen/Fusion/Part 3D`. Daftar pasangan model/jobsheet ada di `lib/part-models.json`. Untuk memperbarui model, ganti file sumber yang sesuai, lalu jalankan `npm run build:offline`. Nomor jobsheet 3–6 mengikuti dokumen asli; jangan memasukkan jobsheet Sketch 2D ke daftar Part 3D.

Build memeriksa STL dan menghasilkan `lib/part-model-data.generated.json`, lalu menyertakan datanya di `index.html` agar preview dapat dibuka langsung tanpa server, internet, atau login. Jangan mengedit file generated atau index.html secara manual. Download STL menggunakan data asli; orientasi dan skala untuk tampilan tidak mengubah file sumber.

Saat mengunggah versi mandiri ke GitHub Pages, gunakan index.html terbaru beserta folder public untuk PDF, PNG, dan video. Menaruh atau mengganti STL di folder saja belum memperbarui index.html; jalankan build kembali.

STL adalah bentuk permukaan: tidak berisi urutan pembuatan, ukuran parametrik, atau gerak joint. Tombol putar hanya merotasi tampilan model. Data progres siswa tidak berubah saat model dipilih.

## Section Analysis

Klik ikon bidang potong pada baris kontrol viewer, di antara Reset tampilan dan Layar penuh. Menu Section Analysis terbuka mendatar ke kanan ikon tanpa kotak pop-up atau paragraf keterangan: pilih XY, XZ, atau YZ untuk menampilkan setengah model. Pilih Utuh untuk memulihkan tampilan atau Balik sisi untuk melihat separuh lainnya. Pada layar sempit, baris kontrol bisa digeser mendatar. Tutup menu dengan klik ikon kembali, klik di luar menu, atau Escape. Bidang mengikuti sumbu model sebelum rotasi tampilan; untuk model modul ini, sumbu Z Fusion dipetakan menjadi arah atas viewer. Potongan melewati titik tengah bounding box model, bukan origin Fusion yang tidak tersimpan sebagai metadata dalam STL.

Permukaan potong diberi arsiran biru menggunakan clipping dan stencil, mengikuti teknik pada [contoh resmi Three.js](https://threejs.org/examples/webgl_clipping_stencil.html). Model dengan permukaan terbuka atau normal segitiga tidak konsisten dapat menghasilkan arsiran yang tidak sempurna. Ini analisis visual mesh, bukan modifikasi CAD atau alat ukur. Unduh STL tetap menghasilkan file asli yang utuh.

Pengujian otomatis tersedia melalui `node scripts/check-section-analysis.mjs`: pemeriksaan pemetaan sumbu, irisan empat STL, balik sisi, rotasi, mode utuh, dan pemeliharaan geometri asli. Pemeriksaan ini tidak menggantikan pengujian visual GPU di browser.
