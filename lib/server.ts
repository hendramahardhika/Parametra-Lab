import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function db() { if (!env.DB)
    throw new Error('Penyimpanan belum tersedia. Coba lagi nanti.'); return env.DB; }
export function bucket() { if (!env.BUCKET)
    throw new Error('Penyimpanan berkas belum tersedia.'); return env.BUCKET; }
export async function identity() { const user = await getChatGPTUser(); const configured = (env.TEACHER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); return { user, teacher: !!user && configured.includes(user.email.toLowerCase()) }; }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function sameOrigin(req: Request) { const origin = req.headers.get('origin'); return !origin || origin === new URL(req.url).origin; }
export function clean(value: unknown, max = 2000) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
export function failure(e: unknown) { console.error('Parametra request failed', e instanceof Error ? e.message : 'Unknown error'); return json({ error: 'Data belum berhasil diproses. Isian tetap tersedia; silakan coba kembali.' }, 503); }
