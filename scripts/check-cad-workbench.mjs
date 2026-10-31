import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const root = process.cwd();
await mkdir(path.join(root, 'tmp/cad-check'), { recursive: true });
const output = path.join(root, 'tmp/cad-check/engine.mjs');
await build({ entryPoints: ['lib/cad-workbench.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm' });
const { emptyProject, validateProject, createCadGeometry, sketchContours, sketchSvg, cadDraftKey, resolveSketchSnap } = await import(pathToFileURL(output));
const rect = { id: 'rect', kind: 'rect', x: -40, y: -25, a: 80, b: 50 };
const hole = { id: 'hole', kind: 'circle', x: 0, y: 0, a: 6, b: 0 };
// Capture uses screen pixels, not model units, so origin stays easy to hit at any zoom.
for (const scale of [.025, .25, 4]) {
    const near = resolveSketchSnap({ x: 7 * scale, y: 2 * scale }, [], scale, true);
    assert.equal(near.target?.kind, 'origin');
    assert.deepEqual(near.point, { x: 0, y: 0 });
    assert.equal(resolveSketchSnap({ x: 11 * scale, y: 0 }, [], scale, true).target, null);
}
assert.deepEqual(resolveSketchSnap({ x: .125, y: -.25 }, [], .25, false), { point: { x: .125, y: -.25 }, target: null });
const offsetCircle = { ...hole, x: 17.35, y: 12.125 };
assert.deepEqual(resolveSketchSnap({ x: 18, y: 12 }, [offsetCircle], .25, true).point, { x: 17.35, y: 12.125 });
assert.equal(resolveSketchSnap({ x: 10.2, y: 5.3 }, [{ ...rect, x: 0, y: 0, a: 20, b: 10 }], .1, true).target?.kind, 'center');
assert.equal(resolveSketchSnap({ x: 40.2, y: 0 }, [rect], .1, true).target?.kind, 'midpoint');
assert.equal(resolveSketchSnap({ x: -40.2, y: -25.2 }, [rect], .1, true).target?.kind, 'endpoint');
assert.equal(resolveSketchSnap({ x: .1, y: .1 }, [], .25, true, { axis: 'y', value: .75 }).target, null);
assert.equal(resolveSketchSnap({ x: .1, y: .1 }, [], .25, true, { axis: 'y', value: .75 }).point.y, .75);
assert.equal(resolveSketchSnap({ x: .1, y: 1 }, [], .25, true, { axis: 'y', value: 0 }).target?.kind, 'origin');
function volume(geometry) {
    const p = geometry.getAttribute('position'); let v = 0;
    for (let i = 0; i < p.count; i += 3) {
        const a = [p.getX(i), p.getY(i), p.getZ(i)], b = [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)], c = [p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)];
        v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
    return Math.abs(v);
}
function checkMesh(project, expectedVolume, extents, tolerance = .001) {
    const g = createCadGeometry(project);
    try {
        if (expectedVolume !== null) assert(Math.abs(volume(g) - expectedVolume) / expectedVolume < tolerance, `Volume: ${volume(g)} vs ${expectedVolume}`);
        const b = g.boundingBox;
        const actual = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
        if (extents) actual.forEach((v, i) => assert(Math.abs(v - extents[i]) < .001, `Bounds: ${actual} vs ${extents}`));
        assert(Array.from(g.getAttribute('normal').array).every(Number.isFinite));
        // Watertight triangle soup: each undirected edge must occur twice.
        const p = g.getAttribute('position'), edges = new Map(), directions = new Map();
        const key = i => [p.getX(i), p.getY(i), p.getZ(i)].map(v => String(Math.round(v * 10000))).join(',');
        for (let i = 0; i < p.count; i += 3) for (let j = 0; j < 3; j++) {
            const a = key(i + j), b = key(i + (j + 1) % 3), edge = [a, b].sort().join('|');
            edges.set(edge, (edges.get(edge) || 0) + 1);
            directions.set(edge, (directions.get(edge) || 0) + (a < b ? 1 : -1));
        }
        assert([...edges.values()].every(n => n === 2), 'Model harus tertutup untuk ekspor STL.');
        assert([...directions.values()].every(n => n === 0), 'Orientasi muka model harus konsisten.');
    } finally { g.dispose(); }
}
const p = { ...emptyProject(), entities: [rect], extruded: true };
checkMesh(p, 40000, [80, 50, 10]);
for (const [plane, bounds] of [['XY', [80, 50, 10]], ['XZ', [80, 10, 50]], ['YZ', [10, 80, 50]]]) checkMesh({ ...p, plane, entities: [rect, hole] }, (4000 - Math.PI * 36) * 10, bounds);
checkMesh({ ...p, entities: [{ ...hole, id: 'outer', a: 20 }, hole] }, Math.PI * (400 - 36) * 10, [40, 40, 10]);
checkMesh({ ...p, depth: 20 }, 80000, [80, 50, 20]);
// New Create / Modify operations: actual solid volumes and watertight export meshes.
const radial = { ...rect, x: 10, y: 0, a: 10, b: 30 };
checkMesh({ ...p, entities: [radial], operation: { kind: 'revolve', axis: 0, angle: 360 } }, Math.PI * 300 * 30, [40, 30, 40]);
checkMesh({ ...p, entities: [{ ...radial, x: 0 }], operation: { kind: 'revolve', axis: 0, angle: 180 } }, Math.PI * 100 * 30 / 2, [20, 30, 10]);
checkMesh({ ...p, entities: [{ ...radial, x: 0 }], operation: { kind: 'revolve', axis: 0, angle: 360 } }, Math.PI * 100 * 30, [20, 30, 20]);
checkMesh({ ...p, entities: [{ ...rect, x: -5, y: -5, a: 10, b: 10 }], operation: { kind: 'sweep', radius: 30, angle: 90 } }, 100 * Math.PI * 30 / 2, [35, 10, 35]);
const topRect = { ...rect, id: 'top', x: 100, y: 100, a: 40, b: 25 };
checkMesh({ ...p, entities: [rect, topRect], operation: { kind: 'loft', bottom: rect.id, top: topRect.id, aligned: true } }, 4000 * 10 * (1 + .5 + .25) / 3, [80, 50, 10]);
checkMesh({ ...p, entities: [rect, { ...hole, id: 'topCircle', a: 15 }], operation: { kind: 'loft', bottom: rect.id, top: 'topCircle', aligned: true } }, null, [80, 50, 10]);
checkMesh({ ...p, modifier: { kind: 'shell', size: 2 } }, 40000 - 76 * 46 * 8, [80, 50, 10]);
checkMesh({ ...p, modifier: { kind: 'chamfer', size: 2 } }, 4000 * 6 + 2 * (4000 * 2 - 260 * 2 * 2 / 2 + 4 * 2 * 2 * 2 / 3), [80, 50, 10]);
checkMesh({ ...p, modifier: { kind: 'fillet', size: 2 } }, null, [80, 50, 10]);
checkMesh({ ...p, entities: [{ ...hole, a: 20 }], modifier: { kind: 'shell', size: 2 } }, Math.PI * (400 * 10 - 324 * 8), [40, 40, 10], .003);
assert.throws(() => createCadGeometry({ ...p, operation: { kind: 'revolve', axis: 0, angle: 360 } }), /kanan sumbu/);
assert.throws(() => createCadGeometry({ ...p, modifier: { kind: 'shell', size: 26 } }), /tebal|Tebal/);
assert.throws(() => createCadGeometry({ ...p, entities: [rect, hole], modifier: { kind: 'fillet', size: 1 } }), /satu profil/);
assert.throws(() => createCadGeometry({ ...p, operation: { kind: 'sweep', radius: 5, angle: 90 } }), /Radius jalur/);
const savedRevolve = { ...p, entities: [radial], operation: { kind: 'revolve', axis: 0, angle: 270 } };
assert.deepEqual(validateProject(JSON.parse(JSON.stringify(savedRevolve))), savedRevolve);
const savedShell = { ...p, operation: { kind: 'extrude' }, modifier: { kind: 'shell', size: 2 } };
assert.deepEqual(validateProject(JSON.parse(JSON.stringify(savedShell))), savedShell);
assert.throws(() => validateProject({ ...savedRevolve, modifier: { kind: 'fillet', size: 1 } }), /Extrude/);
const lines = [
    { id: 'a', kind: 'line', x: 0, y: 0, a: 30, b: 0 },
    { id: 'b', kind: 'line', x: 30, y: 20, a: 30, b: 0 },
    { id: 'c', kind: 'line', x: 30, y: 20, a: 0, b: 20 },
    { id: 'd', kind: 'line', x: 0, y: 0, a: 0, b: 20 },
];
checkMesh({ ...p, entities: lines }, 6000, [30, 20, 10]);
assert.throws(() => sketchContours(lines.slice(0, 3)), /terbuka|tertutup/);
assert.throws(() => sketchContours([rect, { ...hole, x: 39 }]), /tumpang tindih/);
assert.throws(() => sketchContours([rect, { ...hole, x: 34 }]), /tumpang tindih/);
assert.throws(() => sketchContours([rect, { ...rect, id: 'copy' }]), /tumpang tindih/);
assert.throws(() => validateProject({ ...p, entities: [rect, rect] }), /tidak valid/);
assert.throws(() => validateProject({ ...p, depth: -10 }), /tidak valid/);
assert.throws(() => validateProject({ ...p, entities: [{ ...rect, x: NaN }] }), /tidak valid/);
assert.throws(() => validateProject({ ...p, entities: Array.from({ length: 101 }, (_, i) => ({ ...rect, id: String(i) })) }), /100 objek/);
assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p);
assert.notEqual(cadDraftKey('/index.html', 'student-a'), cadDraftKey('/index.html', 'student-b'));
assert.notEqual(cadDraftKey('/index.html', 'student-a'), cadDraftKey('/other/index.html', 'student-a'));
assert.match(sketchSvg(p), /width="100mm"/);
assert.match(sketchSvg(p), /height="70mm"/);
const exportedGeometry = createCadGeometry({ ...p, entities: [rect, hole] });
const material = new THREE.MeshBasicMaterial(), mesh = new THREE.Mesh(exportedGeometry, material);
mesh.updateMatrixWorld(true);
const bytes = new STLExporter().parse(mesh, { binary: true });
const reopened = new STLLoader().parse(bytes.buffer);
assert(Math.abs(volume(reopened) - (4000 - Math.PI * 36) * 10) < 2);
assert.equal(reopened.getAttribute('position').count, exportedGeometry.getAttribute('position').count);
exportedGeometry.dispose(); reopened.dispose(); material.dispose();
console.log('CAD checks passed: Extrude / Revolve / Sweep / Loft / Press Pull / Fillet / Chamfer / Shell volumes, closed meshes and consistent normals, modeling JSON round trip, snap, invalid profiles, student isolation, SVG and STL export/reopen.');
