import data from './learning-resources.generated.json';
import type { Stage } from './jobsheets';

export type ResourceFormat = { extension: string; name: string; asset: string; bytes: number };
export type LearningResource = {
  id: string; title: string; description: string; category: string; cycle: string;
  stages: string[]; audience: string; meeting?: number; cover?: string; moduleTitle: string;
  formats: ResourceFormat[];
};
export const learningResources: LearningResource[] = data;
export const resourceStages: { key: Stage; title: string; module: number }[] = [
  { key: 'intro', title: 'Pengenalan Fusion', module: 8 },
  { key: 'sketch', title: 'Sketch 2D', module: 9 },
  { key: 'part', title: 'Part 3D', module: 10 },
  { key: 'assembly', title: 'Assembly', module: 11 },
];
export function resourceUrl(asset: string) {
  return (process.env.NEXT_PUBLIC_LOCAL_EDITION === 'true' ? 'public/library/' : '/library/') + asset;
}
export function readableSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
}
