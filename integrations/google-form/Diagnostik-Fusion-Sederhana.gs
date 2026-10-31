function buatFormDiagnostikSederhana() {
  var form = FormApp.create('Asesmen Diagnostik Awal Autodesk Fusion', false);
  form.setIsQuiz(false);
  form.setCollectEmail(false);
  form.setPublishingSummary(false);
  form.setProgressBar(true);
  form.setDescription(
    'Jawablah sesuai kemampuan dan pengalamanmu sebelum pembelajaran. ' +
    'Kerjakan secara mandiri. Pilih Belum tahu jika belum memahami soal. ' +
    'Nama, kelas, dan presensi digunakan untuk rekap pembelajaran dan PTK oleh guru/peneliti. ' +
    'Perkiraan waktu pengerjaan 30–35 menit.'
  );

  function pilihan(judul, opsi) {
    form.addMultipleChoiceItem().setTitle(judul).setChoiceValues(opsi).setRequired(true);
  }
  function esai(judul, petunjuk) {
    form.addParagraphTextItem().setTitle(judul).setHelpText(petunjuk).setRequired(true);
  }
  function halaman(judul, petunjuk) {
    form.addPageBreakItem().setTitle(judul).setHelpText(petunjuk);
  }

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
    ['Apa prinsip pembentukan model menggunakan Revolve?',
      ['Membawa profil sepanjang lintasan', 'Menghubungkan beberapa profil pada posisi berbeda', 'Memutar profil mengelilingi sumbu', 'Menarik profil sepanjang arah lurus']],
    ['Body balok sudah terbentuk. Untuk membuang material melalui Extrude dari profil lingkaran, operasi yang dipilih adalah ...',
      ['Cut', 'Join', 'New Body', 'New Component']],
    ['Perintah untuk membulatkan tepi solid adalah ...',
      ['Shell', 'Chamfer', 'Extrude', 'Fillet']],
    ['Panjang sketch awal pada desain parametrik perlu diubah. Tindakan yang sesuai adalah ...',
      ['Menggeser tampilan menggunakan Pan', 'Memperbesar tampilan menggunakan Zoom', 'Mengedit warna body', 'Mengedit nilai dimensi pada sketch terkait']],
    ['Sebuah profil cincin terdiri atas dua lingkaran sepusat. Area cincin di-Extrude 20 mm dengan New Body. Bentuk hasilnya adalah ...',
      ['Silinder pejal tanpa lubang', 'Silinder berongga sepanjang 20 mm', 'Balok dengan lubang pusat', 'Dua lingkaran datar tanpa volume']],
    ['Profil persegi panjang setinggi 40 mm membentang 20 mm dari sumbu vertikal; sisi kirinya berimpit dengan sumbu. Profil di-Revolve 360° menggunakan New Body. Hasilnya adalah ...',
      ['Silinder berongga', 'Kerucut pejal', 'Silinder pejal berjari-jari 20 mm dan tinggi 40 mm', 'Silinder pejal berjari-jari 40 mm dan tinggi 20 mm']],
    ['Setengah profil kiri akan dicerminkan menjadi pasangan kanan–kiri yang simetris pada ketinggian sama. Mirror Line yang sesuai adalah ...',
      ['Garis tegak pada sumbu tengah pasangan', 'Garis tegak di sebelah kiri seluruh objek', 'Garis mendatar di tengah objek', 'Garis mendatar di bawah objek']],
    ['Crankshaft berputar terhadap Cylinder Block, sedangkan Piston Head bergerak lurus sepanjang sumbu silinder. Urutan Joint yang sesuai adalah ...',
      ['Rigid pada Crankshaft–Block dan Revolute pada Piston–Block', 'Revolute pada Crankshaft–Block dan Slider pada Piston–Block', 'Slider pada Crankshaft–Block dan Rigid pada Piston–Block', 'Revolute pada Crankshaft–Block dan Rigid pada Piston–Block']]
  ];
  soal.forEach(function(s, i) {
    var opsi = s[1].map(function(teks, j) { return String.fromCharCode(65 + j) + '. ' + teks; });
    pilihan('B' + (i + 1) + '. ' + s[0], opsi.concat(['E. Belum tahu']));
  });

  halaman('C. Penalaran singkat', 'Jawab dengan kalimatmu sendiri. Jika belum tahu, tuliskan Belum tahu.');
  esai('C1. Persegi panjang 80 × 40 mm di-Extrude setebal 10 mm. Pada muka atas dibuat lingkaran Ø12 mm, lalu Extrude Cut menembus seluruh ketebalan.',
    'Jelaskan bentuk akhir benda, ukuran keseluruhannya, dan bentuk lubang yang dihasilkan.');
  esai('C2. Kontur sketch tampak hampir tertutup, tetapi area yang diharapkan tidak terbentuk sebagai profil tertutup untuk Extrude solid.',
    'Sebutkan dua kemungkinan penyebab dan langkah pemeriksaan/perbaikannya.');

  halaman('D. Kesulitan belajar', 'Pilih tingkat kesulitan untuk kegiatan yang pernah dicoba. Jika belum, pilih Belum mempelajari/mencoba.');
  var kesulitan = [
    'Membaca ukuran pada gambar kerja/jobsheet',
    'Membuat sketch 2D sesuai gambar kerja',
    'Memberikan ukuran dengan Sketch Dimension',
    'Menggunakan constraint untuk mengendalikan bentuk/posisi sketch',
    'Memilih perintah pembentukan part 3D sesuai bentuk benda',
    'Menemukan penyebab kesalahan ketika hasil model tidak sesuai',
    'Memahami hubungan gerak komponen pada assembly',
    'Mengulangi praktik secara mandiri setelah demonstrasi guru',
    'Membayangkan bentuk 3D dari gambar tampak depan, atas, samping, atau potongan'
  ];
  kesulitan.forEach(function(teks, i) {
    pilihan('D' + (i + 1) + '. ' + teks, [
      '1 — Tidak sulit', '2 — Sedikit sulit', '3 — Cukup sulit',
      '4 — Sulit', '5 — Sangat sulit', 'Belum mempelajari/mencoba'
    ]);
  });

  halaman('E. Kebiasaan belajar mandiri awal', 'Jawab berdasarkan praktik CAD sebelum asesmen ini. Jika belum pernah praktik, pilih pilihan terakhir. Meminta bantuan yang tepat tetap bagian dari belajar.');
  var mandiri = [
    'Saya membaca gambar kerja dan menentukan urutan langkah sebelum menggambar',
    'Saya memeriksa ukuran dan hasil model tanpa harus diingatkan guru',
    'Saya membaca ulang panduan/catatan ketika lupa langkah pengerjaan',
    'Ketika model tidak sesuai, saya mencoba mencari penyebabnya terlebih dahulu',
    'Saya mencoba memperbaiki kesalahan berdasarkan hasil pemeriksaan',
    'Saat meminta bantuan, saya menjelaskan kendala dan langkah yang sudah dicoba'
  ];
  mandiri.forEach(function(teks, i) {
    pilihan('E' + (i + 1) + '. ' + teks, [
      '1 — Tidak pernah', '2 — Jarang', '3 — Kadang-kadang',
      '4 — Sering', '5 — Selalu', 'Belum pernah praktik CAD'
    ]);
  });

  halaman('F. Kebutuhan bantuan dan refleksi', 'Jawablah sesuai kebutuhan sebenarnya. Tidak ada jawaban benar atau salah.');
  pilihan('F1. Bantuan yang paling kamu butuhkan saat ini', [
    'Penjelasan kembali konsep dasar',
    'Contoh langkah kerja yang dapat dipelajari ulang',
    'Gambar/model untuk membayangkan bentuk benda',
    'Latihan bertahap disertai umpan balik',
    'Pendampingan langsung saat mengalami kesulitan',
    'Kesempatan menggunakan komputer untuk latihan',
    'Belum memerlukan bantuan tambahan',
    'Belum dapat menentukan'
  ]);
  pilihan('F2. Dukungan belajar yang paling memungkinkan digunakan di luar kelas', [
    'Modul/jobsheet cetak', 'Video/file tanpa internet',
    'Materi daring melalui HP', 'Materi daring melalui komputer/laptop',
    'Belajar bersama guru/teman pada waktu yang disepakati', 'Belum dapat menentukan'
  ]);
  esai('F3. Ceritakan satu kesulitan saat mempelajari Fusion dan apa yang kamu lakukan.',
    'Jika belum pernah belajar Fusion, jelaskan hal yang ingin dipelajari. Jika tidak ada kesulitan, jelaskan bagian yang dikuasai.');
  esai('F4. Bantuan atau sumber belajar seperti apa yang kamu perlukan?',
    'Berikan contoh penggunaannya. Boleh bahan cetak, video, model, pendampingan, atau lainnya; tidak harus website. Jika belum memerlukan bantuan, jelaskan.');

  Logger.log('TAUTAN EDIT GURU: ' + form.getEditUrl());
  Logger.log('TAUTAN SISWA: ' + form.getPublishedUrl());
}
