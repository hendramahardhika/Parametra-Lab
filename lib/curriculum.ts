import type { Stage } from './jobsheets';
export type ModelKind = 'assembly' | 'base' | 'arm' | 'pin';
export type Lesson = {
  id: number; order: number; stage: Stage; title: string; subtitle: string; meeting: string;
  goal: string; deliverable: string; concept: string; dimensions: string;
  steps: { title: string; instruction: string; check: string; hints: string[] }[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
};
// IDs 0–7 are retained in historical storage, not reused for the new curriculum.
export const lessons: Lesson[] = [
  {
    "id": 8,
    "order": 1,
    "stage": "intro",
    "title": "Pengenalan Fusion",
    "subtitle": "Antarmuka, navigasi, satuan & membaca jobsheet",
    "meeting": "Tahap 1 · Persiapan",
    "goal": "Menyiapkan ruang kerja Fusion dan memahami urutan praktik.",
    "deliverable": "Desain latihan tersimpan, satuan diperiksa, dan rencana kerja singkat.",
    "concept": "Parametric modeling menggunakan dimensi, constraint, dan hubungan fitur. Website mendampingi praktik; pembuatan sketch, part, dan assembly tetap dilakukan di Autodesk Fusion pada komputer.",
    "dimensions": "Dimensi, satuan, toleransi, dan nama berkas mengikuti PDF asli. Ukuran yang belum tercantum perlu dikonfirmasi kepada guru; jangan menebak dari gambar di layar.",
    "steps": [
      {
        "title": "Kenali ruang kerja",
        "instruction": "Buka workspace Design. Temukan Browser, toolbar, canvas, ViewCube, dan timeline. Latih memilih objek, zoom, pan, orbit, serta mengubah tampak.",
        "check": "Saya dapat mengenali area kerja dan mengatur tampilan.",
        "hints": [
          "Browser menampilkan struktur desain.",
          "ViewCube membantu memilih tampak standar.",
          "Latih navigasi tanpa mengubah geometri."
        ]
      },
      {
        "title": "Atur satuan & simpan",
        "instruction": "Buat desain latihan. Periksa Document Settings dan satuan sesuai jobsheet. Simpan dengan nama yang jelas dan pastikan lokasi penyimpanannya diketahui.",
        "check": "Desain latihan tersimpan dengan satuan yang sesuai.",
        "hints": [
          "Satuan memengaruhi ukuran.",
          "Gunakan nama sesuai arahan guru.",
          "Periksa status simpan sebelum menutup desain."
        ]
      },
      {
        "title": "Baca jobsheet",
        "instruction": "Buka pustaka jobsheet. Identifikasi judul, tampak, penampang, satuan, ukuran, serta hasil yang diminta. Catat ukuran yang belum jelas untuk ditanyakan.",
        "check": "Saya dapat menjelaskan target dan ukuran acuan tugas.",
        "hints": [
          "Mulai dari nama dan fungsi benda.",
          "Bedakan diameter, radius, panjang, dan kedalaman.",
          "Rencanakan: baca gambar → buat → ukur → simpan."
        ]
      },
      {
        "title": "Rencanakan urutan praktik",
        "instruction": "Ikuti pengenalan Fusion, sketch 2D, membuat part 3D, kemudian assembly. Kerjakan jobsheet bernomor secara berurutan pada setiap tahap. Siapkan catatan kendala dan refleksi.",
        "check": "Saya siap memulai jobsheet sketch 2D nomor 1.",
        "hints": [
          "Sketch mendefinisikan profil.",
          "Part memberi volume pada rancangan.",
          "Periksa ukuran part sebelum merakit."
        ]
      }
    ],
    "quiz": [
      {
        "q": "Urutan belajar yang digunakan adalah …",
        "options": [
          "Assembly → part → sketch",
          "Pengenalan Fusion → sketch 2D → part 3D → assembly",
          "Part → pengenalan → assembly"
        ],
        "answer": 1,
        "why": "Pembelajaran dimulai dari dasar menuju rakitan."
      },
      {
        "q": "Jika suatu ukuran tidak tercantum, tindakan yang tepat adalah …",
        "options": [
          "Menebak dari gambar",
          "Mengubah satuan sembarang",
          "Mengonfirmasi kepada guru"
        ],
        "answer": 2,
        "why": "Ukuran tidak boleh diciptakan dari tampilan visual."
      },
      {
        "q": "Timeline digunakan untuk …",
        "options": [
          "Meninjau urutan fitur desain",
          "Mengunggah PDF",
          "Mengubah nama kelas"
        ],
        "answer": 0,
        "why": "Timeline membantu meninjau dan merevisi riwayat pemodelan."
      }
    ]
  },
  {
    "id": 9,
    "order": 2,
    "stage": "sketch",
    "title": "Sketch 2D",
    "subtitle": "Jobsheet 1–2 · Plat Sambungan & V Block",
    "meeting": "Tahap 2 · Sketch",
    "goal": "Membuat profil 2D sesuai acuan dengan dimensi dan constraint yang tepat.",
    "deliverable": "Dua desain sketch sesuai jobsheet, bukti pemeriksaan, dan refleksi.",
    "concept": "Dimension menetapkan ukuran, sedangkan constraint mengatur hubungan dan posisi geometri. Profil tertutup dan fully constrained adalah dua pemeriksaan berbeda; periksa keduanya sesuai jobsheet.",
    "dimensions": "Dimensi, satuan, toleransi, dan nama berkas mengikuti PDF asli. Ukuran yang belum tercantum perlu dikonfirmasi kepada guru; jangan menebak dari gambar di layar.",
    "steps": [
      {
        "title": "Jobsheet 1 · Plat Sambungan",
        "instruction": "Buka PDF Plat Sambungan. Atur satuan mm dan bidang sketch. Bentuk kontur, lubang, slot, chamfer, serta lengkung sesuai acuan. Lengkapi dimensi dan constraint, periksa profil tertutup dan fully constrained, lalu simpan sesuai jobsheet.",
        "check": "Sketch Plat Sambungan sudah diperiksa dan disimpan.",
        "hints": [
          "Tandai ukuran pada gambar sebelum mulai.",
          "Gunakan origin dan garis konstruksi; periksa celah dan hubungan geometri.",
          "Uji apakah sketch masih bergeser. Lengkapi constraint tanpa menggandakan aturan."
        ]
      },
      {
        "title": "Jobsheet 2 · V Block",
        "instruction": "Buka PDF V Block. Buat sumbu tegak melalui origin, gambar setengah kontur, alur V dan takik sesuai acuan. Gunakan Mirror, lengkapi dimensi serta constraint, periksa profil tertutup, lalu simpan sesuai jobsheet.",
        "check": "Sketch V Block sudah diperiksa dan disimpan.",
        "hints": [
          "Tandai ukuran pada gambar sebelum mulai.",
          "Gunakan origin dan garis konstruksi; periksa celah dan hubungan geometri.",
          "Uji apakah sketch masih bergeser. Lengkapi constraint tanpa menggandakan aturan."
        ]
      }
    ],
    "quiz": [
      {
        "q": "Fully constrained berarti …",
        "options": [
          "Sketsa sudah diberi warna",
          "Ukuran dan posisi sketsa sudah terdefinisi",
          "Sketsa pasti sudah menjadi solid"
        ],
        "answer": 1,
        "why": "Constraint dan dimensi mengendalikan kebebasan gerak sketsa."
      },
      {
        "q": "Mirror memerlukan …",
        "options": [
          "Garis cermin yang tepat",
          "File STL",
          "Joint assembly"
        ],
        "answer": 0,
        "why": "Mirror mencerminkan geometri terhadap garis acuan."
      },
      {
        "q": "Profil tertutup diperiksa dengan …",
        "options": [
          "Mengganti warna",
          "Membesarkan ukuran file",
          "Memastikan tidak ada celah dan area profil dapat dikenali"
        ],
        "answer": 2,
        "why": "Celah dapat menghalangi pembentukan profil."
      }
    ]
  },
  {
    "id": 10,
    "order": 3,
    "stage": "part",
    "title": "Membuat part 3D",
    "subtitle": "Jobsheet 3–6 · Dari Dudukan Poros hingga Bottle",
    "meeting": "Tahap 3 · Part",
    "goal": "Membentuk part 3D dari acuan, memilih fitur sesuai bentuk, dan memeriksa ukuran.",
    "deliverable": "Hasil jobsheet 3–6 dalam file sumber Fusion sesuai arahan guru; mesh opsional untuk pratinjau.",
    "concept": "Extrude memberi kedalaman pada profil; Revolve memutar profil terhadap sumbu. Pilih fitur berdasarkan bentuk dan penampang. Periksa lubang dan detail tepi setelah bentuk utama selesai.",
    "dimensions": "Dimensi, satuan, toleransi, dan nama berkas mengikuti PDF asli. Ukuran yang belum tercantum perlu dikonfirmasi kepada guru; jangan menebak dari gambar di layar.",
    "steps": [
      {
        "title": "Jobsheet 3 · Dudukan Poros",
        "instruction": "Buka PDF Dudukan Poros. Baca tampak dan penampang. Susun urutan fitur dari bentuk utama hingga detail, lalu buat part sesuai gambar. Periksa ukuran dengan Measure dan periksa timeline. Simpan sumber Fusion; ekspor STL/OBJ hanya untuk pratinjau mesh.",
        "check": "Part Dudukan Poros sesuai arahan guru, diperiksa, dan disimpan.",
        "hints": [
          "Tentukan profil utama dan arah pembentukan; jangan menebak ukuran.",
          "Pilih Extrude atau Revolve bila sesuai rancangan. Periksa operasi Join, Cut, atau New Body.",
          "Periksa ukuran utama, lubang, dan detail tepi. Perbaiki fitur paling awal yang bermasalah."
        ]
      },
      {
        "title": "Jobsheet 4 · Pulley",
        "instruction": "Buka PDF Pulley. Baca tampak dan penampang. Susun urutan fitur dari bentuk utama hingga detail, lalu buat part sesuai gambar. Periksa ukuran dengan Measure dan periksa timeline. Simpan sumber Fusion; ekspor STL/OBJ hanya untuk pratinjau mesh.",
        "check": "Part Pulley sesuai arahan guru, diperiksa, dan disimpan.",
        "hints": [
          "Tentukan profil utama dan arah pembentukan; jangan menebak ukuran.",
          "Pilih Extrude atau Revolve bila sesuai rancangan. Periksa operasi Join, Cut, atau New Body.",
          "Periksa ukuran utama, lubang, dan detail tepi. Perbaiki fitur paling awal yang bermasalah."
        ]
      },
      {
        "title": "Jobsheet 5 · Flange Pipa",
        "instruction": "Buka PDF Flange Pipa. Baca tampak dan penampang. Susun urutan fitur dari bentuk utama hingga detail, lalu buat part sesuai gambar. Periksa ukuran dengan Measure dan periksa timeline. Simpan sumber Fusion; ekspor STL/OBJ hanya untuk pratinjau mesh.",
        "check": "Part Flange Pipa sesuai arahan guru, diperiksa, dan disimpan.",
        "hints": [
          "Tentukan profil utama dan arah pembentukan; jangan menebak ukuran.",
          "Pilih Extrude atau Revolve bila sesuai rancangan. Periksa operasi Join, Cut, atau New Body.",
          "Periksa ukuran utama, lubang, dan detail tepi. Perbaiki fitur paling awal yang bermasalah."
        ]
      },
      {
        "title": "Jobsheet 6 · Bottle",
        "instruction": "Buka PDF Bottle. Baca tampak dan penampang. Susun urutan fitur dari bentuk utama hingga detail, lalu buat part sesuai gambar. Periksa ukuran dengan Measure dan periksa timeline. Simpan sumber Fusion; ekspor STL/OBJ hanya untuk pratinjau mesh.",
        "check": "Part Bottle sesuai arahan guru, diperiksa, dan disimpan.",
        "hints": [
          "Tentukan profil utama dan arah pembentukan; jangan menebak ukuran.",
          "Pilih Extrude atau Revolve bila sesuai rancangan. Periksa operasi Join, Cut, atau New Body.",
          "Periksa ukuran utama, lubang, dan detail tepi. Perbaiki fitur paling awal yang bermasalah."
        ]
      }
    ],
    "quiz": [
      {
        "q": "Extrude digunakan untuk …",
        "options": [
          "Memberi kedalaman pada profil",
          "Mengunci komponen assembly",
          "Membuka PDF"
        ],
        "answer": 0,
        "why": "Extrude membentuk atau memotong volume sepanjang arah tertentu."
      },
      {
        "q": "Revolve membutuhkan …",
        "options": [
          "Dua PDF",
          "Profil dan sumbu putar",
          "Warna material"
        ],
        "answer": 1,
        "why": "Profil diputar terhadap sumbu yang dipilih."
      },
      {
        "q": "STL menyimpan …",
        "options": [
          "Seluruh timeline Fusion",
          "Semua constraint sketch",
          "Geometri mesh, bukan riwayat parametrik lengkap"
        ],
        "answer": 2,
        "why": "Tetap simpan sumber Fusion selain ekspor mesh."
      }
    ]
  },
  {
    "id": 11,
    "order": 4,
    "stage": "assembly",
    "title": "Assembly piston",
    "subtitle": "Jobsheet 1–5 · Komponen, rakitan & pemeriksaan gerak",
    "meeting": "Tahap 4 · Assembly",
    "goal": "Merakit komponen piston sesuai gambar acuan dan menguji hubungan geraknya.",
    "deliverable": "Desain assembly, file komponen, bukti pemeriksaan, dan refleksi proses.",
    "concept": "Component memiliki identitas dan konteks gerak dalam assembly. Joint menentukan hubungan antarkomponen; Move saja tidak mendefinisikan mekanisme. Gunakan hubungan putar, geser, atau tetap sesuai fungsi dan arahan guru.",
    "dimensions": "Dimensi, satuan, toleransi, dan nama berkas mengikuti PDF asli. Ukuran yang belum tercantum perlu dikonfirmasi kepada guru; jangan menebak dari gambar di layar.",
    "steps": [
      {
        "title": "Jobsheet 1 · Cylinder Block",
        "instruction": "Buka PDF Cylinder Block. Buat atau periksa komponen dengan dimensi pada gambar. Beri nama sesuai daftar komponen, lalu simpan. Siapkan sebagai Component dalam assembly, bukan hanya body tanpa identitas.",
        "check": "Komponen Cylinder Block siap dirakit dan dimensinya diperiksa.",
        "hints": [
          "Baca semua tampak dan penampang; identifikasi bagian yang berpasangan.",
          "Periksa lubang, poros, ketebalan, dan satuan. Jangan mengubah dimensi untuk memaksa pasangan.",
          "Rapikan Browser, aktifkan komponen yang tepat, beri nama, dan simpan."
        ]
      },
      {
        "title": "Jobsheet 2 · Piston Head",
        "instruction": "Buka PDF Piston Head. Buat atau periksa komponen dengan dimensi pada gambar. Beri nama sesuai daftar komponen, lalu simpan. Siapkan sebagai Component dalam assembly, bukan hanya body tanpa identitas.",
        "check": "Komponen Piston Head siap dirakit dan dimensinya diperiksa.",
        "hints": [
          "Baca semua tampak dan penampang; identifikasi bagian yang berpasangan.",
          "Periksa lubang, poros, ketebalan, dan satuan. Jangan mengubah dimensi untuk memaksa pasangan.",
          "Rapikan Browser, aktifkan komponen yang tepat, beri nama, dan simpan."
        ]
      },
      {
        "title": "Jobsheet 3 · Pin Piston",
        "instruction": "Buka PDF Pin Piston. Buat atau periksa komponen dengan dimensi pada gambar. Beri nama sesuai daftar komponen, lalu simpan. Siapkan sebagai Component dalam assembly, bukan hanya body tanpa identitas.",
        "check": "Komponen Pin Piston siap dirakit dan dimensinya diperiksa.",
        "hints": [
          "Baca semua tampak dan penampang; identifikasi bagian yang berpasangan.",
          "Periksa lubang, poros, ketebalan, dan satuan. Jangan mengubah dimensi untuk memaksa pasangan.",
          "Rapikan Browser, aktifkan komponen yang tepat, beri nama, dan simpan."
        ]
      },
      {
        "title": "Jobsheet 4 · Connecting Rod",
        "instruction": "Buka PDF Connecting Rod. Buat atau periksa komponen dengan dimensi pada gambar. Beri nama sesuai daftar komponen, lalu simpan. Siapkan sebagai Component dalam assembly, bukan hanya body tanpa identitas.",
        "check": "Komponen Connecting Rod siap dirakit dan dimensinya diperiksa.",
        "hints": [
          "Baca semua tampak dan penampang; identifikasi bagian yang berpasangan.",
          "Periksa lubang, poros, ketebalan, dan satuan. Jangan mengubah dimensi untuk memaksa pasangan.",
          "Rapikan Browser, aktifkan komponen yang tepat, beri nama, dan simpan."
        ]
      },
      {
        "title": "Jobsheet 5 · Crankshaft",
        "instruction": "Buka PDF Crankshaft. Buat atau periksa komponen dengan dimensi pada gambar. Beri nama sesuai daftar komponen, lalu simpan. Siapkan sebagai Component dalam assembly, bukan hanya body tanpa identitas.",
        "check": "Komponen Crankshaft siap dirakit dan dimensinya diperiksa.",
        "hints": [
          "Baca semua tampak dan penampang; identifikasi bagian yang berpasangan.",
          "Periksa lubang, poros, ketebalan, dan satuan. Jangan mengubah dimensi untuk memaksa pasangan.",
          "Rapikan Browser, aktifkan komponen yang tepat, beri nama, dan simpan."
        ]
      },
      {
        "title": "Rakit mengacu gambar lengkap",
        "instruction": "Buka PDF Full dan Isometris. Cocokkan Cylinder Block, Piston Head, Pin Piston, Connecting Rod, serta Crankshaft dengan daftar komponen. Tetapkan komponen acuan tetap dan hubungkan komponen dengan joint sesuai fungsi.",
        "check": "Struktur dan pasangan komponen sesuai gambar rakitan.",
        "hints": [
          "Pastikan seluruh komponen telah diperiksa.",
          "Identifikasi bagian tetap, berputar, dan bergerak translasi.",
          "Periksa pusat, sumbu, orientasi, dan derajat kebebasan setiap hubungan."
        ]
      },
      {
        "title": "Uji, dokumentasikan & refleksikan",
        "instruction": "Amati video piston sebagai referensi gerak. Uji assembly sendiri di Fusion; periksa arah gerak dan interference pada beberapa posisi. Catat masalah, revisi dari desain sumber, lalu simpan dan kumpulkan bukti hasil.",
        "check": "Rakitan diuji dan hasil serta kendala dicatat.",
        "hints": [
          "Video bukan bukti bahwa desainmu bebas tabrakan.",
          "Periksa beberapa posisi sepanjang gerak.",
          "Simpan sumber, bukti sebelum–sesudah revisi, dan refleksi spesifik."
        ]
      }
    ],
    "quiz": [
      {
        "q": "Move saja sudah mendefinisikan mekanisme?",
        "options": [
          "Ya, jika bentuk menempel",
          "Tidak; perlu hubungan joint yang sesuai",
          "Ya, jika warna sama"
        ],
        "answer": 1,
        "why": "Posisi visual berbeda dengan hubungan mekanis."
      },
      {
        "q": "Agar komponen acuan tetap tidak ikut bergerak, gunakan …",
        "options": [
          "Ground sesuai konteks rakitan",
          "Zoom",
          "Fillet"
        ],
        "answer": 0,
        "why": "Ground menetapkan komponen sebagai acuan tetap."
      },
      {
        "q": "Animasi lancar membuktikan bebas interference?",
        "options": [
          "Selalu",
          "Jika diputar cepat",
          "Tidak; tetap perlu pemeriksaan pada beberapa posisi"
        ],
        "answer": 2,
        "why": "Pratinjau gerak tidak menggantikan pemeriksaan geometri."
      }
    ]
  }
];
export function lessonById(id: number) { return lessons.find(m => m.id === id); }
export function lessonTitle(id: number) { return lessonById(id)?.title ?? `Arsip materi sebelumnya · modul ${id}`; }
export function nextLesson(id: number) { return lessons[lessons.findIndex(m => m.id === id) + 1]; }
export const glossary = [['Parametric modeling', 'Pemodelan berbasis ukuran, batasan, dan hubungan fitur yang dapat diubah secara terkontrol.'], ['Sketch', 'Geometri 2D sebagai dasar pembuatan fitur 3D.'], ['Constraint', 'Aturan hubungan geometri: misalnya berimpit, sejajar, simetris, atau konsentris.'], ['Fully constrained', 'Kondisi saat ukuran dan posisi sketsa terdefinisi sehingga tidak memiliki kebebasan gerak yang tidak diinginkan.'], ['Extrude', 'Memberi kedalaman pada profil sepanjang suatu arah.'], ['Hole', 'Fitur membuat lubang dengan posisi dan spesifikasi tertentu.'], ['Fillet', 'Pembulatan sudut atau tepi.'], ['Chamfer', 'Pemotongan tepi menjadi bidang serong.'], ['Revolve', 'Membentuk volume dengan memutar profil terhadap sumbu.'], ['Body', 'Geometri benda di dalam suatu komponen.'], ['Component', 'Wadah geometri dengan identitas, origin, dan konteks assembly.'], ['Ground', 'Menetapkan komponen sebagai acuan tetap dalam konteks rakitan.'], ['Joint Origin', 'Lokasi dan orientasi acuan hubungan antarkomponen.'], ['Rigid Joint', 'Hubungan tanpa gerak relatif antarkomponen.'], ['Revolute Joint', 'Hubungan yang memberikan satu derajat kebebasan rotasi.'], ['As-Built Joint', 'Hubungan antar komponen yang telah berada di posisi yang benar.'], ['Joint Limits', 'Batas minimum dan maksimum gerak joint.'], ['Interference', 'Tumpang tindih volume geometri yang perlu dianalisis.'], ['Timeline', 'Riwayat urutan fitur pada desain parametrik.'], ['Mesh', 'Representasi permukaan dengan poligon; bukan riwayat fitur Fusion.']];
export const clinic = [
  [
    "Profil tidak bisa di-Extrude",
    "Profil terbuka atau terdapat kontur ganda.",
    "Periksa celah, Coincident, dan area profil pada sketch.",
    10
  ],
  [
    "Sketsa bergeser",
    "Dimensi atau constraint belum lengkap.",
    "Periksa ukuran dan hubungan terhadap origin; jangan memakai Fix untuk menyembunyikan masalah.",
    9
  ],
  [
    "Mirror tidak simetris",
    "Garis cermin atau geometri yang dipilih kurang tepat.",
    "Periksa garis konstruksi dan objek yang dicerminkan.",
    9
  ],
  [
    "Ukuran 3D belum tersedia",
    "PDF Part 3D nomor 1–2 masih berupa latihan sketch.",
    "Konfirmasikan ketebalan, kedalaman, dan fitur kepada guru; jangan mengarang ukuran.",
    10
  ],
  [
    "Komponen acuan ikut bergerak",
    "Komponen acuan belum di-ground.",
    "Periksa komponen tetap dan konteks Ground dalam desain assembly.",
    11
  ],
  [
    "Rakitan tidak bergerak sesuai fungsi",
    "Jenis joint, sumbu, atau derajat kebebasan belum tepat.",
    "Periksa hubungan putar, geser, dan tetap sesuai fungsi mekanisme piston.",
    11
  ],
  [
    "Komponen saling menembus",
    "Posisi atau ukuran pasangan perlu diperiksa.",
    "Periksa Interference pada beberapa posisi, lalu revisi dan uji ulang.",
    11
  ],
  [
    "Model Drive tidak tampil 3D",
    "Penyimpanan file bukan penerjemahan CAD.",
    "Gunakan STL/OBJ atau viewer Autodesk. F3D tidak dibaca langsung oleh viewer lokal.",
    10
  ]
] as const;
// Keep persisted Part 3D step IDs 2–5; retired IDs 0–1 must not count as new tasks.
export function stepKey(lesson: Lesson, index: number) { return lesson.id === 10 ? index + 2 : index; }
export function validStepKey(lesson: Lesson, key: number) { return Number.isInteger(key) && lesson.steps.some((_, i) => stepKey(lesson, i) === key); }
export function progressFor(events: { kind: string; module: number; payload: string }[], id: number) {
  const lesson = lessonById(id);
  if (!lesson) return 0;
  const latest = new Map<number, boolean>();
  for (const e of events.filter(e => e.module === id && e.kind === 'checkpoint')) {
    try {
      const p = JSON.parse(e.payload);
      if (validStepKey(lesson, p.step) && typeof p.checked === 'boolean') latest.set(p.step, p.checked);
    } catch { /* Ignore malformed historical records. */ }
  }
  return Math.round([...latest.values()].filter(Boolean).length / lesson.steps.length * 100);
}
export function safeLink(value: string, kind: 'drive' | 'fusion') { try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password)
        return '';
    if (kind === 'drive' && u.hostname !== 'drive.google.com')
        return '';
    if (kind === 'fusion' && !(u.hostname === 'autodesk360.com' || u.hostname.endsWith('.autodesk360.com') || u.hostname === 'a360.co'))
        return '';
    return u.href;
}
catch {
    return '';
} }
