# Lab 3D — Ruang desain

Buka menu **Lab 3D → Ruang desain** pada Parametra Lab. Editor bekerja di browser, termasuk versi `index.html` mandiri. Tab **Viewer model** menyediakan pembuka STL/OBJ dan embed Autodesk untuk mengamati hasil latihan.

## Contoh animasi

Buka **Lab 3D → Contoh animasi**, atau klik tombol oren **Contoh animasi** di bar proyek editor. Tersedia contoh Extrude, Revolve, Sweep, Loft, Press Pull, Fillet, Chamfer, dan Shell. Revolve dipilih saat pertama membuka tab.

Setiap contoh memiliki tujuh tahap: menggambar sketch, memilih perintah/menyiapkan solid awal, memilih profil/perintah Modify, memilih sumbu/jalur/profil kedua/muka/tepi, mengatur parameter, menerapkan perubahan bentuk, dan mengamati hasilnya. Pada Revolve, profil poros bertingkat digambar di bidang XZ, lalu sumbu vertikal pada X = 0 disorot sebelum profil berputar menjadi poros 360°.

- **Putar / Jeda** menjalankan atau menghentikan animasi; animasi mulai dalam keadaan jeda.
- Tombol panah dan daftar langkah dapat dipakai untuk maju/mundur per tahap.
- Sasaran oren pada tahap pemilihan bisa diklik atau dipilih dengan Tab lalu Enter untuk melanjutkan.
- Penggeser waktu dan pilihan kecepatan 0,5× / 1× / 1,5× membantu mengamati perubahan.
- **Coba di editor** membuka salinan hasil contoh beserta parameter perintahnya untuk diedit. Tindakan ini menjadi satu keadaan baru di riwayat editor; Undo mengembalikan draf sebelumnya. Menonton animasi saja tidak mengubah draf siswa.

Profil dan model 3D di animasi dihitung dari geometri editor, termasuk Revolve parsial, Sweep sepanjang busur, pertumbuhan Loft/Extrude, perubahan tinggi, pembulatan, chamfer, dan pengosongan Shell. Animasi proses diperlambat untuk pembelajaran; bukan rekaman antarmuka Fusion. Contoh merupakan latihan bebas dan tidak mengganti dimensi jobsheet atau memberi nilai/progres modul otomatis. Tampilan animasi memakai proyeksi mesh ke kanvas sehingga dapat bekerja tanpa WebGL; editor model tetap memakai WebGL.

## Alur latihan

1. Pilih bidang XY, XZ, atau YZ. Satu proyek memiliki satu sketch pada satu bidang.
2. Gunakan **Garis**, **Persegi**, atau **Lingkaran**. Klik titik awal dan titik akhir, atau klik-seret. Untuk lingkaran, titik pertama adalah pusat dan titik kedua menentukan radius.
3. Klik **Pilih** atau **Ukuran**, lalu klik objek. Atur posisi dan ukuran dalam mm di panel Properti. Persegi memakai posisi sudut kiri bawah; lingkaran memakai pusat. Koordinat pada panel merupakan koordinat lokal sketch.
4. Snap mengikuti grid 1 mm, origin (0,0), pusat lingkaran/persegi, titik tengah sisi, dan titik ujung. Saat kursor mendekat, penanda dan label muncul; klik memakai koordinat sasaran tepat. Jarak tangkap 10 piksel tetap sama saat zoom berubah. Matikan tombol Snap untuk menggambar bebas. Tahan Shift saat menggambar garis agar horizontal/vertikal. Garis yang dipilih juga dapat dibuat horizontal/vertikal lewat Properti.
5. Isi ketebalan, lalu klik **Extrude**. Semua profil tertutup dibentuk dengan ketebalan yang sama. Profil di dalam profil menjadi lubang tembus; profil yang lebih dalam mengikuti pola isi/lubang bergantian.
6. Seret model untuk orbit, gulir untuk zoom, atau pilih Depan/Atas/Samping. Kembali ke Sketch untuk mengubah ukuran. Model mengikuti perubahan sketch dan ketebalan.

Profil garis harus tertutup, tidak bercabang, dan tidak bersilangan. Profil berbeda harus terpisah atau sepenuhnya berada di dalam profil lain untuk Extrude; profil bersentuhan/tumpang tindih akan ditolak dengan petunjuk. Lingkaran pada model STL didekati dengan 96 segmen. Editor ini menyediakan latihan mesh sederhana; assembly joints dan boolean antarsolid belum tersedia.

## Toolbar Model 3D

Tab **Model 3D** memiliki kelompok **Create** dan **Modify**. Klik perintah, ubah parameter pada panel kanan, amati pratinjau, lalu klik **Terapkan**. **Batal** atau Esc mengembalikan model tersimpan. Pratinjau belum masuk ke draf atau unduhan sampai diterapkan. Satu proyek memakai satu operasi Create dan maksimal satu Modify; penerapan perintah baru mengganti operasi pada tahap tersebut. Undo/redo dapat mengembalikan perubahan.

| Kelompok | Perintah | Latihan yang tersedia |
| --- | --- | --- |
| Create | Extrude | Semua profil tertutup dengan satu ketebalan. Mendukung lubang tembus dari profil di dalam profil. |
| Create | Revolve | Satu profil tanpa lubang diputar 1–360° pada sumbu vertikal sketch. Posisi X sumbu dapat diatur; profil harus di sisi kanan sumbu. Bidang awal/akhir sudut parsial ditutup. |
| Create | Sweep | Satu profil tanpa lubang mengikuti busur 1–180° pada arah normal bidang sketch. Radius jalur diisi angka dan harus melebihi setengah lebar profil. |
| Create | Loft | Tepat dua persegi/lingkaran sebagai profil bawah dan atas. Atur jarak kedua bidang dan pilih apakah pusatnya sejajar. Objek sketch kedua mewakili profil di bidang atas. |
| Modify | Press Pull | Ubah tinggi akhir hasil Extrude. Belum memilih muka individual. |
| Modify | Fillet | Bulatkan seluruh tepi atas/bawah Extrude, dengan radius lebih kecil dari setengah tinggi. Satu profil cembung tanpa lubang. |
| Modify | Chamfer | Pangkas seluruh tepi atas/bawah Extrude pada 45°. Satu profil cembung tanpa lubang. |
| Modify | Shell | Buka sisi atas Extrude dengan tebal dinding dan dasar yang sama. Satu profil cembung tanpa lubang. |

Modify aktif untuk hasil Extrude. Tebal/radius yang terlalu besar ditolak. Fillet, Chamfer, dan Shell mengganti satu sama lain, bukan ditumpuk. Permukaan lengkung merupakan pendekatan mesh bersegmen, dan operasi masih memakai cakupan latihan pada tabel, bukan seluruh kemampuan kernel CAD Fusion.

Nama fitur pada daftar objek dan urutan fitur mengikuti operasi yang diterapkan. Klik fitur untuk membuka pengaturannya kembali. Q membuka Press Pull dan F membuka Fillet pada model Extrude. File proyek JSON menyimpan operasi serta ukuran Modify; file versi lama yang hanya memiliki Extrude tetap dapat dibuka.

**Buka contoh** membuat contoh bebas plat berlubang 80 × 50 mm, dua lubang Ø12 mm. Contoh ini bukan dimensi jobsheet dan tidak mengubah materi penilaian guru. Undo dapat mengembalikan sketch sebelumnya.

## Simpan dan lanjutkan

- Draf otomatis tersimpan di browser setelah perubahan. Tombol Simpan menyimpan segera.
- Draf dipisahkan berdasarkan identitas siswa yang sedang masuk dan lokasi web. Pengguna tanpa login memakai draf tamu.
- **Unduh proyek** menghasilkan `.parametra.json`. **Buka** dapat memulihkan file ini untuk diedit lagi. Maksimal 1 MB dan 100 objek.
- **Unduh sketch SVG** mempertahankan skala mm. **Unduh model STL** menghasilkan mesh hasil extrude, dalam satuan mm. STL tidak membawa riwayat edit; gunakan JSON untuk melanjutkan latihan di editor.
- Draf ini tidak otomatis dikirim ke guru atau Google Drive. Simpan JSON sebagai cadangan sebelum menghapus data browser. Jika draf lama rusak, editor tidak menimpanya otomatis; unduh latihan baru sebagai JSON.
- Undo/redo menyimpan sampai 60 keadaan selama editor terbuka, tidak ikut disimpan dalam file JSON.

## Pemeriksaan pengembang

Jalankan `node scripts/check-cad-workbench.mjs`, `node scripts/check-cad-tutorial.mjs`, `npx tsc --noEmit --incremental false`, lalu `npm run build:offline` setelah mengubah sumber. Pemeriksaan geometri mencakup volume, lubang tembus, tiga bidang, profil garis tertutup, mesh kedap, penolakan profil tidak valid, pemulihan JSON, dan pemisahan kunci draf siswa. Pemeriksaan contoh mencakup delapan perintah, tujuh tahap, koordinat proyeksi, validitas frame antara, urutan profil/sumbu, dan kesesuaian hasil akhir dengan proyek contoh.

Implementasi model memakai [ExtrudeGeometry Three.js](https://threejs.org/docs/pages/ExtrudeGeometry.html), triangulasi profil dengan [ShapeUtils](https://threejs.org/docs/pages/ShapeUtils.html), geometri permukaan parametrik, dan ekspor [STLExporter](https://threejs.org/docs/pages/STLExporter.html).
