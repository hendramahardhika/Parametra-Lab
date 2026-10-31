export const fusionInterfaceImage = 'learning/fusion-interface.jpg';
export const fusionInterfaceDriveUrl = 'https://drive.google.com/file/d/1KLBqV0Bn9JOXxeGgWG7wxaDuNTCgr35a/view';
export const fusionInterfaceHelpUrl = 'https://help.autodesk.com/view/fusion360/ENU/?contextId=LP-STEPS-P13N-SNP-GS-OTH-CRD-1';

// Nomor mengikuti gambar referensi guru, bukan penomoran pada dokumentasi versi terbaru.
export const fusionInterfaceParts = [
  {
    number: 1,
    name: 'Application Bar',
    title: 'Menu utama dan tab desain',
    location: 'Bagian atas, mulai dari sudut kiri.',
    description: 'Tempat mengakses perintah dasar dan berpindah di antara desain yang sedang dibuka. Setiap tab mewakili satu file desain.',
    points: [
      'Data Panel membuka daftar file. Menu File digunakan untuk membuat, membuka, mengekspor, atau membagikan desain.',
      'Save menyimpan desain. Jika tersedia, tambahkan catatan versi agar perubahan mudah dikenali.',
      'Undo membatalkan tindakan terakhir. Redo mengulangi tindakan yang sudah dibatalkan.',
    ],
    practice: 'Temukan tombol Save dan Undo, lalu perhatikan nama desain pada tab yang aktif.',
  },
  {
    number: 2,
    name: 'Data Panel',
    title: 'Tempat mengelola file desain',
    location: 'Panel besar di sebelah kiri saat Data Panel dibuka.',
    description: 'Menampilkan proyek, folder, dan file desain. Gunakan folder agar pekerjaan dari setiap latihan tersusun rapi.',
    points: [
      'Buat proyek atau folder untuk mengelompokkan file latihan.',
      'Klik dua kali file, atau klik kanan lalu pilih Open, untuk membukanya.',
      'Pengaturan anggota proyek dan kerja bersama mengikuti izin akun serta jenis lisensi yang digunakan.',
    ],
    practice: 'Buka satu file latihan dari folder yang ditentukan guru.',
  },
  {
    number: 3,
    name: 'Profile and Help',
    title: 'Akun, bantuan, dan status aplikasi',
    location: 'Sudut kanan atas pada gambar referensi.',
    description: 'Tempat memeriksa akun dan mencari bantuan saat menggunakan Fusion.',
    points: [
      'Notification Center menampilkan pemberitahuan. Job Status memperlihatkan proses yang berjalan, status pembaruan, dan koneksi aplikasi.',
      'Profile digunakan untuk membuka akun Autodesk, mengatur Preferences, atau keluar dari akun. Pilihan tim mengikuti akses akun.',
      'Help menyediakan panduan penggunaan dan sumber belajar Fusion.',
    ],
    practice: 'Temukan menu Help. Gunakan akun sendiri dan hindari mengubah pengaturan komputer laboratorium tanpa izin.',
  },
  {
    number: 4,
    name: 'Toolbar',
    title: 'Kumpulan alat untuk bekerja',
    location: 'Di bawah menu utama.',
    description: 'Berisi alat untuk membuat dan mengubah desain. Alat yang muncul menyesuaikan workspace atau ruang kerja yang dipilih.',
    points: [
      'Pilih workspace Design untuk latihan pemodelan sesuai arahan guru.',
      'Tab seperti Solid dan Surface mengelompokkan alat berdasarkan kegunaannya. Saat membuat sketsa, alat Sketch akan muncul.',
      'Letak alat dapat disesuaikan, tetapi kenali susunan dasarnya terlebih dahulu.',
    ],
    practice: 'Temukan Create Sketch dan perhatikan perubahan alat ketika masuk ke mode Sketch.',
  },
  {
    number: 5,
    name: 'Browser',
    title: 'Daftar isi desain',
    location: 'Panel di sebelah kiri area gambar.',
    description: 'Menampilkan susunan objek, seperti Origin, Sketches, Bodies, Components, dan Joints. Panel ini berbeda dari browser internet.',
    points: [
      'Klik tanda panah untuk melihat isi suatu kelompok objek.',
      'Gunakan ikon visibilitas untuk menampilkan atau menyembunyikan objek tanpa menghapusnya.',
      'Periksa satuan pada Document Settings. Ikuti satuan yang tercantum pada jobsheet.',
    ],
    practice: 'Temukan satu sketsa, lalu sembunyikan dan tampilkan kembali dengan ikon visibilitas.',
  },
  {
    number: 6,
    name: 'ViewCube',
    title: 'Pengatur arah pandang',
    location: 'Sudut kanan atas area gambar.',
    description: 'Membantu melihat model dari depan, atas, samping, atau sudut lainnya tanpa mengubah bentuk model.',
    points: [
      'Klik sisi, rusuk, atau sudut kubus untuk memilih arah pandang.',
      'Seret ViewCube untuk memutar pandangan. Gunakan panah yang tersedia untuk mengubah orientasi tampilan.',
      'Klik ikon Home di dekat ViewCube untuk kembali ke tampilan awal yang ditetapkan.',
    ],
    practice: 'Lihat model dari arah Front dan Top, kemudian kembali dengan Home.',
  },
  {
    number: 7,
    name: 'Canvas and Marking Menu',
    title: 'Area gambar dan menu klik kanan',
    location: 'Area luas di tengah layar.',
    description: 'Canvas adalah tempat membuat sketsa, memilih objek, dan melihat hasil desain. Klik kanan di area ini untuk membuka Marking Menu.',
    points: [
      'Marking Menu menyediakan perintah yang sering digunakan sesuai objek dan kegiatan yang sedang aktif.',
      'Pilih perintah dari menu klik kanan. Setelah terbiasa, gerakan klik kanan dan seret dapat mempercepat pemilihan perintah.',
      'Isi dan posisi perintah dapat berubah sesuai konteks. Baca nama perintah sebelum memilihnya.',
    ],
    practice: 'Klik kanan pada Canvas, amati pilihan yang muncul, lalu tekan Esc untuk menutup menu.',
  },
  {
    number: 8,
    name: 'Navigation Bar and Display Settings',
    title: 'Navigasi dan pengaturan tampilan',
    location: 'Bagian bawah area gambar.',
    description: 'Mengatur cara melihat model dan tampilan area kerja. Pengaturan ini membantu pemeriksaan tanpa mengubah ukuran benda.',
    points: [
      'Zoom memperbesar atau memperkecil tampilan. Pan menggeser pandangan. Orbit memutar pandangan mengelilingi model.',
      'Display Settings mengatur tampilan seperti lingkungan, bayangan, dan gaya visual.',
      'Pengaturan di area ini juga dapat digunakan untuk menampilkan grid atau beberapa pandangan sekaligus.',
    ],
    practice: 'Coba Zoom, Pan, dan Orbit. Perhatikan bahwa bentuk dan ukuran model tetap sama.',
  },
  {
    number: 9,
    name: 'Timeline',
    title: 'Riwayat langkah pemodelan',
    location: 'Bagian paling bawah layar.',
    description: 'Menampilkan urutan operasi, misalnya Sketch, Extrude, dan Revolve, saat riwayat desain parametrik aktif.',
    points: [
      'Klik dua kali fitur yang dapat diedit untuk mengubah pengaturannya. Klik kanan untuk melihat pilihan lain.',
      'Perubahan pada langkah awal dapat memengaruhi fitur yang dibuat sesudahnya.',
      'Jangan sembarang menyeret urutan fitur. Hubungan antarfitur dapat terganggu dan menyebabkan error.',
    ],
    practice: 'Kenali urutan fitur pada model latihan. Simpan desain sebelum mencoba perubahan.',
  },
] as const;
