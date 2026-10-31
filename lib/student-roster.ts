import type { StudentIdentity } from './student-identity';

// Teacher-provided XI TP 2 roster, in attendance-number order.
// No NIS, attendance marks, PINs, or invented learning activity are included.
// No. 4 is intentionally retained following the teacher's confirmation.
const xiTp2Names = [
    'AJI BAYU SAPUTRA',
    'ALFITO FAHREZA PUTRA',
    'ALVINO ANUGRAH PRATAMA',
    'ANANDA OCTAVIAN',
    'BERNADINE AVREZAR HEMANTA',
    'DIRGA WISNU SANJAYA',
    'ERLINTANG AL BARAKA',
    'HAEKAL ACHMAD BAIHAQI',
    'IQBAL RAMA SAPUTRA',
    'MUFID ABDULLAH',
    'MUHAMMAD BAGUS IJLAL MAJID',
    'MUHAMMAD EVAN HIDAYATULLAH',
    'MUHAMMAD GHANY AL-MUGHNY',
    'MUHAMMAD RIZKI FEBRIANSYAH',
    "MUS'AB MAHESWARA",
    'NINO ERVIN ISTIYANTO',
    'PATHIR PRATAMA',
    'RAFI MUHENDAR',
    'RAY NANDA PRATAMA',
    'RILLA RADITYA ARISYA',
    'RYAN HANS ADITYA',
    'SEPTIAN RIZKY NUR FITRI',
    'ULUNG SATYA WICAKSANA',
    'ZIDAN ZAKI HAMIZAN',
] as const;

// The teacher also supplied this same 24-name list for XI TP 1 and asked
// for it to appear there. Retain XI TP 2; do not move or copy any progress.
const xiTp1Names = [...xiTp2Names];

function classRoster(names: readonly string[], className: StudentIdentity['className']): StudentIdentity[] {
    return names.map((fullName, index) => ({ fullName, className, attendance: index + 1 }));
}

export const studentRoster: StudentIdentity[] = [
    ...classRoster(xiTp1Names, 'XI TP 1'),
    ...classRoster(xiTp2Names, 'XI TP 2'),
];
