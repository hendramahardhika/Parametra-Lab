/**
 * Asesmen SEBELUM penggunaan media/web pembelajaran.
 * Tempel di Code.gs proyek Google Apps Script baru, lalu jalankan
 * buatAsesmenDiagnostikFusion. Form dibuat sebagai draf untuk ditinjau.
 * Terpisah dari angket evaluasi penggunaan Parametra Lab.
 */
function buatAsesmenDiagnostikFusion() {
  const properti = PropertiesService.getScriptProperties();
  const idLama = properti.getProperty('DIAGNOSTIK_FUSION_FORM_ID');
  if (idLama) {
    const lama = FormApp.openById(idLama);
    Logger.log('Form diagnostik sudah tersedia. Edit: ' + lama.getEditUrl());
    Logger.log('Tautan siswa setelah dipublikasikan: ' + lama.getPublishedUrl());
    return;
  }
  const form = FormApp.create('Asesmen Diagnostik Awal — Pembelajaran Autodesk Fusion', false);
  form.setDescription([
    'Tujuan asesmen ini adalah memetakan pemahaman awal, pengalaman, kesulitan, dan kebutuhan bantuan dalam mempelajari Autodesk Fusion.',
    'Isi sebelum menggunakan media/web pembelajaran yang akan dievaluasi. Jawablah sesuai kondisi sebenarnya.',
    'Kerjakan bagian pemahaman secara mandiri tanpa mencari jawaban dari sumber lain. Pilih Belum tahu jika belum memahami jawabannya.',
    'Pada bagian kesulitan, pilihan Belum mempelajari/mencoba berbeda dari sangat sulit.',
    'Nama, kelas, dan presensi digunakan untuk rekap pembelajaran; asesmen ini tidak anonim.'
  ].join('\n\n'));
  // Form biasa: kunci hanya untuk guru, tidak dikirim sebagai kuis/jawaban ke siswa.
  // Penskoran 10 soal pemahaman dijelaskan pada PANDUAN-DIAGNOSTIK.md.
  form.setIsQuiz(false);
  form.setCollectEmail(false);
  form.setPublishingSummary(false);
  form.setShowLinkToRespondAgain(false);
  form.setLimitOneResponsePerUser(false);
  form.setShuffleQuestions(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('Terima kasih. Jawabanmu akan digunakan untuk merencanakan bantuan belajar yang sesuai kebutuhan siswa.');

  function pilihan(judul, opsi, petunjuk) {
    const item = form.addMultipleChoiceItem().setTitle(judul).setChoiceValues(opsi).setRequired(true);
    if (petunjuk) item.setHelpText(petunjuk);
    return item;
  }
  form.addSectionHeaderItem().setTitle('A. Identitas dan kondisi awal');
  form.addTextItem().setTitle('Nama lengkap').setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^\\s*\\S(?:.*\\S)?\\s*$')
      .setHelpText('Isi nama lengkap, bukan hanya spasi.').build());
  pilihan('Kelas', ['XI TP 1', 'XI TP 2']);
  form.addTextItem().setTitle('Nomor presensi').setHelpText('Ketik nomor 1–99; misalnya 1 atau 01, bukan NIS.').setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^(0?[1-9]|[1-9][0-9])$')
      .setHelpText('Isi bilangan bulat 1–99.').build());
  pilihan('A1. Pengalaman tertinggi yang pernah kamu lakukan dengan Autodesk Fusion', [
    'Belum pernah mengenal atau menggunakan Fusion',
    'Pernah melihat penjelasan/demonstrasi, tetapi belum mencoba sendiri',
    'Pernah mencoba membuat sketch 2D',
    'Pernah membuat part/model 3D',
    'Pernah mencoba merakit beberapa komponen (assembly)'
  ], 'Pilih tahap paling lanjut yang pernah kamu coba, meskipun masih dengan bantuan.');
  pilihan('A2. Akses komputer/laptop untuk berlatih Fusion di luar jam pelajaran', [
    'Tersedia perangkat yang dapat saya gunakan secara rutin',
    'Tersedia perangkat bersama/pinjaman, tetapi penggunaannya terbatas',
    'Hanya dapat menggunakan komputer sekolah pada waktu yang diizinkan',
    'Belum mempunyai akses komputer/laptop untuk latihan'
  ]);
  pilihan('A3. Kondisi akses internet untuk belajar di luar sekolah', [
    'Umumnya tersedia dan cukup stabil',
    'Tersedia, tetapi kuota atau kestabilannya terbatas',
    'Hanya tersedia pada tempat/waktu tertentu',
    'Sulit atau tidak tersedia'
  ]);

  form.addPageBreakItem().setTitle('B. Pemahaman awal Autodesk Fusion')
    .setHelpText('Ada 10 soal. Pilih satu jawaban; pilih E jika belum tahu. Tidak perlu menebak agar kebutuhan belajarmu dapat dipetakan.');
  soalPemahamanDiagnostikFusion_().forEach(function(soal, indeks) {
    pilihan('B' + (indeks + 1) + '. ' + soal.tanya,
      soal.opsi.map(function(teks, i) { return String.fromCharCode(65 + i) + '. ' + teks; }).concat(['E. Belum tahu']));
  });

  form.addPageBreakItem().setTitle('C. Pemetaan kesulitan belajar')
    .setHelpText('Untuk kegiatan yang sudah pernah dicoba, pilih tingkat kesulitan yang paling sesuai. Jika belum pernah mencoba, pilih pilihan terakhir, bukan angka 5.');
  const tingkat = [
    '1 — Tidak sulit', '2 — Sedikit sulit', '3 — Cukup sulit',
    '4 — Sulit', '5 — Sangat sulit', 'Belum mempelajari/mencoba'
  ];
  const kegiatan = [
    'Membaca ukuran pada gambar kerja/jobsheet.',
    'Membuat bentuk sketch 2D sesuai gambar kerja.',
    'Memberikan ukuran sketch dengan Sketch Dimension.',
    'Menggunakan constraint untuk mengendalikan bentuk/posisi sketch.',
    'Memilih perintah pembentukan part 3D yang sesuai dengan bentuk benda.',
    'Menemukan penyebab kesalahan ketika hasil model tidak sesuai.',
    'Memahami hubungan gerak komponen pada assembly.',
    'Mengulangi langkah praktik secara mandiri setelah demonstrasi guru.'
  ];
  kegiatan.forEach(function(teks, i) { pilihan('C' + (i + 1) + '. ' + teks, tingkat); });

  form.addPageBreakItem().setTitle('D. Kebutuhan bantuan dan refleksi')
    .setHelpText('Tidak ada jawaban benar atau salah pada bagian ini. Pilih kebutuhanmu, bukan jawaban yang kamu anggap diharapkan guru.');
  pilihan('D1. Bantuan mana yang paling kamu butuhkan untuk belajar Fusion saat ini?', [
    'Penjelasan kembali konsep dasar sebelum praktik',
    'Contoh langkah kerja yang dapat dipelajari ulang',
    'Gambar/model yang membantu saya membayangkan bentuk benda',
    'Latihan bertahap disertai umpan balik',
    'Pendampingan langsung saat mengalami kesulitan',
    'Kesempatan menggunakan komputer untuk berlatih',
    'Belum memerlukan bantuan tambahan',
    'Belum dapat menentukan kebutuhan saya'
  ], 'Pilih satu kebutuhan yang paling utama.');
  pilihan('D2. Bentuk sumber belajar yang paling memungkinkan kamu gunakan di luar kelas', [
    'Modul atau jobsheet cetak',
    'Video/file yang dapat digunakan tanpa internet',
    'Materi daring melalui HP',
    'Materi daring melalui komputer/laptop',
    'Belajar langsung bersama guru/teman pada waktu yang disepakati',
    'Belum dapat menentukan'
  ]);
  form.addParagraphTextItem()
    .setTitle('D3. Ceritakan satu pengalaman atau bagian yang paling membuatmu kesulitan saat mempelajari Autodesk Fusion.')
    .setHelpText('Jelaskan pada langkah apa kamu terhenti dan apa yang kamu lakukan saat itu. Jika belum pernah belajar Fusion, tuliskan hal yang belum kamu ketahui dan ingin dipelajari. Jika tidak ada kesulitan, jelaskan bagian yang sudah kamu kuasai.')
    .setRequired(true);
  form.addParagraphTextItem()
    .setTitle('D4. Bantuan atau sumber belajar seperti apa yang kamu perlukan agar lebih mudah belajar Autodesk Fusion?')
    .setHelpText('Berikan contoh cara kamu akan menggunakannya. Tidak harus berupa website; boleh pendampingan langsung, bahan cetak, latihan, video, atau bentuk lain. Jika belum membutuhkan bantuan tambahan, jelaskan alasannya.')
    .setRequired(true);

  properti.setProperty('DIAGNOSTIK_FUSION_FORM_ID', form.getId());
  Logger.log('Draf diagnostik selesai: 4 halaman, 3 identitas, 3 kondisi awal, 10 soal pemahaman, 8 butir kesulitan, 2 kebutuhan, dan 2 esai.');
  Logger.log('Tautan edit guru: ' + form.getEditUrl());
  Logger.log('Tautan siswa setelah ditinjau dan dipublikasikan: ' + form.getPublishedUrl());
}

// Kunci untuk guru saja: indeks benar dihitung dari 0 (A=0, B=1, C=2, D=3).
// Tidak dimasukkan ke judul, petunjuk, atau opsi form siswa.
function soalPemahamanDiagnostikFusion_() {
  return [
    {topik:'Fungsi CAD', tanya:'Apa salah satu penggunaan utama workspace Design pada Autodesk Fusion?',
      opsi:['Menyunting rekaman video', 'Membuat dan mengubah model komponen 3D', 'Mengolah daftar nilai siswa', 'Mengirim surat elektronik'], benar:1},
    {topik:'Bidang sketch', tanya:'Untuk mulai membuat sketch 2D, tempat gambar yang dipilih adalah ...',
      opsi:['Bidang kerja atau permukaan datar yang sesuai', 'Sembarang tepi melengkung tanpa bidang', 'Hanya gambar hasil render', 'Hanya komponen yang sudah dirakit'], benar:0},
    {topik:'Membaca ukuran', tanya:'Pada gambar kerja tertulis Ø12 mm untuk sebuah lubang. Apa artinya?',
      opsi:['Radius lubang 12 mm', 'Kedalaman lubang 12 mm', 'Diameter lubang 12 mm', 'Jarak antarlubang 12 mm'], benar:2},
    {topik:'Constraint', tanya:'Sketch disebut fully constrained jika ...',
      opsi:['Semua garis sudah dihapus', 'Sketch selalu sudah menjadi solid', 'Semua garis memiliki panjang yang sama', 'Ukuran dan posisi seluruh geometrinya sudah terdefinisi'], benar:3},
    {topik:'Extrude', tanya:'Perintah yang umum digunakan untuk membuat balok dari profil persegi tertutup dengan jarak penarikan 20 mm adalah ...',
      opsi:['Revolve', 'Extrude', 'Joint', 'Orbit'], benar:1},
    {topik:'Revolve', tanya:'Apa prinsip pembentukan model menggunakan Revolve?',
      opsi:['Menggeser seluruh tampilan tanpa mengubah model', 'Menggabungkan tabel data', 'Memutar profil mengelilingi sumbu', 'Menyembunyikan semua sketch'], benar:2},
    {topik:'Extrude Cut', tanya:'Saat memakai Extrude dari profil lingkaran untuk membuang material pada sebuah balok, operasi yang dipilih adalah ...',
      opsi:['Cut', 'Join', 'New Body', 'New Component'], benar:0},
    {topik:'Fillet', tanya:'Untuk membulatkan tepi pada sebuah solid, perintah yang paling sesuai adalah ...',
      opsi:['Shell', 'Chamfer', 'Joint', 'Fillet'], benar:3},
    {topik:'Assembly', tanya:'Apa fungsi Joint dalam pemodelan assembly?',
      opsi:['Mengganti semua ukuran menjadi warna', 'Menetapkan hubungan posisi dan gerak relatif antarkomponen', 'Membuat lembar perhitungan', 'Menghapus riwayat pemodelan'], benar:1},
    {topik:'Perubahan parametrik', tanya:'Dalam desain parametrik, panjang sketch awal perlu diubah. Tindakan yang sesuai adalah ...',
      opsi:['Hanya mengganti warna model', 'Menghapus seluruh desain dan selalu mulai ulang', 'Mengedit nilai dimensi pada sketch yang terkait', 'Memperbesar tampilan dengan Zoom'], benar:2}
  ];
}
