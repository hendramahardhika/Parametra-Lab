import * as THREE from 'three';
import type { CadProject, Point, SketchEntity } from './cad-workbench';

export type CadOperation = { kind: 'extrude' } | { kind: 'revolve'; axis: number; angle: number } | { kind: 'sweep'; radius: number; angle: number } | { kind: 'loft'; bottom: string; top: string; aligned: boolean };
export type CadModifier = { kind: 'fillet' | 'chamfer' | 'shell'; size: number };
export type ModelCommand = CadOperation['kind'] | CadModifier['kind'] | 'presspull';
export const commandNames: Record<ModelCommand, string> = { extrude: 'Extrude', revolve: 'Revolve', sweep: 'Sweep', loft: 'Loft', presspull: 'Press Pull', fillet: 'Fillet', chamfer: 'Chamfer', shell: 'Shell' };
export function validateModeling(raw: CadProject) {
    const op = raw.operation, mod = raw.modifier;
    const finite = (n: number, low: number, high: number) => Number.isFinite(n) && n >= low && n <= high;
    if (op) {
        if (!['extrude', 'revolve', 'sweep', 'loft'].includes(op.kind)) throw Error('Perintah Create tidak valid.');
        if (op.kind === 'revolve' && (!finite(op.axis, -10000, 10000) || !finite(op.angle, 1, 360))) throw Error('Revolve: sudut 1–360° dan posisi sumbu maksimal ±10000 mm.');
        if (op.kind === 'sweep' && (!finite(op.radius, .1, 10000) || !finite(op.angle, 1, 180))) throw Error('Sweep: radius jalur 0,1–10000 mm dan sudut 1–180°.');
        if (op.kind === 'loft' && (typeof op.bottom !== 'string' || typeof op.top !== 'string' || op.bottom === op.top || typeof op.aligned !== 'boolean')) throw Error('Loft: pilih dua profil yang berbeda.');
    }
    if (mod && (!['fillet', 'chamfer', 'shell'].includes(mod.kind) || !finite(mod.size, .1, 1000))) throw Error('Ukuran Modify harus 0,1–1000 mm.');
    if (mod && op && op.kind !== 'extrude') throw Error('Fillet, Chamfer, dan Shell latihan diterapkan pada hasil Extrude.');
    return {
        ...(op ? { operation: op.kind === 'extrude' ? { kind: 'extrude' as const } : op.kind === 'revolve' ? { kind: 'revolve' as const, axis: op.axis, angle: op.angle } : op.kind === 'sweep' ? { kind: 'sweep' as const, radius: op.radius, angle: op.angle } : { kind: 'loft' as const, bottom: op.bottom, top: op.top, aligned: op.aligned } } : {}),
        ...(mod ? { modifier: { kind: mod.kind, size: mod.size } } : {}),
    };
}
type V = [number, number, number];
const area = (p: Point[]) => p.reduce((sum, a, i) => { const b = p[(i + 1) % p.length]; return sum + a.x * b.y - b.x * a.y; }, 0) / 2;
function ccw(p: Point[]) { return area(p) < 0 ? [...p].reverse() : [...p]; }
function oneProfile(contours: Point[][]) {
    if (contours.length !== 1) throw Error('Perintah ini memakai satu profil tertutup tanpa lubang. Edit sketch atau gunakan Extrude untuk profil berlubang.');
    const p = ccw(contours[0]);
    return p.filter((b, i) => { const a = p[(i + p.length - 1) % p.length], c = p[(i + 1) % p.length]; return Math.abs((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) > 1e-8; });
}
function inset(profile: Point[], distance: number): Point[] {
    const p = ccw(profile);
    const output = p.map((b, i) => {
        const a = p[(i + p.length - 1) % p.length], c = p[(i + 1) % p.length];
        const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y;
        const ul = Math.hypot(ux, uy), vl = Math.hypot(vx, vy), turn = ux * vy - uy * vx;
        if (turn <= .00000001) throw Error('Modify latihan memakai profil cembung: persegi, lingkaran, atau poligon tanpa sudut cekung.');
        const n1 = { x: -uy / ul, y: ux / ul }, n2 = { x: -vy / vl, y: vx / vl };
        const denom = 1 + n1.x * n2.x + n1.y * n2.y;
        return { x: b.x + distance * (n1.x + n2.x) / denom, y: b.y + distance * (n1.y + n2.y) / denom };
    });
    if (area(output) <= .000001 || output.some(q => p.some((a, i) => { const b = p[(i + 1) % p.length]; return (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x) < -.000001; })) || output.some((q, i) => {
        const next = output[(i + 1) % output.length], a = p[i], b = p[(i + 1) % p.length];
        return (next.x - q.x) * (b.x - a.x) + (next.y - q.y) * (b.y - a.y) <= .000001;
    })) throw Error('Ukuran Modify terlalu besar untuk profil. Kecilkan radius, jarak, atau tebal dinding.');
    return output;
}
class MeshBuilder {
    vertices: number[] = [];
    tri(a: V, b: V, c: V, normal?: V) {
        const u = b.map((n, i) => n - a[i]), v = c.map((n, i) => n - a[i]);
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        if (Math.hypot(...n) < 1e-10) return;
        if (normal && n.reduce((s, x, i) => s + x * normal[i], 0) < 0) [b, c] = [c, b];
        this.vertices.push(...a, ...b, ...c);
    }
    side(a: V[], b: V[], reverse = false) {
        for (let i = 0; i < a.length; i++) {
            const j = (i + 1) % a.length;
            if (reverse) { this.tri(a[i], b[j], a[j]); this.tri(a[i], b[i], b[j]); }
            else { this.tri(a[i], a[j], b[j]); this.tri(a[i], b[j], b[i]); }
        }
    }
    cap(profile: Point[], points: V[], normal: V, holes: { profile: Point[]; points: V[] }[] = []) {
        const tris = THREE.ShapeUtils.triangulateShape(profile.map(p => new THREE.Vector2(p.x, p.y)), holes.map(h => h.profile.map(p => new THREE.Vector2(p.x, p.y))));
        const all = [...points, ...holes.flatMap(h => h.points)];
        for (const [a, b, c] of tris) this.tri(all[a], all[b], all[c], normal);
    }
    convexCap(points: V[], normal: V) {
        const center = points.reduce((c, p) => c.map((n, i) => n + p[i] / points.length) as V, [0, 0, 0] as V);
        points.forEach((p, i) => this.tri(center, p, points[(i + 1) % points.length], normal));
    }
    finish() {
        let volume = 0;
        for (let i = 0; i < this.vertices.length; i += 9) {
            const [ax, ay, az, bx, by, bz, cx, cy, cz] = this.vertices.slice(i, i + 9);
            volume += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
        }
        if (!Number.isFinite(volume) || Math.abs(volume) < .000001) throw Error('Model tidak memiliki volume. Periksa profil dan parameter.');
        if (volume < 0) for (let i = 0; i < this.vertices.length; i += 9) for (let j = 0; j < 3; j++) [this.vertices[i + 3 + j], this.vertices[i + 6 + j]] = [this.vertices[i + 6 + j], this.vertices[i + 3 + j]];
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3)); g.computeVertexNormals(); return g;
    }
}
const ring = (p: Point[], z: number): V[] => p.map(a => [a.x, a.y, z]);
function modifiedExtrude(profile: Point[], depth: number, mod: CadModifier) {
    const { size, kind } = mod, b = new MeshBuilder();
    if (size >= depth / (kind === 'shell' ? 1 : 2)) throw Error(kind === 'shell' ? 'Tebal dinding harus lebih kecil dari tinggi model.' : 'Radius/jarak harus lebih kecil dari setengah ketebalan model.');
    const inner = inset(profile, size);
    if (kind === 'shell') {
        const bottom = ring(profile, 0), top = ring(profile, depth), floor = ring(inner, size), rim = ring(inner, depth);
        b.side(bottom, top); b.side(floor, rim, true);
        b.cap(profile, bottom, [0, 0, -1]); b.cap(inner, floor, [0, 0, 1]); b.cap(profile, top, [0, 0, 1], [{ profile: [...inner].reverse(), points: [...rim].reverse() }]);
    } else {
        const rings: V[][] = [], steps = kind === 'fillet' ? 12 : 1;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps, theta = t * Math.PI / 2;
            const amount = kind === 'fillet' ? size * (1 - Math.sin(theta)) : size * (1 - t);
            const z = kind === 'fillet' ? size * (1 - Math.cos(theta)) : size * t;
            rings.push(ring(inset(profile, amount), z));
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps, theta = t * Math.PI / 2;
            const amount = kind === 'fillet' ? size * (1 - Math.sin(theta)) : size * (1 - t);
            const z = kind === 'fillet' ? depth - size * (1 - Math.cos(theta)) : depth - size * t;
            rings.push(ring(inset(profile, amount), z));
        }
        rings.slice(1).forEach((r, i) => b.side(rings[i], r));
        b.cap(inner, rings[0], [0, 0, -1]); b.cap(inner, rings[rings.length - 1], [0, 0, 1]);
    }
    return b.finish();
}
function loftProfile(e: SketchEntity): Point[] {
    if (e.kind === 'line') throw Error('Loft latihan memakai profil persegi atau lingkaran.');
    if (e.kind === 'circle') return Array.from({ length: 96 }, (_, i) => { const a = -Math.PI * .75 + i * Math.PI / 48; return { x: e.x + e.a * Math.cos(a), y: e.y + e.a * Math.sin(a) }; });
    const corners = [{ x: e.x, y: e.y }, { x: e.x + e.a, y: e.y }, { x: e.x + e.a, y: e.y + e.b }, { x: e.x, y: e.y + e.b }];
    return corners.flatMap((a, i) => { const b = corners[(i + 1) % 4]; return Array.from({ length: 24 }, (_, j) => ({ x: a.x + (b.x - a.x) * j / 24, y: a.y + (b.y - a.y) * j / 24 })); });
}
export function advancedCadGeometry(project: CadProject, contours: Point[][]): THREE.BufferGeometry | null {
    const op = project.operation, mod = project.modifier;
    if (mod) return modifiedExtrude(oneProfile(contours), project.depth, mod);
    if (!op || op.kind === 'extrude') return null;
    const builder = new MeshBuilder();
    if (op.kind === 'loft') {
        const bottom = project.entities.find(e => e.id === op.bottom), top = project.entities.find(e => e.id === op.top);
        if (!bottom || !top) throw Error('Profil Loft tidak ditemukan. Pilih kembali profil bawah dan atas.');
        if (project.entities.length !== 2) throw Error('Loft latihan memakai tepat dua profil persegi/lingkaran. Hapus objek lain agar profilnya jelas.');
        const a = loftProfile(bottom), b = loftProfile(top);
        if (op.aligned) {
            const center = (e: SketchEntity) => e.kind === 'rect' ? { x: e.x + e.a / 2, y: e.y + e.b / 2 } : { x: e.x, y: e.y };
            const ca = center(bottom), cb = center(top); b.forEach(p => { p.x += ca.x - cb.x; p.y += ca.y - cb.y; });
        }
        const low = ring(a, 0), high = ring(b, project.depth);
        builder.side(low, high); builder.convexCap(low, [0, 0, -1]); builder.convexCap(high, [0, 0, 1]);
    } else if (op.kind === 'revolve') {
        const profile = oneProfile(contours).map(p => ({ x: p.x - op.axis, y: p.y }));
        if (profile.some(p => p.x < -.000001)) throw Error('Profil Revolve harus berada di kanan sumbu. Geser profil atau atur posisi X sumbu di sisi kiri profil.');
        const theta = op.angle * Math.PI / 180, steps = Math.max(8, Math.ceil(op.angle / 3)), rings: V[][] = [];
        for (let i = 0; i <= steps; i++) {
            const a = theta * i / steps;
            rings.push(i === steps && op.angle === 360 ? rings[0] : profile.map(p => [op.axis + p.x * Math.cos(a), p.y, p.x * Math.sin(a)]));
        }
        rings.slice(1).forEach((r, i) => builder.side(rings[i], r));
        if (op.angle < 360) { builder.cap(profile, rings[0], [0, 0, -1]); builder.cap(profile, rings[steps], [-Math.sin(theta), 0, Math.cos(theta)]); }
    } else {
        const source = oneProfile(contours), xs = source.map(p => p.x), ys = source.map(p => p.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const profile = source.map(p => ({ x: p.x - cx, y: p.y - cy }));
        if (op.radius <= Math.max(...profile.map(p => Math.abs(p.x))) + .1) throw Error('Radius jalur Sweep harus lebih besar dari setengah lebar profil.');
        const theta = op.angle * Math.PI / 180, steps = Math.max(8, Math.ceil(op.angle / 3)), rings: V[][] = [];
        for (let i = 0; i <= steps; i++) {
            const a = theta * i / steps;
            rings.push(profile.map(p => [cx + op.radius * (1 - Math.cos(a)) + p.x * Math.cos(a), cy + p.y, op.radius * Math.sin(a) - p.x * Math.sin(a)]));
        }
        rings.slice(1).forEach((r, i) => builder.side(rings[i], r));
        builder.cap(profile, rings[0], [0, 0, -1]); builder.cap(profile, rings[steps], [Math.sin(theta), 0, Math.cos(theta)]);
    }
    return builder.finish();
}
