import entries from './jobsheets.json';
export type Stage = 'intro' | 'sketch' | 'part' | 'assembly';
export type Jobsheet = {
  id: string; stage: string; number: number | null; title: string;
  source: string; asset: string; pages: number; role: string; note?: string;
  sourceRoot?: string; previewSource?: string; previewAsset?: string;
};
export const jobsheets: Jobsheet[] = entries;
export const stages: { key: Stage; title: string; detail: string; module: number }[] = [
  { key: 'intro', title: 'Pengenalan Fusion', detail: 'Antarmuka, navigasi, satuan & penyimpanan', module: 8 },
  { key: 'sketch', title: 'Sketch 2D', detail: 'Profil, dimensi & constraint · 2 jobsheet', module: 9 },
  { key: 'part', title: 'Membuat part 3D', detail: 'Dari sketsa menjadi benda solid · 4 jobsheet', module: 10 },
  { key: 'assembly', title: 'Assembly', detail: '5 komponen piston & 2 dokumen acuan', module: 11 },
];
export function jobsheetsFor(stage: Stage) { return jobsheets.filter(s => s.stage === stage); }
export function jobsheetUrl(sheet: Jobsheet) {
  return (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? 'public/jobsheets/' : '/jobsheets/') + sheet.asset;
}
export function sketchPreviewUrl(sheet: Jobsheet) {
  return (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? 'public/jobsheets/' : '/jobsheets/') + sheet.previewAsset;
}
export function pistonVideoUrl() {
  return process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true'
    ? 'public/animation-piston-white.mp4' : '/animation-piston-white.mp4';
}

