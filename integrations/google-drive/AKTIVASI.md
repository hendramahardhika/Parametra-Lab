# Aktivasi pembaruan otomatis Parametra Lab

Kode web, antrean offline, dan penerima Google sudah disiapkan. Belum ada deployment `/exec` yang aktif. Guru harus melakukan aktivasi pertama pada akun Google pemilik tujuan ini:

- Folder: https://drive.google.com/drive/folders/1tMtfa3NUhHX7gWS1G4-goMv0o8-Z7Mt5
- Spreadsheet: https://docs.google.com/spreadsheets/d/1J9P5x0v1GtWMy4XK9-qNEGnGxECvCyuUD0lP5bDOhls/edit

## 1. Buat penerima Google

1. Buka https://script.google.com/home dan masuk dengan Gmail yang memiliki izin **mengedit** folder serta spreadsheet di atas. Periksa **Bagikan → Akses umum → Terbatas** pada keduanya; penerima menolak tujuan yang terbuka untuk publik agar catatan siswa tidak ikut terekspos. Skrip tidak mengubah izin berbagi secara otomatis.
2. Pilih **New project / Proyek baru**, beri nama `Parametra Lab — Sinkronisasi`.
3. Isi file `Code.gs` dengan kode pendamping `Code.gs`. Tambahkan file Script bernama `Sync`, isi dengan `Sync.gs`. Tambahkan file HTML bernama **Index**, isi dengan `Index.html`. Ketiga file tersedia di folder ini dan melalui tombol unduh di **Atur Drive** pada web.
4. Buka **Project settings → Script properties → Add script property**. Isi:

   | Property | Nilai |
   | --- | --- |
   | `CLASS_CODE` | Buat kode acak minimal 12 karakter. Jangan gunakan kata sandi Google/PIN siswa. Bagikan hanya kepada kelas yang mengirim tugas. |
   | `MAX_DAILY_UPLOADS` | `100` atau batas unggahan berkas per hari yang Anda perlukan. |

5. Di editor, pilih fungsi **setupAutoSync**, lalu **Run**. Periksa permintaan izin dan setujui dengan akun guru jika sesuai. Fungsi ini memeriksa akses tujuan dan menambahkan tiga tab baru, `PL_Rekap`, `PL_Modul`, dan `PL_Karya`. Tab lama tidak dihapus. Nama tab yang sudah terpakai dengan header berbeda menyebabkan aktivasi dihentikan agar isinya tidak ditimpa.
6. Setelah berhasil, Script property `SYNC_ENABLED` bernilai `true`.

## 2. Deploy dan verifikasi dari web

1. Pilih **Deploy → New deployment → Web app**.
2. **Execute as / Jalankan sebagai:** akun guru (**Me**).
3. Agar pengiriman otomatis dari `index.html` lokal dan perangkat siswa bekerja tanpa jendela login Google per kiriman, endpoint memerlukan akses **Anyone / Siapa saja**. Endpoint hanya menerima kiriman dengan `CLASS_CODE`; tidak menyediakan pembacaan daftar siswa atau isi Drive. Pengaturan ini **tidak** membuat folder atau spreadsheet menjadi publik. Kode kelas merupakan pembatas kiriman bersama, bukan autentikasi per siswa; siswa dengan kode dapat mengirim identitas yang mereka isi sendiri. Bila akun Anda tidak menyediakan pilihan akses ini, jangan menganggap integrasi aktif: deployment memerlukan penyesuaian akses.
4. Selesaikan deployment dan salin URL yang berakhir **/exec**, bukan `/dev`. Persetujuan akun/izin Google diselesaikan langsung oleh pemilik akun.
5. Buka versi terbaru Parametra Lab. Pada bar **Drive belum diaktifkan**, klik **Atur Drive**.
6. Tempel URL `/exec` dan masukkan `CLASS_CODE`. Klik **Verifikasi dan aktifkan otomatis**. Web mengirim pemeriksaan koneksi terlebih dahulu, baru mengaktifkan antrean.
7. Masuk sebagai siswa uji, centang satu langkah, tunggu konfirmasi. Periksa bar menunjukkan **Progres tersinkron ke Drive**, lalu periksa `PL_Rekap`, `PL_Modul`, dan folder `Data Siswa Parametra`.
8. Simpan satu berkas kecil lewat Portofolio dan periksa `PL_Karya` serta berkas Drive. Sebelum digunakan seluruh kelas, cocokkan isi berkas yang diunduh kembali. Pengujian langsung ini belum dilakukan oleh pengembang karena URL deployment dan izin Google belum tersedia.

URL disimpan pada browser; kode kelas hanya pada sesi tab dan perlu dimasukkan lagi setelah sesi berakhir. Untuk membagikan URL ke seluruh perangkat melalui versi web, isi `webAppUrl` pada `lib/drive-sync.json`, lalu jalankan `npm run build:offline` dan bagikan hasil beserta folder `public`. **Jangan menaruh CLASS_CODE atau sandi Google di kode sumber/config publik.**

## Yang diperbarui otomatis

- Checklist dan kuis empat modul dikirim setelah data lokal berhasil disimpan. Beberapa perubahan cepat digabung menjadi kiriman terbaru.
- Riwayat checklist/kuis digabung berdasarkan ID aktivitas, bukan menimpa seluruh riwayat siswa dengan isi satu perangkat. Nilai terbaru per langkah ditentukan oleh waktu aktivitas; gunakan jam perangkat yang benar. Persentase tetap merupakan checklist mandiri, bukan penilaian praktik guru.
- Karya yang disimpan lewat Portofolio, refleksi karya, dan tautannya masuk antrean. Berkas maksimal 20 MB; unggahan ulang memakai ID yang sama agar tidak menggandakan berkas. Membuka file di Viewer atau menggambar di Lab 3D tidak otomatis mengumpulkan file tersebut; unduh hasil Lab lalu simpan lewat Portofolio.
- Internet terputus atau Google gagal memberi konfirmasi: kiriman tetap di antrean IndexedDB. Web mencoba lagi saat kembali online/terbuka. Antrean tidak dapat mengirim ketika browser ditutup; buka kembali web dan aktifkan sesi sinkronisasi untuk melanjutkan. Jangan hapus data browser sebelum semua kiriman terkonfirmasi.
- PIN, hash PIN, dan kata sandi Google tidak disertakan pada kiriman. Refleksi teks modul yang terpisah dari karya dan draf Lab 3D tidak dikirim.

## Letak data dan batas fungsi

- `PL_Rekap`: satu baris per kelas + presensi, persentase empat modul, kuis terakhir, dan waktu penerimaan server.
- `PL_Modul`: empat baris per siswa dengan detail checklist dan jumlah metadata karya lokal; bukti bahwa berkas benar-benar diterima ada di `PL_Karya` dan status antrean.
- `PL_Karya`: daftar karya dengan bukti penerimaan dan tautan Drive, hanya untuk pengguna yang memang memiliki akses spreadsheet.
- Drive: `Data Siswa Parametra / XI TP 1 atau XI TP 2 / nomor presensi / progres.json` dan subfolder modul untuk berkas karya.
- Sharing file/folder mengikuti izin Google yang sudah ada. Endpoint tidak mengubah sharing. Jangan membuka spreadsheet berisi data kelas ke publik.
- Panel guru pada web tetap rekap **lokal** dan belum terlindungi sebagai akun guru. Gunakan spreadsheet untuk melihat rekap daring seluruh kiriman. Pemulihan progres cloud ke browser lain belum otomatis.
- Header spreadsheet, snapshot yang rusak, benturan ID aktivitas, batas kuota, atau kode yang salah menghentikan kiriman terkait tanpa menghapus data lokal. Perbaiki penyebabnya, lalu klik **Coba sinkron**.

## Memperbarui / menonaktifkan

Setelah mengubah Apps Script, buka **Manage deployments → Edit → New version → Deploy**. URL `/exec` biasanya tetap sama jika memperbarui deployment tersebut. Untuk menghentikan penerimaan, ubah Script property `SYNC_ENABLED` menjadi `false`. Tombol **Jeda pengiriman berikutnya** pada web menghapus kode sesi dan menghentikan antrean berikutnya; kiriman yang sudah diproses Google mungkin tetap selesai.

Rujukan: [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web), [HTML iframe response](https://developers.google.com/apps-script/reference/html/x-frame-options-mode).
