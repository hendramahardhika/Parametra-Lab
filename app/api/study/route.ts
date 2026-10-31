import { db, identity, json, sameOrigin, clean, failure } from '@/lib/server';
import { lessonById, safeLink, validStepKey } from '@/lib/curriculum';
import { z } from 'zod';
const inputSchema = z.object({ action: z.string().default(''), kind: z.string().default(''), module: z.number().default(-1), step: z.number().default(-1), level: z.number().default(-1), checked: z.boolean().optional(), answers: z.array(z.number()).default([]), name: z.string().default(''), className: z.string().default(''), drive: z.string().default(''), cycle: z.string().default(''), id: z.string().default(''), score: z.number().default(-1), feedback: z.string().default(''), note: z.string().default('') });
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { try {
    const { user, teacher } = await identity();
    const config = await db().prepare('SELECT key,value FROM settings').all();
    const settings = Object.fromEntries(config.results.map((r: Record<string, unknown>) => [r.key, r.value]));
    if (!user)
        return json({ user: null, teacher: false, events: [], submissions: [], profiles: [], settings: {} });
    const isTeacher = new URL(req.url).searchParams.get('teacher') === '1';
    if (isTeacher && !teacher)
        return json({ error: 'Ruang guru hanya tersedia untuk akun guru yang telah ditetapkan.' }, 403);
    const statements = isTeacher ? [db().prepare('SELECT * FROM learners'), db().prepare('SELECT * FROM activities ORDER BY created ASC'), db().prepare('SELECT s.*,l.name,l.class_name FROM submissions s LEFT JOIN learners l ON s.uid=l.id ORDER BY s.created DESC LIMIT 2000')] : [db().prepare('SELECT * FROM learners WHERE id=?').bind(user.userId), db().prepare('SELECT * FROM activities WHERE uid=? ORDER BY created ASC').bind(user.userId), db().prepare('SELECT * FROM submissions WHERE uid=? ORDER BY created DESC LIMIT 200').bind(user.userId)];
    const [profiles, events, submissions] = await db().batch(statements);
    return json({ user: { name: user.displayName, email: user.email }, teacher, profiles: profiles.results, events: events.results, submissions: submissions.results, settings, limitNote: isTeacher ? 'Seluruh aktivitas tersimpan dan maksimal 2.000 pengumpulan terbaru.' : 'Seluruh aktivitas tersimpan dan maksimal 200 pengumpulan terbaru.' });
}
catch (e) {
    return failure(e);
} }
export async function POST(req: Request) {
    if (!sameOrigin(req))
        return json({ error: 'Permintaan tidak diizinkan.' }, 403);
    if (Number(req.headers.get('content-length')) > 32000)
        return json({ error: 'Isian terlalu panjang.' }, 413);
    try {
        const { user, teacher } = await identity();
        if (!user)
            return json({ error: 'Masuk dahulu untuk menyimpan progres.' }, 401);
        const input = inputSchema.safeParse(await req.json());
        if (!input.success)
            return json({ error: 'Isian tidak valid.' }, 400);
        const p = input.data;
        if (p.action === 'profile') {
            const name = clean(p.name, 80), className = clean(p.className, 80);
            if (!name || !className)
                return json({ error: 'Nama dan kelas wajib diisi.' }, 400);
            await db().prepare('INSERT INTO learners (id,name,class_name) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,class_name=excluded.class_name').bind(user.userId, name, className).run();
            return json({ ok: true });
        }
        if (p.action === 'settings') {
            if (!teacher)
                return json({ error: 'Akses khusus guru.' }, 403);
            const drive = clean(p.drive, 1500);
            if (drive && !safeLink(drive, 'drive'))
                return json({ error: 'Gunakan tautan HTTPS drive.google.com.' }, 400);
            const cycle = clean(p.cycle, 60);
            if (!['Pra-tindakan', 'Siklus I', 'Siklus II'].includes(cycle))
                return json({ error: 'Pilih tahap PTK yang tersedia.' }, 400);
            await db().batch([db().prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('drive', drive), db().prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('cycle', cycle)]);
            return json({ ok: true });
        }
        if (p.action === 'review') {
            if (!teacher)
                return json({ error: 'Akses khusus guru.' }, 403);
            const score = Number(p.score);
            if (!Number.isInteger(score) || score < 0 || score > 100)
                return json({ error: 'Nilai harus 0–100.' }, 400);
            const res = await db().prepare('UPDATE submissions SET score=?,feedback=?,reviewer=? WHERE id=?').bind(score, clean(p.feedback, 2000), user.userId, clean(p.id, 80)).run();
            return res.meta.changes ? json({ ok: true }) : json({ error: 'Karya tidak ditemukan.' }, 404);
        }
        const module = Number(p.module), lesson = lessonById(module);
        if (!Number.isInteger(module) || !lesson)
            return json({ error: 'Modul tidak valid.' }, 400);
        let payload: Record<string, unknown>;
        const kind = p.kind;
        if (kind === 'checkpoint') {
            if (!validStepKey(lesson, p.step) || typeof p.checked !== 'boolean')
                return json({ error: 'Langkah tidak valid.' }, 400);
            payload = { step: p.step, checked: p.checked };
        }
        else if (kind === 'hint') {
            if (!validStepKey(lesson, p.step) || !Number.isInteger(p.level) || p.level < 1 || p.level > 3)
                return json({ error: 'Petunjuk tidak valid.' }, 400);
            payload = { step: p.step, level: p.level };
        }
        else if (kind === 'quiz') {
            if (!Array.isArray(p.answers) || p.answers.length !== lesson.quiz.length || p.answers.some((a: unknown) => !Number.isInteger(a) || Number(a) < 0 || Number(a) > 2))
                return json({ error: 'Jawab semua pertanyaan dahulu.' }, 400);
            payload = { answers: p.answers, score: Math.round(100 * lesson.quiz.filter((q, i) => q.answer === p.answers[i]).length / lesson.quiz.length) };
        }
        else if (kind === 'reflection') {
            const note = clean(p.note, 2000);
            if (note.length < 10)
                return json({ error: 'Tuliskan refleksi sedikitnya 10 karakter.' }, 400);
            payload = { note };
        }
        else
            return json({ error: 'Aktivitas tidak valid.' }, 400);
        const cycle = await db().prepare('SELECT value FROM settings WHERE key=?').bind('cycle').first<{
            value: string;
        }>();
        payload.cycle = cycle?.value || 'Pra-tindakan';
        await db().batch([db().prepare('INSERT OR IGNORE INTO learners (id,name,class_name) VALUES (?,?,?)').bind(user.userId, user.displayName, 'XI Teknik Pemesinan'), db().prepare('INSERT INTO activities (id,uid,kind,module,payload,created) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), user.userId, kind, module, JSON.stringify(payload), new Date().toISOString())]);
        return json({ ok: true, ...payload });
    }
    catch (e) {
        return failure(e);
    }
}
