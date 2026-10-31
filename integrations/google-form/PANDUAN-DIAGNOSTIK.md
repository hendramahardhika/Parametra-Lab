# Asesmen diagnostik awal Autodesk Fusion

Instrumen ini diberikan **sebelum penggunaan media pembelajaran** untuk memetakan kebutuhan, bukan untuk membuktikan terlebih dahulu bahwa website pasti diperlukan. Terpisah dari angket evaluasi Parametra Lab setelah penggunaan.

## Menjalankan skrip

1. Buat proyek Google Apps Script **baru**, jangan menimpa proyek angket evaluasi/Drive.
2. Salin seluruh `Asesmen-Diagnostik-Fusion.gs` ke `Code.gs`, simpan, pilih **buatAsesmenDiagnostikFusion**, lalu Jalankan. Tinjau dan setujui izin Google pada akun yang sesuai.
3. Buka tautan edit pada Log eksekusi. Form dibuat sebagai **draf**, bukan langsung dibagikan. Tinjau soal bersama guru mata pelajaran, uji dengan satu pengisian contoh, lalu Publikasikan dan periksa akses responden.
4. Bagikan tautan siswa, bukan tautan edit. Tidak perlu deployment Web app atau URL `/exec`.
5. Respons tersedia pada tab Jawaban/Respons. Gunakan ikon Sheets di sana bila membutuhkan spreadsheet rekap. Tidak ada spreadsheet, trigger, atau sinkronisasi website yang dibuat oleh skrip.

Pemanggilan ulang pada proyek yang sama membuka form yang tersimpan, tanpa menggandakan pertanyaan atau menghapus respons. Skrip tidak memperbarui otomatis soal pada form lama setelah Anda mengubah kode; gunakan editor Forms atau buat proyek lain jika memang membutuhkan instrumen baru. ID properti `DIAGNOSTIK_FUSION_FORM_ID` terpisah dari angket evaluasi.

## Susunan

| Halaman | Isi |
| --- | --- |
| A | Nama lengkap, kelas XI TP 1 / XI TP 2, presensi ketik; pengalaman Fusion, akses komputer, dan internet |
| B | 10 soal pilihan ganda konsep dasar, masing-masing empat opsi isi dan E Belum tahu |
| C | 8 butir kesulitan: 1 Tidak sulit sampai 5 Sangat sulit, ditambah Belum mempelajari/mencoba |
| D | 2 pertanyaan kebutuhan bantuan/sumber belajar dan 2 esai reflektif |

Total 28 isian wajib: 3 identitas dan 25 pertanyaan. Perkirakan 15–20 menit, lalu sesuaikan setelah uji coba. Tidak perlu menggunakan website atau membuka Fusion untuk menjawab. Laksanakan tes secara mandiri sebelum diskusi jawaban; pilih Belum tahu daripada menebak. Jangan menyamakan pengalaman belum mencoba dengan kesulitan tinggi.

## Kunci bagian B — hanya untuk guru

| Soal | Kunci | Aspek / alasan |
| --- | --- | --- |
| B1 | B | Design dipakai untuk pemodelan komponen 3D. |
| B2 | A | Sketch 2D dibuat pada bidang kerja/permukaan datar yang dipilih. |
| B3 | C | Ø menyatakan diameter, bukan radius. |
| B4 | D | Fully constrained: ukuran dan posisi seluruh geometri terdefinisi. |
| B5 | B | Extrude memberi jarak/kedalaman dari profil. |
| B6 | C | Revolve memutar profil terhadap sumbu. |
| B7 | A | Cut membuang material dari body yang sudah ada. |
| B8 | D | Fillet membulatkan tepi solid; Chamfer membentuk tepi miring. |
| B9 | B | Joint mengatur hubungan posisi/gerak relatif komponen. |
| B10 | C | Dimensi sketch dapat diedit pada desain parametrik. |

Form sengaja berupa **form biasa, bukan kuis otomatis**. Kunci tidak ditampilkan kepada responden dan skor tidak dihitung otomatis oleh skrip. Di rekap guru: benar = 1, salah/Belum tahu = 0; jumlah 0–10, atau `(jumlah benar / 10) × 100` untuk ringkasan. Laporkan juga jumlah/persentase Belum tahu per soal secara terpisah. Nilai ini adalah hasil tes konsep singkat, **bukan bukti keterampilan praktik**. Hindari batas kategori seperti rendah/tinggi tanpa kriteria yang telah ditetapkan dan ditelaah sebelumnya.

## Mengubah temuan menjadi kebutuhan pembelajaran

- Bagian B menunjukkan konsep yang perlu ditindaklanjuti. Salah satu jawaban salah tidak cukup untuk menetapkan miskonsepsi tertentu; konfirmasi dengan pertanyaan lanjutan atau tugas praktik singkat.
- Bagian C adalah laporan kesulitan, **bukan skor kemampuan**. Untuk tiap butir, tampilkan distribusi 1–5 dan jumlah Belum mempelajari/mencoba secara terpisah. Jika melaporkan proporsi Sulit/Sangat sulit, penyebutnya hanya siswa yang memilih 1–5, bukan seluruh kelas. Jika belum ada yang mencoba, jangan menghitung rata-rata kesulitan dari kategori itu.
- Bagian A membedakan keterbatasan pengalaman, perangkat, dan internet. Jawaban D membantu memilih bentuk dukungan. Website tidak otomatis sesuai jika siswa tidak memiliki akses; pertimbangkan alternatif cetak, offline, dan pendampingan.
- Kodekan esai menjadi tema berdasarkan isi nyata: misalnya lupa urutan, kesulitan membaca ukuran, memvisualisasikan benda, pesan kesalahan, waktu latihan, atau akses perangkat. Jangan membuat kutipan/angka seolah-olah sudah ada respons. Sajikan kutipan tanpa nama saat melaporkan hasil.

Contoh pemetaan **bersyarat**, bukan kesimpulan hasil penelitian:

| Jika temuan nyata menunjukkan ... | Alternatif dukungan yang dapat dipertimbangkan |
| --- | --- |
| Kesulitan mengulangi demonstrasi (C8) | Panduan langkah, video pendek yang dapat diputar ulang; dapat disediakan lewat web atau file offline |
| Kesulitan ukuran/sketch (C1–C4, B2–B4) | Jobsheet beranotasi, contoh sketch dan latihan dasar bertahap |
| Kesulitan memilih fitur/memperbaiki model (C5–C6, B5–B8/B10) | Contoh proses fitur, latihan dengan umpan balik, klinik kesalahan |
| Kesulitan hubungan komponen (C7, B9) | Visualisasi/animasi assembly disertai penjelasan hubungan gerak |
| Internet/perangkat terbatas (A2–A3) | Paket offline, materi ringan ramah HP, bahan cetak dan jadwal akses komputer |

Website pembelajaran dapat diusulkan **jika data mendukung kebutuhannya** dan akses siswa memungkinkan. Gabungkan tes, laporan kesulitan, observasi praktik, dan masukan guru; jangan menyimpulkan website efektif atau meningkatkan hasil belajar hanya dari asesmen awal ini. Draf belum melalui validasi ahli, uji butir, atau uji reliabilitas. Sesuaikan dengan cakupan materi yang benar-benar telah diajarkan dan telaah sebelum penelitian formal.

## Privasi dan batas teknis

Nama, kelas, presensi membuat data tidak anonim. Batasi izin editor/hasil kepada pihak berwenang; jangan membagikan form edit, spreadsheet respons, atau panduan kunci kepada siswa sebelum asesmen selesai. Email tidak dikumpulkan, ringkasan publik dinonaktifkan, tidak ada pembatasan satu respons per akun; pengisian ganda/identitas palsu tetap mungkin. Kebijakan akun sekolah dapat membatasi akses. Belum ada pembuatan atau uji Google Form nyata melalui Codex; pengujian lokal menggunakan mock API.

Jalankan `node scripts/check-diagnostic-form.mjs` untuk memeriksa struktur empat halaman/28 isian, pilihan kelas, validasi identitas, jumlah soal dan pemisahan kunci, opsi belum mencoba, kebutuhan netral, pengaturan privasi, dan pemanggilan ulang tanpa duplikasi.

## Rujukan teknis dan materi

- [Google Forms service](https://developers.google.com/apps-script/reference/forms), [FormApp](https://developers.google.com/apps-script/reference/forms/form-app), [Form](https://developers.google.com/apps-script/reference/forms/form).
- [Autodesk: Sketching and Part Modeling](https://www.autodesk.com/learn/ondemand/tutorial/sketching-and-part-modeling).
- [Sketch fully constrained](https://help.autodesk.com/cloudhelp/ENU/Fusion-Sketch/files/SKT-FULLY-DEFINE-CONSTRAIN-SKETCH.htm).
- [Sketches in Fusion](https://help.autodesk.com/cloudhelp/ENU/Fusion-Sketch/files/SKT-3D-SKETCH.htm).
- [Extrude dan operasi Cut](https://help.autodesk.com/view/fusion360/ENU/?contextId=SLD-EXTRUDE-SOLID).
- [Joint](https://help.autodesk.com/cloudhelp/ENU/Fusion-Assemble/files/ASM-JOINT-COMMAND.htm).
- [Dimensi sketch dan pengeditannya](https://help.autodesk.com/view/fusion360/ENU/?contextId=SKT-CREATE-DIMENSIONS).
