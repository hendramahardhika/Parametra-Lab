import { lessons, progressFor, stepKey, validStepKey } from './curriculum';
import type { Activity } from '@/app/components/learning';

export type StudentModuleReport = {
    id: number; title: string; percent: number; checked: number; total: number;
    steps: { title: string; check: string; checked: boolean }[];
    quizScore: number | null; quizAttempts: number; works: number;
};
export type StudentProgressReport = {
    id: string; name: string; className: string; attendance: number;
    modules: StudentModuleReport[]; completedModules: number; lastActivity: string | null;
};
export function buildStudentProgressReport(
    profile: { id: string; name: string; class_name: string; attendance: number },
    events: Activity[], works: { uid: string; module: number; created: string }[],
): StudentProgressReport {
    const ownEvents = events.filter(e => e.uid === profile.id).slice().sort((a, b) => a.created.localeCompare(b.created));
    const ownWorks = works.filter(w => w.uid === profile.id);
    const modules = lessons.map(lesson => {
        const activity = ownEvents.filter(e => e.module === lesson.id);
        const checked = new Map<number, boolean>();
        let quizScore: number | null = null, quizAttempts = 0;
        for (const e of activity) {
            try {
                const p = JSON.parse(e.payload);
                if (e.kind === 'checkpoint' && validStepKey(lesson, p.step) && typeof p.checked === 'boolean') checked.set(p.step, p.checked);
                if (e.kind === 'quiz' && typeof p.score === 'number' && Number.isFinite(p.score) && p.score >= 0 && p.score <= 100) { quizScore = p.score; quizAttempts++; }
            } catch { /* Malformed historical entries are not counted. */ }
        }
        return { id: lesson.id, title: lesson.title, percent: progressFor(activity, lesson.id),
            checked: [...checked.values()].filter(Boolean).length, total: lesson.steps.length,
            steps: lesson.steps.map((s, i) => ({ title: s.title, check: s.check, checked: checked.get(stepKey(lesson, i)) === true })),
            quizScore, quizAttempts, works: ownWorks.filter(w => w.module === lesson.id).length };
    });
    const times = [...ownEvents, ...ownWorks].map(e => Date.parse(e.created)).filter(Number.isFinite);
    return { id: profile.id, name: profile.name, className: profile.class_name, attendance: profile.attendance,
        modules, completedModules: modules.filter(m => m.percent === 100).length,
        lastActivity: times.length ? new Date(Math.max(...times)).toISOString() : null };
}
