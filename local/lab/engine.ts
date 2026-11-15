import * as THREE from 'three';
import { advancedCadGeometry, validateModeling, type CadOperation, type CadModifier } from './cad-modeling';

export type Point = { x: number; y: number };
export type SketchEntity = { id: string; kind: 'line' | 'rect' | 'circle'; x: number; y: number; a: number; b: number };
// rect: lower-left x/y, width a, height b. circle: center x/y, radius a.
// line: first point x/y, second point a/b. All lengths are millimeters.
export type CadProject = { version: 1; name: string; plane: 'XY' | 'XZ' | 'YZ'; depth: number; extruded: boolean; entities: SketchEntity[]; operation?: CadOperation; modifier?: CadModifier };
export const emptyProject = (): CadProject => ({ version: 1, name: 'Latihan pertamaku', plane: 'XY', depth: 10, extruded: false, entities: [] });
export const cadDraftKey = (path: string, owner: string) => `parametra-cad-v1:${path.toLowerCase()}:${owner}`;
export const entityName = (e: SketchEntity) => ({ line: 'Garis', rect: 'Persegi', circle: 'Lingkaran' })[e.kind];
export const round = (n: number) => Math.round(n * 1000) / 1000;
export type SketchSnap = Point & { kind: 'origin' | 'center' | 'midpoint' | 'endpoint'; label: string };
export function resolveSketchSnap(raw: Point, entities: SketchEntity[], unitsPerPixel: number, enabled: boolean, alignment?: { axis: 'x' | 'y'; value: number }): { point: Point; target: SketchSnap | null } {
    const p = alignment ? { ...raw, [alignment.axis]: alignment.value } : raw;
    if (!enabled) return { point: { x: round(p.x), y: round(p.y) }, target: null };
    const candidates: SketchSnap[] = [{ x: 0, y: 0, kind: 'origin', label: 'Origin · (0, 0)' }];
    for (const e of entities) {
        if (e.kind === 'circle') candidates.push({ x: e.x, y: e.y, kind: 'center', label: 'Pusat lingkaran' });
        else {
            const points = entityPoints(e);
            if (e.kind === 'rect') candidates.push({ x: e.x + e.a / 2, y: e.y + e.b / 2, kind: 'center', label: 'Pusat persegi' });
            points.forEach(point => candidates.push({ ...point, kind: 'endpoint', label: 'Titik ujung' }));
            const edges = e.kind === 'rect' ? points.length : 1;
            for (let i = 0; i < edges; i++) {
                const a = points[i], b = points[(i + 1) % points.length];
                candidates.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, kind: 'midpoint', label: 'Titik tengah' });
            }
        }
    }
    let target: SketchSnap | null = null, distance = 10 * unitsPerPixel;
    for (const candidate of candidates) {
        if (alignment && Math.abs(candidate[alignment.axis] - alignment.value) > .000001) continue;
        const d = Math.hypot(candidate.x - p.x, candidate.y - p.y);
        if (d <= distance && (!target || d < distance)) { target = candidate; distance = d; }
    }
    if (target) return { point: { x: target.x, y: target.y }, target };
    const grid = { x: Math.round(p.x), y: Math.round(p.y) };
    if (alignment) grid[alignment.axis] = alignment.value;
    return { point: grid, target: null };
}
export function validateProject(raw: unknown): CadProject {
    const p = raw as CadProject;
    if (!p || p.version !== 1 || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 80 || !['XY', 'XZ', 'YZ'].includes(p.plane) || typeof p.extruded !== 'boolean' || !Number.isFinite(p.depth) || p.depth < .1 || p.depth > 1000 || !Array.isArray(p.entities) || p.entities.length > 100) throw Error('File proyek tidak valid. Gunakan berkas JSON dari Lab 3D (maksimal 100 objek).');
    const ids = new Set<string>();
    const entities = p.entities.map(e => {
        if (!e || typeof e.id !== 'string' || e.id.length > 100 || ids.has(e.id) || !['line', 'rect', 'circle'].includes(e.kind) || ![e.x, e.y, e.a, e.b].every(v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 10000)) throw Error('Data objek sketch tidak valid.');
        if ((e.kind === 'rect' && (e.a < .1 || e.b < .1)) || (e.kind === 'circle' && e.a < .1) || (e.kind === 'line' && Math.hypot(e.a - e.x, e.b - e.y) < .1)) throw Error('Ukuran objek minimal 0,1 mm.');
        ids.add(e.id);
        return { id: e.id, kind: e.kind, x: e.x, y: e.y, a: e.a, b: e.b };
    });
    return { version: 1, name: p.name.trim(), plane: p.plane, depth: p.depth, extruded: p.extruded, entities, ...validateModeling(p) };
}
export function entityPoints(e: SketchEntity): Point[] {
    if (e.kind === 'rect') return [{ x: e.x, y: e.y }, { x: e.x + e.a, y: e.y }, { x: e.x + e.a, y: e.y + e.b }, { x: e.x, y: e.y + e.b }];
    if (e.kind === 'circle') return Array.from({ length: 96 }, (_, i) => ({ x: e.x + e.a * Math.cos(i * Math.PI / 48), y: e.y + e.a * Math.sin(i * Math.PI / 48) }));
    return [{ x: e.x, y: e.y }, { x: e.a, y: e.b }];
}
const EPS = .00001;
const equal = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < EPS;
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
function onSegment(a: Point, b: Point, c: Point) { return Math.abs(cross(a, b, c)) < EPS && c.x >= Math.min(a.x, b.x) - EPS && c.x <= Math.max(a.x, b.x) + EPS && c.y >= Math.min(a.y, b.y) - EPS && c.y <= Math.max(a.y, b.y) + EPS; }
function intersects(a: Point, b: Point, c: Point, d: Point) {
    const ab = cross(a, b, c), ac = cross(a, b, d), cd = cross(c, d, a), ce = cross(c, d, b);
    return (ab * ac < 0 && cd * ce < 0) || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}
function contains(poly: Point[], p: Point) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
}
export function sketchContours(entities: SketchEntity[]): Point[][] {
    const contours = entities.filter(e => e.kind !== 'line').map(entityPoints);
    const remaining = entities.filter(e => e.kind === 'line').map(entityPoints);
    // Every vertex in a closed line sketch must join precisely two segments.
    for (const edge of remaining) for (const point of edge) {
        if (remaining.reduce((n, segment) => n + segment.filter(p => equal(point, p)).length, 0) !== 2) throw Error('Garis masih terbuka atau bercabang. Hubungkan ujung garis hingga membentuk profil tertutup.');
    }
    while (remaining.length) {
        const points = remaining.shift()!;
        while (!equal(points[0], points[points.length - 1])) {
            const index = remaining.findIndex(e => e.some(p => equal(p, points[points.length - 1])));
            if (index < 0) throw Error('Profil garis belum tertutup.');
            const [edge] = remaining.splice(index, 1);
            points.push(equal(edge[0], points[points.length - 1]) ? edge[1] : edge[0]);
        }
        points.pop(); contours.push(points);
    }
    if (!contours.length) throw Error('Buat persegi, lingkaran, atau rangkaian garis tertutup terlebih dahulu.');
    for (const p of contours) {
        const area = p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a.x * b.y - b.x * a.y; }, 0);
        if (p.length < 3 || Math.abs(area) < EPS) throw Error('Profil tidak memiliki luas. Periksa garis sketch.');
        for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
            if (j === i + 1 || (i === 0 && j === p.length - 1)) continue;
            if (intersects(p[i], p[(i + 1) % p.length], p[j], p[(j + 1) % p.length])) throw Error('Garis profil saling berpotongan. Rapikan sketch sebelum extrude.');
        }
    }
    for (let i = 0; i < contours.length; i++) for (let j = i + 1; j < contours.length; j++) {
        const a = contours[i], b = contours[j];
        for (let k = 0; k < a.length; k++) for (let l = 0; l < b.length; l++) {
            if (intersects(a[k], a[(k + 1) % a.length], b[l], b[(l + 1) % b.length])) throw Error('Profil saling bersentuhan atau tumpang tindih. Letakkan lubang sepenuhnya di dalam profil, atau pisahkan objek.');
        }
    }
    return contours;
}
export function createCadGeometry(project: CadProject) {
    const valid = validateProject(project);
    const contours = valid.operation?.kind === 'loft' ? [] : sketchContours(valid.entities);
    const depths = contours.map((p, i) => contours.filter((q, j) => j !== i && contains(q, p[0])).length);
    const shapes: THREE.Shape[] = [];
    contours.forEach((p, i) => {
        if (depths[i] % 2) return;
        const shape = new THREE.Shape(p.map(v => new THREE.Vector2(v.x, v.y)));
        contours.forEach((hole, j) => {
            if (depths[j] === depths[i] + 1 && contains(p, hole[0])) shape.holes.push(new THREE.Path(hole.map(v => new THREE.Vector2(v.x, v.y))));
        });
        shapes.push(shape);
    });
    const geometry = advancedCadGeometry(valid, contours) || new THREE.ExtrudeGeometry(shapes, { depth: valid.depth, bevelEnabled: false, steps: 1 });
    if (valid.plane === 'XZ') geometry.rotateX(Math.PI / 2);
    if (valid.plane === 'YZ') geometry.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    geometry.computeBoundingBox();
    return geometry;
}
export function sketchBounds(entities: SketchEntity[]) {
    const pts = entities.flatMap(entityPoints);
    if (!pts.length) return { minX: -80, minY: -50, maxX: 80, maxY: 50 };
    return { minX: Math.min(...pts.map(p => p.x)), minY: Math.min(...pts.map(p => p.y)), maxX: Math.max(...pts.map(p => p.x)), maxY: Math.max(...pts.map(p => p.y)) };
}
export function sketchSvg(project: CadProject) {
    const b = sketchBounds(project.entities), pad = 10;
    const paths = project.entities.map(e => e.kind === 'circle' ? `<circle cx="${e.x}" cy="${-e.y}" r="${e.a}"/>` : e.kind === 'rect' ? `<rect x="${e.x}" y="${-e.y - e.b}" width="${e.a}" height="${e.b}"/>` : `<line x1="${e.x}" y1="${-e.y}" x2="${e.a}" y2="${-e.b}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.maxX - b.minX + pad * 2}mm" height="${b.maxY - b.minY + pad * 2}mm" viewBox="${b.minX - pad} ${-b.maxY - pad} ${b.maxX - b.minX + pad * 2} ${b.maxY - b.minY + pad * 2}"><g fill="none" stroke="#125bce" stroke-width="0.35">${paths}</g></svg>`;
}
