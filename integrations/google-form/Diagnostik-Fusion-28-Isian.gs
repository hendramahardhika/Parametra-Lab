function buatFormDiagnostik28Isian() {
  var form = FormApp.create('Asesmen Diagnostik Awal Autodesk Fusion — 28 Isian', false);
  form.setIsQuiz(false);
  form.setCollectEmail(false);
  form.setPublishingSummary(false);
  form.setProgressBar(true);
  form.setDescription(
    'Jawablah sesuai kemampuan dan pengalamanmu sebelum pembelajaran. ' +
    'Kerjakan secara mandiri. Pilih Belum tahu jika belum memahami soal. ' +
    'Nama, kelas, dan presensi digunakan oleh guru/peneliti untuk rekap pembelajaran dan PTK. ' +
    'Form ini terdiri atas 4 bagian dan 28 isian; jawaban diperiksa manual oleh guru.'
  );

  function pilihan(judul, opsi) {
    form.addMultipleChoiceItem().setTitle(judul).setChoiceValues(opsi).setRequired(true);
  }

  function halaman(judul, petunjuk) {
    form.addPageBreakItem().setTitle(judul).setHelpText(petunjuk);
  }

  // BAGIAN 1: 6 ISIAN
  form.addSectionHeaderItem().setTitle('A. Identitas dan pengalaman awal');
  form.addTextItem().setTitle('Nama lengkap').setRequired(true);
  pilihan('Kelas', ['XI TP 1', 'XI TP 2']);
  form.addTextItem().setTitle('Nomor presensi').setHelpText('Ketik nomor presensi, bukan NIS.').setRequired(true);

  pilihan('A1. Pengalaman tertinggi menggunakan Autodesk Fusion', [
    'Belum pernah mengenal atau menggunakan Fusion',
    'Pernah melihat demonstrasi, tetapi belum mencoba sendiri',
    'Pernah mencoba membuat sketch 2D',
    'Pernah membuat part/model 3D',
    'Pernah mencoba assembly'
  ]);
  pilihan('A2. Akses komputer/laptop untuk latihan di luar jam pelajaran', [
    'Tersedia dan dapat digunakan secara rutin',
    'Perangkat bersama/pinjaman dengan penggunaan terbatas',
    'Hanya komputer sekolah pada waktu yang diizinkan',
    'Belum memiliki akses untuk latihan'
  ]);
  pilihan('A3. Akses internet untuk belajar di luar sekolah', [
    'Umumnya tersedia dan stabil',
    'Tersedia tetapi kuota/kestabilannya terbatas',
    'Hanya tersedia pada tempat/waktu tertentu',
    'Sulit atau tidak tersedia'
  ]);

  // BAGIAN 2: 10 ISIAN
  halaman('B. Pemahaman awal Autodesk Fusion', 'Pilih satu jawaban. Pilih E jika belum tahu.');
  var soal = [
    ['Untuk mulai membuat sketch 2D, tempat gambar yang dipilih adalah ...',
      ['Bidang origin atau muka datar yang sesuai', 'Sumbu putar tanpa memilih bidang sketch', 'Tepi lengkung tanpa bidang sketch', 'Gambar hasil render tanpa bidang sketch']],
    ['Pada gambar kerja tertulis Ø12 mm untuk sebuah lubang. Apa artinya?',
      ['Radius lubang 12 mm', 'Kedalaman lubang 12 mm', 'Diameter lubang 12 mm', 'Jarak pusat lubang ke tepi benda 12 mm']],
    ['Sketch disebut fully constrained jika ...',
      ['Profil sudah tertutup, meskipun masih dapat bergeser', 'Semua garis sama panjang, tetapi posisi belum dikendalikan', 'Sketch menjadi solid, meskipun masih bebas bergerak', 'Ukuran dan posisi seluruh geometrinya sudah terdefinisi']],
    ['Perintah untuk membentuk balok dari profil persegi panjang tertutup dengan kedalaman 20 mm adalah ...',
      ['Revolve', 'Extrude', 'Sweep', 'Loft']],
    ['Profil persegi panjang setinggi 40 mm membentang 20 mm dari sumbu vertikal; sisi kirinya berimpit dengan sumbu. Profil di-Revolve 360° menggunakan New Body. Hasilnya adalah ...',
      ['Silinder berongga', 'Kerucut pejal', 'Silinder pejal berjari-jari 20 mm dan tinggi 40 mm', 'Silinder pejal berjari-jari 40 mm dan tinggi 20 mm']],
    ['Body balok sudah terbentuk. Untuk membuang material melalui Extrude dari profil lingkaran, operasi yang dipilih adalah ...',
      ['Cut', 'Join', 'New Body', 'New Component']],
    ['Perintah untuk membulatkan tepi solid adalah ...',
      ['Shell', 'Chamfer', 'Extrude', 'Fillet']],
    ['Panjang sketch awal pada desain parametrik perlu diubah. Tindakan yang sesuai adalah ...',
      ['Menggeser tampilan menggunakan Pan', 'Memperbesar tampilan menggunakan Zoom', 'Mengedit warna body', 'Mengedit nilai dimensi pada sketch terkait']],
    ['Sebuah profil cincin terdiri atas dua lingkaran sepusat. Area cincin di-Extrude 20 mm dengan New Body. Bentuk hasilnya adalah ...',
      ['Silinder pejal tanpa lubang', 'Silinder berongga sepanjang 20 mm', 'Balok dengan lubang pusat', 'Dua lingkaran datar tanpa volume']],
    ['Crankshaft berputar terhadap Cylinder Block, sedangkan Piston Head bergerak lurus sepanjang sumbu silinder. Urutan Joint yang sesuai adalah ...',
      ['Rigid pada Crankshaft–Block dan Revolute pada Piston–Block', 'Revolute pada Crankshaft–Block dan Slider pada Piston–Block', 'Slider pada Crankshaft–Block dan Rigid pada Piston–Block', 'Revolute pada Crankshaft–Block dan Rigid pada Piston–Block']]
  ];
  soal.forEach(function(s, i) {
    var opsi = s[1].map(function(teks, j) { return String.fromCharCode(65 + j) + '. ' + teks; });
    pilihan('B' + (i + 1) + '. ' + s[0], opsi.concat(['E. Belum tahu']));
  });

  // BAGIAN 3: 5 PILIHAN + 1 ESAI = 6 ISIAN
  halaman('C. Kesulitan dan kebutuhan belajar', 'Pilih tingkat kesulitan untuk kegiatan yang pernah dicoba. Jika belum, pilih Belum mempelajari/mencoba.');
  var kesulitan = [
    'Membaca ukuran pada gambar kerja/jobsheet',
    'Membuat sketch 2D sesuai gambar kerja',
    'Memilih perintah pembentukan part 3D sesuai bentuk benda',
    'Menemukan penyebab kesalahan ketika hasil model tidak sesuai',
    'Membayangkan bentuk 3D dari gambar tampak depan, atas, samping, atau potongan'
  ];
  kesulitan.forEach(function(teks, i) {
    pilihan('C' + (i + 1) + '. ' + teks, [
      '1 — Tidak sulit', '2 — Sedikit sulit', '3 — Cukup sulit',
      '4 — Sulit', '5 — Sangat sulit', 'Belum mempelajari/mencoba'
    ]);
  });
  form.addParagraphTextItem()
    .setTitle('C6. Bantuan atau sumber belajar seperti apa yang kamu perlukan agar lebih mudah belajar Fusion?')
    .setHelpText('Jelaskan kesulitan yang ingin dibantu dan contoh bantuan yang dibutuhkan. Boleh bahan cetak, video, model, latihan bertahap, pendampingan, atau lainnya; tidak harus website. Jika belum pernah belajar Fusion, tuliskan hal yang ingin dipelajari. Jika belum memerlukan bantuan, jelaskan alasannya.')
    .setRequired(true);

  // BAGIAN 4: 6 ISIAN
  halaman('D. Kebiasaan belajar mandiri awal', 'Jawab berdasarkan praktik CAD sebelum asesmen ini. Jika belum pernah praktik, pilih pilihan terakhir. Meminta bantuan yang tepat tetap bagian dari belajar.');
  var mandiri = [
    'Saya membaca gambar kerja dan menentukan urutan langkah sebelum menggambar',
    'Saya memeriksa ukuran dan hasil model tanpa harus diingatkan guru',
    'Saya membaca ulang panduan/catatan ketika lupa langkah pengerjaan',
    'Ketika model tidak sesuai, saya mencoba mencari penyebabnya terlebih dahulu',
    'Saya mencoba memperbaiki kesalahan berdasarkan hasil pemeriksaan',
    'Saat meminta bantuan, saya menjelaskan kendala dan langkah yang sudah dicoba'
  ];
  mandiri.forEach(function(teks, i) {
    pilihan('D' + (i + 1) + '. ' + teks, [
      '1 — Tidak pernah', '2 — Jarang', '3 — Kadang-kadang',
      '4 — Sering', '5 — Selalu', 'Belum pernah praktik CAD'
    ]);
  });

  Logger.log('TAUTAN EDIT GURU: ' + form.getEditUrl());
  Logger.log('TAUTAN SISWA: ' + form.getPublishedUrl());
}
