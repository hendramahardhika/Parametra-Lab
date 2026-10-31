function buatAngketAkhirParametraLab() {
  var form = FormApp.create('Angket Akhir Pembelajaran PjBL Berbantuan Parametra Lab', false);
  form.setIsQuiz(false);
  form.setCollectEmail(false);
  form.setPublishingSummary(false);
  form.setProgressBar(true);
  form.setDescription(
    'Angket ini bertujuan mengetahui pengalaman dan perkembangan belajarmu setelah mengikuti dua siklus pembelajaran Autodesk Fusion melalui proyek berbantuan Parametra Lab.\n\n' +
    'Jawablah sesuai keadaan sebenarnya. Jawabanmu tidak memengaruhi nilai praktik. Tidak ada jawaban benar atau salah. Jawaban yang menunjukkan kesulitan tetap berguna untuk memperbaiki pembelajaran.\n\n' +
    'Nama, kelas, dan nomor presensi digunakan untuk mencocokkan data dengan asesmen awal. Data digunakan oleh guru/peneliti untuk keperluan pembelajaran dan PTK.\n\n' +
    'Angket terdiri atas 3 bagian dan 21 isian.'
  );

  function pilihan(judul, opsi) {
    form.addMultipleChoiceItem().setTitle(judul).setChoiceValues(opsi).setRequired(true);
  }

  // BAGIAN A: IDENTITAS — 3 ISIAN
  form.addSectionHeaderItem().setTitle('A. Identitas siswa');
  form.addTextItem().setTitle('Nama lengkap').setRequired(true);
  pilihan('Kelas', ['XI TP 1', 'XI TP 2']);
  form.addTextItem().setTitle('Nomor presensi').setHelpText('Ketik nomor presensi sesuai asesmen awal, bukan NIS.').setRequired(true);

  // BAGIAN B: PENALARAN SPASIAL — 8 SKALA DAN 1 ESAI
  form.addPageBreakItem()
    .setTitle('B. Penalaran spasial dalam pemodelan 3D')
    .setHelpText('Nilailah kemampuanmu saat ini, setelah menyelesaikan dua siklus pembelajaran. Pilih sesuai kemampuan yang kamu rasakan ketika mengerjakan proyek pemodelan. Jika belum mendapat kesempatan atau tidak dapat menilai, pilih pilihan terakhir.');

  var kemampuan = [
    '1 — Belum mampu',
    '2 — Kurang mampu',
    '3 — Cukup mampu',
    '4 — Mampu',
    '5 — Sangat mampu',
    'Belum mendapat kesempatan / tidak dapat menilai'
  ];
  var spasial = [
    'Saya dapat membayangkan bentuk benda 3D berdasarkan gambar kerja 2D.',
    'Saya dapat mengenali bagian benda yang sama pada gambar tampak depan, atas, dan samping.',
    'Saya dapat memahami bentuk rongga atau lubang di dalam benda melalui gambar potongan.',
    'Saya dapat menentukan bidang sketch yang sesuai untuk memulai pemodelan suatu benda.',
    'Saya dapat memperkirakan bentuk hasil Extrude berdasarkan profil dan arah penarikannya.',
    'Saya dapat memperkirakan bentuk hasil Revolve berdasarkan profil dan sumbu putarnya.',
    'Saya dapat menentukan garis atau bidang cermin agar bagian benda menjadi simetris sesuai gambar kerja.',
    'Saya dapat memperkirakan perubahan bentuk model ketika salah satu ukuran sketch diubah.'
  ];
  spasial.forEach(function(teks, i) {
    pilihan('B' + (i + 1) + '. ' + teks, kemampuan);
  });
  form.addParagraphTextItem()
    .setTitle('B9. Pilih satu jobsheet atau benda yang kamu kerjakan selama pembelajaran. Ceritakan bagian bentuk yang sulit kamu pahami dan bagaimana kamu mencoba memahaminya.')
    .setHelpText('Jelaskan langkah yang kamu lakukan. Sebutkan bantuan yang digunakan, misalnya gambar kerja, model 3D atau petunjuk di Parametra Lab, penjelasan guru, maupun diskusi dengan teman. Jelaskan bagian yang akhirnya dipahami dan bagian yang masih sulit. Jika Parametra Lab belum membantu, jelaskan kendalanya.')
    .setRequired(true);

  // BAGIAN C: KEMANDIRIAN — 8 SKALA DAN 1 ESAI
  form.addPageBreakItem()
    .setTitle('C. Kemandirian dalam mengatasi kesalahan pemodelan CAD')
    .setHelpText('Jawablah berdasarkan kebiasaanmu selama Siklus II atau siklus terakhir. Pilih seberapa sering kamu melakukan setiap kegiatan. Meminta bantuan yang tepat tetap merupakan bagian dari belajar mandiri. Yang ditanyakan adalah usahamu memeriksa, mencari penyelesaian, dan menjelaskan kendala. Jika belum mendapat kesempatan atau tidak dapat menilai, pilih pilihan terakhir.');

  var frekuensi = [
    '1 — Tidak pernah',
    '2 — Jarang',
    '3 — Kadang-kadang',
    '4 — Sering',
    '5 — Selalu',
    'Belum mendapat kesempatan / tidak dapat menilai'
  ];
  // C1–C6 mempertahankan isi enam butir kemandirian pada diagnostik awal.
  var mandiri = [
    'Saya membaca gambar kerja dan menentukan urutan langkah sebelum menggambar',
    'Saya memeriksa ukuran dan hasil model tanpa harus diingatkan guru',
    'Saya membaca ulang panduan/catatan ketika lupa langkah pengerjaan',
    'Ketika model tidak sesuai, saya mencoba mencari penyebabnya terlebih dahulu',
    'Saya mencoba memperbaiki kesalahan berdasarkan hasil pemeriksaan',
    'Saat meminta bantuan, saya menjelaskan kendala dan langkah yang sudah dicoba',
    'Saya mencari petunjuk penyelesaian masalah di Parametra Lab sebelum menentukan langkah perbaikan.',
    'Saya memeriksa kembali model setelah melakukan perbaikan.'
  ];
  mandiri.forEach(function(teks, i) {
    pilihan('C' + (i + 1) + '. ' + teks, frekuensi);
  });
  form.addParagraphTextItem()
    .setTitle('C9. Ceritakan satu kesalahan pemodelan CAD yang kamu alami selama proyek pada Siklus II. Bagaimana kamu mencari penyebab dan mencoba memperbaikinya?')
    .setHelpText('Jelaskan kesalahannya, langkah pemeriksaan, sumber bantuan yang digunakan, dan hasil perbaikannya. Jika menggunakan Parametra Lab, sebutkan bagian yang digunakan. Jika masalah belum terselesaikan atau bantuan web belum sesuai, jelaskan. Jika tidak mengalami kesalahan, ceritakan cara kamu memeriksa model untuk memastikan hasilnya sesuai.')
    .setRequired(true);

  form.setConfirmationMessage('Terima kasih. Jawabanmu membantu guru mengevaluasi dan memperbaiki pembelajaran berbantuan Parametra Lab.');
  Logger.log('TAUTAN EDIT GURU: ' + form.getEditUrl());
  Logger.log('TAUTAN SISWA: ' + form.getPublishedUrl());
}
