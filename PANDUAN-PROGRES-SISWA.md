# Progres per siswa — versi index.html / GitHub Pages

1. Klik **Sign in**, isi nama lengkap, kelas **XI TP 1** atau **XI TP 2**, nomor presensi, dan **PIN 6 angka**. Pada profil yang belum memiliki PIN di browser ini, PIN pertama menjadi PIN baru; catat karena pemulihan PIN belum tersedia. Profil lama harus masuk kembali untuk menetapkan PIN, tanpa menghapus progresnya.
2. Identitas tetap adalah **kelas + nomor presensi**. Koreksi nama tidak menghapus progres. Jangan memakai nomor presensi teman.
3. Checklist, hasil kuis yang disimpan, petunjuk, refleksi, pengaturan lokal, dan karya disimpan terpisah. Lihat menu **Progres saya** untuk ringkasan siswa yang sedang masuk.
4. Klik avatar → **Keluar dari identitas ini** sebelum berganti siswa. Siswa berikutnya melihat datanya sendiri. Masuk kembali dengan kelas/presensi yang sama untuk memulihkan tampilan progres sebelumnya.
5. Materi dapat dibuka tanpa masuk. Progres tidak disimpan ke profil bersama saat belum Sign in. Untuk cadangan daring otomatis, aktifkan **Atur Drive** sesuai [panduan aktivasi](integrations/google-drive/AKTIVASI.md). Setelah layanan Google terverifikasi, checklist/kuis dan karya Portofolio masuk antrean otomatis. Tanpa URL deployment dan kode kelas yang benar, data tetap lokal dan menunggu aktivasi.

## Sinkronisasi otomatis yang disiapkan

- Rekap Google: tab `PL_Rekap`, `PL_Modul`, dan `PL_Karya` pada spreadsheet guru, ditambah snapshot serta berkas pada folder Drive tujuan.
- Antrean tersimpan saat offline; pembaruan baru tidak dihapus oleh bukti penerimaan untuk versi lama. Pengiriman ulang memakai ID yang sama agar berkas tidak ganda.
- Web hanya menampilkan status tersinkron setelah menerima bukti dari Google. Menutup browser menghentikan pengiriman sampai web dibuka lagi.
- PIN tetap lokal. Kode sinkronisasi kelas terpisah dan hanya disimpan selama sesi tab. Pemulihan progres cloud ke browser lain dan dashboard guru terlindungi belum tersedia.
- Belum ada uji kiriman nyata sebelum guru menjalankan setup, memberi izin Google, dan menyediakan URL `/exec`. Pengujian lokal memakai layanan Google tiruan.

## Batasan penting

### Panel guru lokal

- Daftar tetap **XI TP 1** dan **XI TP 2** masing-masing berisi 24 nama dari foto daftar guru di `lib/student-roster.ts`, presensi 1–24. Foto yang diberikan untuk kedua kelas memuat nama yang sama; atas permintaan lanjutan guru, daftar ditampilkan pada kedua kelas tanpa memindahkan progres. Nomor 4 tetap disertakan atas konfirmasi guru. NIS dan tanda kehadiran tidak disalin.
- Daftar muncul sebelum siswa login. Progres kosong ditampilkan 0% / belum ada aktivitas, bukan data contoh. Progres yang sudah tersimpan digabung berdasarkan kelas + presensi, tanpa menimpa atau menggandakan siswa. Nama pada daftar guru mengikuti ejaan roster. Kelas berbeda tetap memiliki ID dan progres terpisah meskipun nama/presensinya sama.
- Nama roster menjadi bagian dari file website/index.html. Jangan mengunggahnya ke hosting publik jika daftar siswa belum boleh dipublikasikan; panel guru lokal belum memiliki pembatasan akses.

- Buka **Ruang Guru → Panel guru**, pilih **XI TP 1 / XI TP 2**, lalu klik nama siswa. Daftar diurutkan menurut presensi; pencarian nama/presensi juga tersedia.
- Detail menampilkan empat modul, persentase checklist, langkah yang dicentang, kuis terakhir, jumlah percobaan kuis, jumlah karya lokal, dan waktu aktivitas terakhir. Semua bersifat baca saja; memilih nama tidak mengganti siswa yang sedang Sign in.
- Siswa baru tercatat pada daftar setelah login berhasil dan data lokal dimuat, sekalipun progres masih 0%. Koreksi nama akan tampil setelah data profil dimuat kembali. Gunakan **Perbarui data** jika diperlukan.
- Rekap menggabungkan profil siswa pada browser ini saja, bukan data Google Sheets. Arsip bersama lama tidak dimasukkan karena pemiliknya belum diketahui. PIN, isi berkas CAD, dan catatan refleksi pribadi tidak ditampilkan pada rekap.
- **Panel ini belum dikunci khusus guru.** Jangan menganggap PIN siswa melindungi rekap dari pengguna lain pada perangkat tersebut. Sebelum memakai rekap daring untuk data nyata seluruh kelas, aktifkan otorisasi guru di server.

### Penyimpanan dan akses

- Ini pemisahan profil dalam IndexedDB browser dengan pemeriksaan PIN lokal, **bukan autentikasi aman di server**. PIN tidak disimpan sebagai teks biasa: browser menyimpan salt acak dan hash PBKDF2-SHA256. Orang yang bisa mengubah data browser tetap dapat melewati pembatasan lokal. Pendaftaran PIN pertama belum memverifikasi identitas siswa melalui guru. Ruang tinjauan lokal bukan ruang guru yang terlindungi.
- Jangan gunakan PIN ATM atau kata sandi akun lain. PIN tidak ikut ekspor progres JSON, tidak dikirim ke Drive/Sheets, dan belum tersinkron antarperangkat. Sesi masuk bertahan saat halaman dimuat ulang; klik Keluar setelah memakai perangkat bersama.
- Data tidak otomatis berpindah ke HP, komputer, browser, atau alamat website lain. File lokal dan GitHub Pages menggunakan penyimpanan berbeda. Mengunggah website ke GitHub tidak mengunggah catatan siswa.
- Jangan membersihkan data browser jika progres masih diperlukan. Mode privat, perpindahan lokasi index.html, atau mengganti profil browser dapat membuat catatan tidak tersedia. Ekspor progres berupa JSON tidak mencakup file CAD dan belum tersedia fitur impor.
- Identitas aktif mengikuti penyimpanan browser: jika berganti siswa pada tab lain untuk alamat yang sama, tab terkait juga memperbarui siswa aktif. Jangan mengerjakan atas dua siswa secara bersamaan di tab dalam profil browser yang sama.
- Data lama dari versi satu profil tetap disimpan pada arsip `main`; tidak otomatis diberikan kepada siswa pertama. Menu Progres saya menampilkan ekspor catatan lama jika ditemukan. File CAD lama tidak dihapus. Penetapan pemilik arsip lama memerlukan pemeriksaan guru.
- Untuk login yang terlindungi, sinkronisasi antarperangkat, serta dashboard guru seluruh kelas secara daring, diperlukan layanan akun dan basis data daring. Itu belum diterapkan pada perubahan ini.

## Pengujian pengembang

`npm run build:offline`

`node scripts/check-student-identity.mjs`

Untuk pengujian isolasi penyimpanan, pasang dependensi uji ke folder sementara (bukan ke paket website):

`npm install --prefix .sites-runtime/storage-test --no-package-lock --ignore-scripts fake-indexeddb@6.2.6`

`node scripts/check-student-storage.mjs`

Tes menggunakan IndexedDB dalam memori terpisah, tidak membaca data browser siswa.
