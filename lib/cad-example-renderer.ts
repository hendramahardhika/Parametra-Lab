import * as THREE from 'three';
import { createCadGeometry, entityPoints, sketchContours, type Point } from './cad-workbench';
import { exampleFrameProject, type CommandExample } from './cad-command-examples';

type V = [number, number, number];
export type ScreenPoint = { x: number; y: number };
export type DemoLine = { points: ScreenPoint[]; color: string; width: number; dash?: number[]; label?: string };
export type DemoFace = { points: ScreenPoint[]; color: string; edges: boolean[]; depth: number };
export type ExampleDrawing = { faces: DemoFace[]; grid: DemoLine[]; profiles: ScreenPoint[][]; selectedProfiles: boolean[]; references: DemoLine[]; highlights: ScreenPoint[][]; origin: ScreenPoint; target: ScreenPoint; cursor: ScreenPoint; drawProgress: number; profileSelected: boolean; referenceSelected: boolean; model: boolean };
export function prepareExampleDrawing(example: CommandExample) {
    const geometry = createCadGeometry(example.final), bounds = geometry.boundingBox!.clone(); geometry.dispose();
    const world = (x: number, y: number, z = 0): V => example.initial.plane === 'XZ' ? [x, -z, y] : example.initial.plane === 'YZ' ? [z, x, y] : [x, y, z];
    const profiles = example.command === 'loft' ? example.initial.entities.map((e, i) => entityPoints(e).map(p => world(p.x, p.y, i ? example.final.depth : 0))) : sketchContours(example.initial.entities).map(p => p.map(a => world(a.x, a.y)));
    profiles.flat().forEach(p => bounds.expandByPoint(new THREE.Vector3(...p)));
    const center = bounds.getCenter(new THREE.Vector3()), radius = Math.max(42, bounds.getSize(new THREE.Vector3()).length() / 2);
    return { example, world, profiles, center, radius };
}
export function exampleDrawing(prepared: ReturnType<typeof prepareExampleDrawing>, step: number, progress: number): ExampleDrawing {
    const { example, world, profiles, center, radius } = prepared;
    const t = Math.max(0, Math.min(1, progress));
    const creating = example.category === 'Create';
    const phase = creating ? step < 5 ? 0 : step === 5 ? Math.min(1, t * 1.6) : 1 : step === 0 ? 0 : step === 1 ? Math.min(1, t * 1.5) : 1;
    const tilt = example.command === 'loft' || example.command === 'sweep' ? Math.max(.65, phase) : example.command === 'extrude' && step >= 3 ? Math.max(.45, phase) : phase;
    const normal = example.initial.plane === 'XZ' ? new THREE.Vector3(0, -1, 0) : example.initial.plane === 'YZ' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const direction = normal.lerp(new THREE.Vector3(1.25, -1.6, 1.15).normalize(), tilt).normalize();
    const camera = new THREE.OrthographicCamera(-radius * 1.6, radius * 1.6, radius, -radius, .01, radius * 20);
    camera.up.copy(example.initial.plane === 'XY' ? new THREE.Vector3(0, 1, 0).lerp(new THREE.Vector3(0, 0, 1), tilt).normalize() : new THREE.Vector3(0, 0, 1));
    camera.position.copy(center).addScaledVector(direction, radius * 6); camera.lookAt(center); camera.updateMatrixWorld();
    const project = (p: V): ScreenPoint & { z: number } => { const v = new THREE.Vector3(...p).project(camera); return { x: (v.x + 1) * 400, y: (1 - v.y) * 250, z: v.z }; };
    const modelProject = exampleFrameProject(example, step, t), faces: DemoFace[] = [];
    if (modelProject) {
        const g = createCadGeometry(modelProject);
        try {
            const p = g.getAttribute('position');
            const meshFaces: { world: V[]; normal: THREE.Vector3; visible: boolean; keys: string[] }[] = [];
            const edgeMap = new Map<string, number[]>();
            const key = (v: V) => v.map(n => Math.round(n * 10000)).join(',');
            for (let i = 0; i < p.count; i += 3) {
                const vertices: V[] = [0, 1, 2].map(j => {
                    let z = p.getZ(i + j);
                    if (example.command === 'shell' && step === 5 && Math.abs(z - example.final.modifier!.size) < .0001) z = example.final.depth - (example.final.depth - z) * t;
                    return [p.getX(i + j), p.getY(i + j), z];
                });
                const a = new THREE.Vector3(...vertices[0]), b = new THREE.Vector3(...vertices[1]), c = new THREE.Vector3(...vertices[2]);
                const n = b.sub(a).cross(c.sub(a)).normalize();
                const keys = vertices.map((v, j) => [key(v), key(vertices[(j + 1) % 3])].sort().join('|'));
                const index = meshFaces.length;
                keys.forEach(k => edgeMap.set(k, [...(edgeMap.get(k) || []), index]));
                meshFaces.push({ world: vertices, normal: n, visible: n.dot(direction) > .000001, keys });
            }
            const light = new THREE.Vector3(-.3, -.6, 1).normalize();
            meshFaces.forEach((f, index) => {
                if (!f.visible) return;
                const points = f.world.map(project), shade = .66 + .29 * Math.max(0, f.normal.dot(light));
                const color = `rgb(${Math.round(123 * shade)},${Math.round(180 * shade)},${Math.round(215 * shade)})`;
                const edges = f.keys.map(k => { const adjacent = edgeMap.get(k)!.filter(j => j !== index); return !adjacent.length || adjacent.some(j => !meshFaces[j].visible || f.normal.dot(meshFaces[j].normal) < .8); });
                faces.push({ points, color, edges, depth: points.reduce((s, a) => s + a.z, 0) / 3 });
            });
            faces.sort((a, b) => b.depth - a.depth);
        } finally { g.dispose(); }
    }
    const grid: DemoLine[] = [];
    for (let i = -80; i <= 80; i += 10) {
        grid.push({ points: [project(world(i, -80)), project(world(i, 80))], color: '#dae7f2', width: .7 });
        grid.push({ points: [project(world(-80, i)), project(world(80, i))], color: '#dae7f2', width: .7 });
    }
    grid.push({ points: [project(world(-80, 0)), project(world(80, 0))], color: '#e0a0a3', width: 1 });
    grid.push({ points: [project(world(0, -80)), project(world(0, 80))], color: '#9fc5ad', width: 1 });
    const projectedProfiles = profiles.map(p => p.map(project));
    const references: DemoLine[] = [], highlights: ScreenPoint[][] = [];
    const referenceSelected = step > 3 || step === 3 && t >= .45, profileSelected = step > 2 || step === 2 && t >= .45;
    let targetWorld: V = world(0, 0);
    if (example.command === 'revolve') {
        references.push({ points: [project(world(0, -8)), project(world(0, 48))], color: referenceSelected ? '#f68a21' : '#278bb5', width: referenceSelected ? 4 : 2, dash: [8, 5], label: 'Axis / sumbu' });
        targetWorld = step === 3 ? world(0, 20) : world(9, 19);
    } else if (example.command === 'sweep') {
        const path = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI / 2; return project(world(38 * (1 - Math.cos(a)), 0, 38 * Math.sin(a))); });
        references.push({ points: path, color: referenceSelected ? '#f68a21' : '#278bb5', width: referenceSelected ? 4 : 2, dash: [7, 5], label: 'Jalur busur' });
        targetWorld = step === 3 ? world(38 * (1 - Math.cos(Math.PI / 4)), 0, 38 * Math.sin(Math.PI / 4)) : world(0, 0);
    } else if (example.command === 'loft') {
        references.push({ points: [project(world(0, 0)), project(world(0, 0, 45))], color: '#73a9c9', width: 1.5, dash: [5, 5], label: 'Jarak 45 mm' });
        targetWorld = world(0, 0, step === 3 ? 45 : 0);
        if (referenceSelected) highlights.push(projectedProfiles[1]);
    } else if (example.category === 'Modify') {
        const shape = profiles[0];
        const top = shape.map(p => project([p[0], p[1], 20]));
        if (referenceSelected && step < 5) {
            highlights.push(top);
            if (example.command === 'fillet' || example.command === 'chamfer') highlights.push(projectedProfiles[0]);
        }
        targetWorld = example.command === 'fillet' || example.command === 'chamfer' ? [-30, 0, 20] : [0, 0, 20];
        if (example.command === 'presspull') references.push({ points: [project([0, 0, 20]), project([0, 0, 36])], color: referenceSelected ? '#f68a21' : '#278bb5', width: 3, dash: [6, 4], label: 'Tarik muka' });
    } else {
        references.push({ points: [project(world(0, 0)), project(world(0, 0, 24))], color: referenceSelected ? '#f68a21' : '#278bb5', width: 2.5, dash: [6, 4], label: 'Arah extrude' });
        targetWorld = step === 3 ? world(0, 0, 20) : world(0, 10);
    }
    const target = project(targetWorld), drawProgress = step === 0 ? t : 1;
    const path = projectedProfiles[0], lengths = path.map((p, i) => Math.hypot(p.x - path[(i + 1) % path.length].x, p.y - path[(i + 1) % path.length].y));
    let trace = lengths.reduce((a, b) => a + b, 0) * drawProgress, index = 0;
    while (index < lengths.length - 1 && trace > lengths[index]) { trace -= lengths[index]; index++; }
    const part = Math.min(1, trace / Math.max(.0001, lengths[index])), a = path[index], b = path[(index + 1) % path.length];
    const cursor = step === 0 ? { x: a.x + (b.x - a.x) * part, y: a.y + (b.y - a.y) * part } : step === 1 && creating || step === 2 && !creating ? { x: 132, y: 55 } : step === 4 ? { x: 693, y: 165 } : step === 5 ? { x: 692, y: 390 } : target;
    const selectedProfiles = projectedProfiles.map((_, i) => profileSelected && (example.command !== 'loft' || i === 0 || referenceSelected));
    return { faces, grid, profiles: projectedProfiles, selectedProfiles, references, highlights, origin: project(world(0, 0)), target, cursor, drawProgress, profileSelected, referenceSelected, model: !!modelProject };
}
function path(ctx: CanvasRenderingContext2D, points: ScreenPoint[], close = false) {
    if (!points.length) return;
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); if (close) ctx.closePath();
}
export function paintExample(ctx: CanvasRenderingContext2D, drawing: ExampleDrawing, step: number, progress: number) {
    ctx.clearRect(0, 0, 800, 500); ctx.fillStyle = '#f8fbff'; ctx.fillRect(0, 0, 800, 500);
    drawing.grid.forEach(line => { path(ctx, line.points); ctx.strokeStyle = line.color; ctx.lineWidth = line.width; ctx.stroke(); });
    if (!drawing.model && drawing.profileSelected) {
        ctx.beginPath();
        drawing.profiles.filter((_, i) => drawing.selectedProfiles[i]).forEach(points => { ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath(); });
        ctx.fillStyle = '#2584df25'; ctx.fill('evenodd');
    }
    drawing.faces.forEach(f => {
        path(ctx, f.points, true); ctx.fillStyle = f.color; ctx.fill();
        f.edges.forEach((edge, i) => { if (!edge) return; path(ctx, [f.points[i], f.points[(i + 1) % 3]]); ctx.lineWidth = 1.05; ctx.strokeStyle = '#325474'; ctx.stroke(); });
    });
    if (!drawing.model || step < 2) drawing.profiles.forEach((points, profileIndex) => {
        const vertices = [...points, points[0]], lengths = vertices.slice(1).map((p, i) => Math.hypot(p.x - vertices[i].x, p.y - vertices[i].y));
        let remaining = lengths.reduce((s, v) => s + v, 0) * drawing.drawProgress;
        ctx.beginPath(); ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 0; i < lengths.length && remaining > 0; i++) { const fraction = Math.min(1, remaining / Math.max(.0001, lengths[i])); ctx.lineTo(vertices[i].x + (vertices[i + 1].x - vertices[i].x) * fraction, vertices[i].y + (vertices[i + 1].y - vertices[i].y) * fraction); remaining -= lengths[i]; }
        ctx.strokeStyle = drawing.selectedProfiles[profileIndex] ? '#136ad2' : '#295f94'; ctx.lineWidth = drawing.selectedProfiles[profileIndex] ? 3 : 2; ctx.stroke();
    });
    if (step < 6) drawing.references.forEach(line => {
        path(ctx, line.points); ctx.strokeStyle = line.color; ctx.lineWidth = line.width; ctx.setLineDash(line.dash || []); ctx.stroke(); ctx.setLineDash([]);
        if (line.label && step >= 3 && step < 5) { const p = line.points[Math.floor(line.points.length / 2)]; ctx.font = '12px Segoe UI, Arial'; ctx.fillStyle = '#b45d16'; ctx.fillText(line.label, p.x + 10, p.y - 10); }
    });
    drawing.highlights.forEach(points => { path(ctx, points, true); ctx.strokeStyle = '#f58224'; ctx.lineWidth = 4; ctx.stroke(); if (drawing.highlights.length === 1) { ctx.fillStyle = '#ff9c2b30'; ctx.fill(); } });
    if (!drawing.model) { ctx.beginPath(); ctx.arc(drawing.origin.x, drawing.origin.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#ef8625'; ctx.fill(); }
}
