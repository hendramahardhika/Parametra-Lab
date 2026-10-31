# Angket penggunaan Parametra Lab

1. Buat proyek Google Apps Script baru, terpisah dari proyek sinkronisasi Drive. Jangan menimpa `Code.gs` sinkronisasi yang sudah dipakai.
2. Salin seluruh isi `Angket-Parametra-Lab.gs` ke `Code.gs`. Simpan, pilih fungsi `buatAngketParametraLab`, lalu Jalankan.
3. Tinjau izin Google dan setujui bila akun/proyek sudah sesuai. Skrip membuat Google Form pada akun yang menjalankannya, bukan akun Codex. Tidak perlu deployment Web app atau URL `/exec`.
4. Buka tautan **edit guru** pada Log eksekusi. Halaman pertama berisi tiga identitas wajib dan sepuluh pernyataan wajib dengan skala 1–5. Setelah klik **Berikutnya**, halaman kedua berisi dua pertanyaan reflektif esai (nomor 11–12), memakai jawaban paragraf dan wajib diisi. Ini angket persepsi, bukan kuis dengan kunci jawaban/nilai benar-salah.
5. Tinjau redaksi, pratinjau di HP, lalu **Publikasikan** dan periksa siapa yang diizinkan merespons. Kebijakan akun sekolah dapat membatasi responden. Bagikan tautan siswa, bukan tautan edit. Skrip tidak otomatis membuat form publik atau mengubah izin Drive lain.
6. Jawaban masuk ke tab **Respons/Jawaban** pada Google Forms. Jika perlu rekap spreadsheet, gunakan ikon Google Sheets pada tab tersebut. Skrip ini tidak membuat spreadsheet, mengunggah data web, atau menyambungkan jawaban angket dengan progres website secara otomatis.

Skala: 1 Sangat Tidak Setuju, 2 Tidak Setuju, 3 Netral, 4 Setuju, 5 Sangat Setuju. Semua pernyataan searah; angka tinggi menunjukkan persepsi lebih positif. Jangan menafsirkan 3 sebagai belum mencoba fitur. Berikan kesempatan siswa mencoba fitur yang dinilai sebelum pengisian.

Nomor presensi berupa teks angka bulat 1–99; 01 diterima. Nama tidak diambil dari roster secara otomatis. Validasi identitas bukan verifikasi bahwa pengisi benar-benar siswa tersebut.

Jika form versi sebelumnya sudah dibuat, ganti seluruh isi `Code.gs` dengan skrip terbaru **di proyek Apps Script yang sama**, lalu jalankan kembali `buatAngketParametraLab`. ID form tetap sama. Halaman refleksi serta dua soal esai yang belum ada akan ditambahkan tanpa menghapus respons atau sepuluh soal lama. Respons yang dikirim sebelum esai ditambahkan tetap tersimpan dan tidak otomatis mempunyai jawaban esai.

Pemanggilan ulang memeriksa jenis item dan judul persis sebelum menambahkan, sehingga tidak menggandakan halaman/soal yang sudah ada. Jangan mengganti judul halaman refleksi/dua soal jika masih ingin memakai pemeriksaan ini. Bila memakai ulang fungsi setelah mengedit judul secara manual, judul lama dianggap belum tersedia. Skrip tidak mengubah status publikasi form lama. Tinjau dan perbarui publikasi bila editor memintanya. Bila form dihapus, fungsi akan gagal membuka ID lama; jangan menghapus properti ID kecuali memang ingin membuat form baru.

Dua pertanyaan reflektif: (11) pengaruh penggunaan Parametra Lab pada pemahaman materi, disertai contoh termasuk jika belum membantu; (12) kesulitan penggunaan dan saran pengembangan. Esai tidak memakai skala 1–5 atau skor otomatis.

Nama, kelas, dan presensi membuat angket **tidak anonim**. Batasi akses editor/hasil kepada guru atau peneliti yang berwenang. Ringkasan respons untuk responden dinonaktifkan. Tidak mengumpulkan email dan tidak membatasi satu respons per akun; ini memudahkan akses tetapi tidak mencegah kiriman ganda.

Instrumen ini adalah draf umpan balik penggunaan media, **belum instrumen tervalidasi**. Untuk penelitian formal, minta penelaahan ahli dan lakukan uji coba/validitas/reliabilitas yang sesuai. Persepsi siswa tidak dengan sendirinya membuktikan peningkatan hasil belajar; gunakan bukti penilaian lain bila ingin menilai peningkatan pemahaman.

Referensi API: [Forms service](https://developers.google.com/apps-script/reference/forms), [ScaleItem](https://developers.google.com/apps-script/reference/forms/scale-item), [FormApp](https://developers.google.com/apps-script/reference/forms/form-app), [validasi teks](https://developers.google.com/apps-script/reference/forms/text-validation-builder).

Verifikasi lokal: `node scripts/check-feedback-form.mjs` memeriksa pembuatan form melalui mock API, tepat 10 skala/3 identitas/2 esai pada halaman baru, validasi presensi, pengaturan privasi, pembaruan dari versi lama, pemulihan penambahan esai yang belum lengkap, dan pemanggilan ulang tanpa duplikasi. Tidak membuat form nyata atau menguji otorisasi/publikasi pada akun Google.
