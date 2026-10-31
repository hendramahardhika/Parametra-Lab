# Pengumpulan tugas ke Google Drive

Status awal: kode telah disiapkan, BELUM aktif sampai guru memberi izin dan melakukan deployment. Tidak memerlukan akun ChatGPT, APS, atau domain sendiri. Pengumpulan membutuhkan internet. Formulir dibuka di tab baru agar alur login Google tidak terhambat iframe.

Tujuan yang diminta: https://drive.google.com/drive/folders/1tMtfa3NUhHX7gWS1G4-goMv0o8-Z7Mt5

## Aktivasi oleh pemilik Drive

1. Masuk ke https://script.google.com menggunakan akun yang memiliki izin menulis ke folder tujuan. Buat proyek baru bernama `Parametra Lab — Pengumpulan`.
2. Salin isi `Code.gs` dari folder ini ke Code.gs pada proyek Google. Tambahkan file HTML bernama `Index`, lalu salin isi `Index.html` dari folder ini ke sana. Jangan memakai index.html besar di akar website.
3. Di Project Settings → Script Properties, tambahkan:
   - `CLASS_CODE`: kode acak minimal 12 karakter. Berikan hanya kepada kelas; jangan masukkan ke GitHub, konfigurasi website, atau chat.
   - `UPLOADS_ENABLED`: `true` untuk membuka pengumpulan; ubah `false` untuk menutupnya.
   - `MAX_DAILY_UPLOADS`: `100` (batas per hari untuk seluruh kelas, dapat disesuaikan).
4. Deploy → New deployment → Web app. Execute as: **Me / akun guru**. Pilih akses paling terbatas yang tetap bisa dipakai siswa: domain sekolah jika tersedia dan semua siswa di domain itu; jika memakai Gmail pribadi, pilih pengguna dengan akun Google jika tersedia. Jangan memilih akses anonim/Anyone tanpa mempertimbangkan risiko penyalahgunaan. Pilihan akses mengikuti jenis akun dan kebijakan administrator sekolah. Guru harus memeriksa dan menyetujui izin Drive secara langsung.
5. Salin URL deployment yang berakhir `/exec` (bukan `/dev`). Isi `webAppUrl` pada `lib/drive-upload.json`. URL ini publik, bukan rahasia.
6. Jalankan `npm run build:offline` dari akar proyek. Unggah hasil website ke GitHub seperti biasa. Perubahan kode Apps Script harus di-deploy ulang dari Manage deployments → Edit → New version, bukan hanya diunggah ke GitHub.

## Uji sebelum dibagikan ke kelas

- Buka index.html → Portofolio → Buka formulir pengumpulan. Uji juga dari alamat GitHub Pages dan ponsel menggunakan akun siswa yang bukan pemilik script.
- Coba kode salah: tidak boleh ada berkas masuk. Coba berkas kosong/format tidak diizinkan/lebih dari 20 MB: harus ditolak.
- Kirim PDF kecil, lalu contoh CAD. Tunggu nomor bukti, periksa berkas benar-benar ada di folder modul pada Drive guru, unduh kembali dan pastikan isinya sama.
- Periksa nama, kelas, tugas, refleksi, dan waktu pada bagian Deskripsi berkas di Drive. Tidak ada daftar siswa atau tautan berkas pribadi yang dikirim kembali ke formulir.
- Uji setiap modul dan tutup pengumpulan dengan `UPLOADS_ENABLED=false`. Mengganti file atau memuat ulang formulir menghasilkan pengumpulan baru. Pengiriman ulang dari formulir yang sama setelah gangguan memakai nomor yang sama untuk mengurangi duplikasi.
- Hanya bagikan ke siswa setelah pengujian ini berhasil. Jika akun sekolah melarang deployment, minta administrator mengizinkan atau gunakan Google Forms dengan pertanyaan upload berkas.

## Keamanan dan batasan

- Folder penerima sebaiknya khusus pengumpulan, akses Restricted, tanpa izin editor/viewer umum. File baru mengikuti izin folder induknya. Kode tidak otomatis mengubah izin folder yang sudah ada; guru harus mengeceknya sendiri. Jangan berikan siswa akses editor seluruh folder.
- Script berjalan atas izin akun guru. Simpan hanya folder ID dalam Code.gs; jangan menaruh token OAuth atau kata sandi di sumber website. CLASS_CODE hanya disimpan pada Script Properties.
- Kode kelas adalah pembatas sederhana, bukan autentikasi individual. Nama yang diketik tidak membuktikan identitas. Gunakan pembatasan akun/domain pada deployment, ganti kode jika bocor, dan tutup pengumpulan di luar jadwal. Pembatasan jumlah berkas bukan perlindungan penuh dari serangan atau penyalahgunaan kuota; jangan publikasikan endpoint anonim untuk penggunaan luas.
- Maksimal 20 MB per berkas merupakan kebijakan aplikasi ini. Kuota Google Apps Script, kapasitas Drive, kebijakan akun, dan jaringan tetap berlaku. Tidak ada pemindaian antivirus oleh aplikasi; jangan menjalankan berkas tidak tepercaya. Format yang diterima tidak berarti didukung viewer CAD website.
- Karya lama dan progres browser tidak dihapus. Riwayat lokal tidak otomatis sinkron dengan unggahan Drive; bukti pengumpulan ada pada formulir dan berkas Drive. Belum ada penilaian/daftar pengumpulan daring di dashboard website.
- Berkas disimpan di subfolder 01 Pengenalan Fusion / 02 Sketch 2D / 03 Membuat Part 3D / 04 Assembly. Nama berkas diawali nomor bukti unik; identitas lengkap ada dalam Deskripsi.

Referensi resmi: https://developers.google.com/apps-script/guides/html/communication dan https://developers.google.com/apps-script/guides/web
