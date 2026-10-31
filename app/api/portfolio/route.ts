import { db, bucket, identity, json, sameOrigin, clean, failure } from '@/lib/server';
import { lessonById, safeLink } from '@/lib/curriculum';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) { if (!sameOrigin(req))
    return json({ error: 'Permintaan tidak diizinkan.' }, 403); if (Number(req.headers.get('content-length')) > 21 * 1024 * 1024)
    return json({ error: 'Maksimal berkas 20 MB.' }, 413); let key: string | undefined; try {
    const { user } = await identity();
    if (!user)
        return json({ error: 'Masuk dahulu untuk mengumpulkan karya.' }, 401);
    const form = await req.formData();
    const module = Number(form.get('module'));
    if (!Number.isInteger(module) || !lessonById(module))
        return json({ error: 'Modul tidak valid.' }, 400);
    const reflection = clean(form.get('reflection'), 2000), drive = clean(form.get('drive'), 1500), fusion = clean(form.get('fusion'), 1500);
    if (reflection.length < 10)
        return json({ error: 'Refleksi minimal 10 karakter.' }, 400);
    if (drive && !safeLink(drive, 'drive') || fusion && !safeLink(fusion, 'fusion'))
        return json({ error: 'Tautan harus HTTPS Google Drive atau Autodesk sesuai kolomnya.' }, 400);
    const file = form.get('file');
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile && !drive && !fusion)
        return json({ error: 'Tambahkan berkas atau tautan karya.' }, 400);
    if (hasFile && (file.size > 20 * 1024 * 1024 || !/^.+\.(f3d|f3z|stl|obj|step|stp|pdf|png|jpe?g)$/i.test(file.name)))
        return json({ error: 'Berkas tidak didukung atau lebih dari 20 MB.' }, 400);
    const id = crypto.randomUUID();
    if (hasFile) {
        key = `submissions/${id}`;
        await bucket().put(key, file.stream(), { httpMetadata: { contentType: 'application/octet-stream' } });
    }
    const cycle = await db().prepare('SELECT value FROM settings WHERE key=?').bind('cycle').first<{
        value: string;
    }>();
    await db().batch([db().prepare('INSERT OR IGNORE INTO learners (id,name,class_name) VALUES (?,?,?)').bind(user.userId, user.displayName, 'XI Teknik Pemesinan'), db().prepare('INSERT INTO submissions (id,uid,module,filename,object_key,drive_url,fusion_url,reflection,cycle,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id, user.userId, module, hasFile ? file.name.slice(0, 180) : 'Karya melalui tautan', key || null, drive, fusion, reflection, cycle?.value || 'Pra-tindakan', new Date().toISOString())]);
    return json({ ok: true, id });
}
catch (e) {
    if (key)
        await bucket().delete(key).catch(() => { });
    return failure(e);
} }
export async function GET(req: Request) { try {
    const { user, teacher } = await identity();
    if (!user)
        return json({ error: 'Masuk dahulu.' }, 401);
    const id = new URL(req.url).searchParams.get('id');
    const row = await db().prepare('SELECT uid,object_key,filename FROM submissions WHERE id=?').bind(id).first<{
        uid: string;
        object_key: string;
        filename: string;
    }>();
    if (!row || (!teacher && row.uid !== user.userId))
        return json({ error: 'Berkas tidak ditemukan.' }, 404);
    if (!row.object_key)
        return json({ error: 'Karya ini menggunakan tautan eksternal.' }, 404);
    const object = await bucket().get(row.object_key);
    if (!object)
        return json({ error: 'Berkas tidak tersedia.' }, 404);
    return new Response(object.body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
}
catch (e) {
    return failure(e);
} }
