/**
 * Tempel seluruh isi file ke Code.gs pada proyek Google Apps Script BARU.
 * Jalankan buatAngketParametraLab, lalu buka tautan edit pada Log eksekusi.
 * Form disiapkan sebagai draf; tinjau lalu Publikasikan dari editor Forms.
 * Menjalankan ulang fungsi melengkapi refleksi pada form yang sama,
 * tanpa menggandakan pertanyaan atau menghapus jawaban sebelumnya.
 */
function buatAngketParametraLab() {
  const properti = PropertiesService.getScriptProperties();
  const idLama = properti.getProperty('PARAMETRA_ANGKET_FORM_ID');
  if (idLama) {
    const formLama = FormApp.openById(idLama);
    tambahkanRefleksiParametra_(formLama);
    Logger.log('Halaman refleksi sudah diperiksa/dilengkapi. Tautan edit: ' + formLama.getEditUrl());
    Logger.log('Tautan siswa (setelah dipublikasikan): ' + formLama.getPublishedUrl());
    return;
  }

  const form = FormApp.create('Angket Penggunaan Website Parametra Lab', false);
  form.setDescription([
    'Angket ini bertujuan mengetahui pengalaman siswa menggunakan Parametra Lab sebagai pendamping pembelajaran Autodesk Fusion.',
    'Isilah setelah mencoba materi dan fitur yang ditanyakan. Jawablah sesuai pengalaman sebenarnya; tidak ada jawaban benar atau salah.',
    'Identitas digunakan untuk rekap berdasarkan kelas dan presensi. Angket ini bukan anonim.',
    '',
    'Skala jawaban:',
    '1 = Sangat Tidak Setuju',
    '2 = Tidak Setuju',
    '3 = Netral',
    '4 = Setuju',
    '5 = Sangat Setuju'
  ].join('\n'));
  form.setIsQuiz(false);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setPublishingSummary(false);
  form.setShowLinkToRespondAgain(false);
  form.setShuffleQuestions(false);
  form.setConfirmationMessage('Terima kasih. Tanggapanmu telah tersimpan dan akan menjadi masukan untuk pengembangan Parametra Lab.');

  form.addSectionHeaderItem().setTitle('A. Identitas siswa');
  form.addTextItem()
    .setTitle('Nama lengkap')
    .setHelpText('Ketik nama lengkap sesuai daftar kelas.')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^\\s*\\S(?:.*\\S)?\\s*$')
      .setHelpText('Nama tidak boleh kosong atau hanya berisi spasi.')
      .build());
  form.addMultipleChoiceItem()
    .setTitle('Kelas')
    .setChoiceValues(['XI TP 1', 'XI TP 2'])
    .setRequired(true);
  form.addTextItem()
    .setTitle('Nomor presensi')
    .setHelpText('Ketik nomor presensi, misalnya 1 atau 01. Rentang yang diterima: 1–99.')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^(0?[1-9]|[1-9][0-9])$')
      .setHelpText('Isi nomor presensi berupa bilangan bulat 1–99, bukan NIS.')
      .build());

  form.addSectionHeaderItem()
    .setTitle('B. Pengalaman menggunakan Parametra Lab')
    .setHelpText('Pilih satu angka untuk setiap pernyataan. Angka 3 berarti Netral, bukan belum mencoba fitur.');

  const pernyataan = [
    'Saya mudah menemukan materi yang saya butuhkan melalui menu Parametra Lab.',
    'Petunjuk langkah praktik di Parametra Lab mudah saya ikuti.',
    'Parametra Lab memudahkan saya mempelajari ulang materi sesuai kebutuhan saya.',
    'Materi Pengenalan Fusion di Parametra Lab membantu saya memahami fungsi dasar Autodesk Fusion.',
    'Jobsheet di Parametra Lab membantu saya memahami ukuran yang perlu dibuat pada sketch 2D.',
    'Preview model 3D di Parametra Lab membantu saya membayangkan bentuk benda dari gambar kerja.',
    'Contoh animasi Create dan Modify di Lab 3D membantu saya memahami proses pembentukan model.',
    'Video assembly di Parametra Lab membantu saya memahami hubungan antarbagian dalam suatu rakitan.',
    'Umpan balik kuis di Parametra Lab membantu saya mengenali materi yang belum saya pahami.',
    'Secara keseluruhan, Parametra Lab memudahkan saya memahami pembelajaran Autodesk Fusion.'
  ];
  pernyataan.forEach(function(teks, indeks) {
    form.addScaleItem()
      .setTitle((indeks + 1) + '. ' + teks)
      .setHelpText('1 Sangat Tidak Setuju · 2 Tidak Setuju · 3 Netral · 4 Setuju · 5 Sangat Setuju')
      .setBounds(1, 5)
      .setLabels('Sangat Tidak Setuju', 'Sangat Setuju')
      .setRequired(true);
  });

  tambahkanRefleksiParametra_(form);

  // Simpan hanya setelah seluruh pertanyaan selesai dibuat.
  properti.setProperty('PARAMETRA_ANGKET_FORM_ID', form.getId());
  Logger.log('Draf angket selesai: 3 identitas + 10 pernyataan skala 1–5 + 2 esai reflektif pada halaman berikutnya.');
  Logger.log('Tautan edit guru: ' + form.getEditUrl());
  Logger.log('Tautan siswa (setelah dipublikasikan): ' + form.getPublishedUrl());
}

function tambahkanRefleksiParametra_(form) {
  const judulHalaman = 'C. Refleksi pengalaman belajar';
  const sudahAdaHalaman = form.getItems(FormApp.ItemType.PAGE_BREAK).some(function(item) {
    return item.getTitle() === judulHalaman;
  });
  if (!sudahAdaHalaman) {
    form.addPageBreakItem()
      .setTitle(judulHalaman)
      .setHelpText('Jawablah dengan kalimatmu sendiri berdasarkan pengalaman menggunakan Parametra Lab. Tidak ada jawaban benar atau salah.');
  }
  const refleksi = [
    {
      judul: '11. Ceritakan bagaimana penggunaan Parametra Lab memengaruhi pemahamanmu terhadap materi Autodesk Fusion.',
      petunjuk: 'Sebutkan satu materi atau fitur dan contoh pengalamanmu. Jika belum membantu, jelaskan alasannya.'
    },
    {
      judul: '12. Apa kesulitan yang kamu alami saat menggunakan Parametra Lab, dan perbaikan apa yang kamu sarankan?',
      petunjuk: 'Jelaskan kendala yang paling terasa. Jika tidak ada kendala, sebutkan fitur yang ingin ditambahkan atau dikembangkan.'
    }
  ];
  refleksi.forEach(function(soal) {
    const sudahAdaSoal = form.getItems(FormApp.ItemType.PARAGRAPH_TEXT).some(function(item) {
      return item.getTitle() === soal.judul;
    });
    if (!sudahAdaSoal) {
      form.addParagraphTextItem()
        .setTitle(soal.judul)
        .setHelpText(soal.petunjuk)
        .setRequired(true);
    }
  });
  form.setProgressBar(true);
}
