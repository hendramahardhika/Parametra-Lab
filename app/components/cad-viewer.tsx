"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { RotateCcw, Maximize, Play, Pause, Layers } from "lucide-react";
import { SectionAnalysisMenu } from './section-analysis-menu';
import { createSectionAnalysis, type SectionAxis } from '@/lib/section-analysis';
export type ModelKind = "assembly" | "base" | "arm" | "pin";
type Props = {
    model?: ModelKind;
    height?: number;
    file?: File | null;
    upAxis?: 'y' | 'z';
    phase?: number;
    length?: number;
    angle?: number;
    onError?: (message: string) => void;
};
function shapeWithHoles(shape: THREE.Shape, holes: [
    number,
    number,
    number
][], depth: number) { holes.forEach(([x, y, r]) => { const h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); shape.holes.push(h); }); return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 40 }); }
function circle(r: number) { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; }
function capsule(r: number, length: number) { const s = new THREE.Shape(); s.moveTo(-r, 0); s.absarc(0, 0, r, Math.PI, 0, false); s.lineTo(r, length); s.absarc(0, length, r, 0, Math.PI, false); s.closePath(); return s; }
function mesh(geo: THREE.BufferGeometry, color: string) { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, metalness: .48, roughness: .33 })); m.castShadow = true; m.receiveShadow = true; const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), new THREE.LineBasicMaterial({ color: 0x385367, transparent: true, opacity: .35 })); m.add(edges); return m; }
export default function CadViewer({ model = "assembly", height = 360, file = null, upAxis = 'y', phase = 5, length = 120, angle = 25, onError }: Props) {
    const mount = useRef<HTMLDivElement>(null), runtime = useRef<{
        camera: THREE.PerspectiveCamera;
        controls: OrbitControls;
        root: THREE.Group;
        arm: THREE.Group;
        pin: THREE.Object3D;
        renderer: THREE.WebGLRenderer;
        fitDistance: () => number;
    } | null>(null);
    const [spinning, setSpinning] = useState(false), [exploded, setExploded] = useState(false), [error, setError] = useState("");
    const [section, setSection] = useState<SectionAxis>('none'), [flipped, setFlipped] = useState(false);
    const flags = useRef({ spinning, exploded, angle, section, flipped });
    flags.current = { spinning, exploded, angle, section, flipped };
    useEffect(() => {
        const host = mount.current;
        if (!host)
            return;
        let live = true, frame = 0;
        let analysis: ReturnType<typeof createSectionAnalysis> | null = null;
        let renderer: THREE.WebGLRenderer;
        setError("");
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true });
            renderer.localClippingEnabled = true;
        }
        catch {
            setError("Tampilan 3D tidak tersedia pada perangkat ini. Materi dan jobsheet tetap dapat digunakan.");
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
        renderer.setSize(host.clientWidth, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x14273d, 1);
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-label", "Model 3D interaktif. Seret untuk memutar dan gulir untuk zoom.");
        renderer.domElement.setAttribute("role", "img");
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x14273d, 400, 1100);
        const camera = new THREE.PerspectiveCamera(35, host.clientWidth / height, .1, 2000);
        camera.position.set(280, 200, 350);
        const controls = new OrbitControls(camera, renderer.domElement);
        let importedRadius = 0;
        const fitDistance = () => {
            const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
            const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
            return importedRadius ? importedRadius / Math.sin(Math.min(vertical, horizontal)) * 1.25 : 450;
        };
        const fitImported = () => {
            if (!importedRadius) return;
            const distance = fitDistance();
            camera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);
            controls.maxDistance = Math.max(650, distance * 3);
            camera.far = Math.max(2000, distance * 5);
            camera.updateProjectionMatrix();
            controls.update();
        };
        controls.target.set(0, 85, 0);
        controls.enableDamping = true;
        controls.minDistance = 80;
        controls.maxDistance = 650;
        controls.maxPolarAngle = Math.PI * .85;
        controls.update();
        scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x415466, 3));
        const key = new THREE.DirectionalLight(0xffffff, 5);
        key.position.set(100, 240, 100);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        Object.assign(key.shadow.camera, { left: -220, right: 220, top: 250, bottom: -180, far: 700 });
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xc4ea9c, 2);
        rim.position.set(-150, 100, -160);
        scene.add(rim);
        const grid = new THREE.GridHelper(600, 30, 0x40607a, 0x28435b);
        grid.position.y = -1;
        scene.add(grid);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.ShadowMaterial({ opacity: .22 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.y = -.5;
        scene.add(ground);
        const root = new THREE.Group();
        scene.add(root);
        const base = new THREE.Group();
        const disc = mesh(shapeWithHoles(circle(48), phase >= 4 ? [[32, 0, 4], [-32, 0, 4], [0, 32, 4], [0, -32, 4]] : [], phase < 2 ? 1 : 12), "#b5c3ce");
        disc.rotation.x = -Math.PI / 2;
        base.add(disc);
        if (phase >= 3) {
            [-17, 9].forEach(z => { const g = shapeWithHoles(capsule(15, 42), phase >= 4 ? [[0, 42, 6]] : [], 8); const m = mesh(g, "#b5c3ce"); m.position.set(0, 27, z); base.add(m); });
        }
        root.add(base);
        const arm = new THREE.Group();
        const armMesh = mesh(shapeWithHoles(capsule(13, length), [[0, 0, 6], [0, length, 6]], 10), "#d5ee9c");
        armMesh.position.z = -5;
        arm.add(armMesh);
        arm.position.set(0, 69, 0);
        arm.rotation.z = -.65;
        root.add(arm);
        const pin = mesh(new THREE.CylinderGeometry(6, 6, 52, 48), "#c2cbd3");
        pin.rotation.x = Math.PI / 2;
        pin.position.set(0, 69, 0);
        const cap = mesh(new THREE.CylinderGeometry(10, 10, 5, 48), "#879bab");
        cap.position.y = 28;
        pin.add(cap);
        root.add(pin);
        if (model === "base") {
            arm.visible = false;
            pin.visible = false;
            controls.target.set(0, 32, 0);
            camera.position.set(165, 115, 180);
        }
        else if (model === "arm") {
            base.visible = false;
            pin.visible = false;
            arm.position.set(0, 15, 0);
            arm.rotation.z = -.45;
            controls.target.set(20, 70, 0);
            camera.position.set(180, 120, 240);
        }
        else if (model === "pin") {
            base.visible = false;
            arm.visible = false;
            pin.position.set(0, 22, 0);
            controls.target.set(0, 20, 0);
            camera.position.set(100, 90, 140);
        }
        runtime.current = { camera, controls, root, arm, pin, renderer, fitDistance };
        const resize = new ResizeObserver(() => { if (!live)
            return; const w = host.clientWidth; if (w > 0) {
            renderer.setSize(w, height);
            camera.aspect = w / height;
            camera.updateProjectionMatrix();
            fitImported();
        } });
        resize.observe(host);
        if (file) {
            root.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
                o.geometry.dispose();
                const materials = Array.isArray(o.material) ? o.material : [o.material];
                materials.forEach(m => m.dispose());
            } });
            root.clear();
            file.arrayBuffer().then(bytes => { if (!live)
                return; let obj: THREE.Object3D; if (file.name.toLowerCase().endsWith('.stl')) {
                const geo = new STLLoader().parse(bytes);
                geo.computeVertexNormals();
                obj = mesh(geo, "#d4ebad");
            }
            else if (file.name.toLowerCase().endsWith('.obj')) {
                obj = new OBJLoader().parse(new TextDecoder().decode(bytes));
                obj.traverse(child => { if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: 0xc9ddaf, metalness: .25, roughness: .48 });
                    child.castShadow = true;
                } });
            }
            else
                throw new Error("Pratinjau langsung mendukung STL dan OBJ. Gunakan tautan Fusion untuk F3D/F3Z."); if (upAxis === 'z') obj.rotation.x = -Math.PI / 2; const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()); const max = Math.max(size.x, size.y, size.z); if (!Number.isFinite(max) || max <= 0)
                throw new Error("Geometri file kosong atau tidak valid."); const center = box.getCenter(new THREE.Vector3()); obj.position.sub(center); const normalized = new THREE.Group(); normalized.add(obj); normalized.scale.setScalar(145 / max); normalized.position.y = 75; root.add(normalized); importedRadius = size.length() * .5 * 145 / max; controls.target.set(0, 75, 0); camera.position.set(280, 200, 350); fitImported(); analysis = createSectionAnalysis(root, scene, upAxis); }).catch(e => { if (live) {
                setError(e.message);
                onError?.(e.message);
            } });
        }
        const clock = new THREE.Clock();
        const tick = () => { if (!live)
            return; const t = clock.getElapsedTime(); if (flags.current.spinning && (model !== "assembly" || !!file))
            root.rotation.y += .006;
        else if (!file && model === "assembly")
            arm.rotation.z = flags.current.spinning ? -.55 + Math.sin(t) * .6 : -THREE.MathUtils.degToRad(flags.current.angle); if (model === "assembly" && !file) {
            const e = flags.current.exploded ? 1 : 0;
            arm.position.z = THREE.MathUtils.lerp(arm.position.z, 38 * e, .08);
            pin.position.z = THREE.MathUtils.lerp(pin.position.z, 80 * e, .08);
        } controls.update(); analysis?.update(flags.current.section, flags.current.flipped); renderer.render(scene, camera); frame = requestAnimationFrame(tick); };
        tick();
        return () => { live = false; cancelAnimationFrame(frame); resize.disconnect(); controls.dispose(); analysis?.dispose(); scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
            o.geometry?.dispose();
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach(m => m.dispose());
        } }); renderer.dispose(); renderer.domElement.remove(); runtime.current = null; };
    }, [model, height, file, phase, length, upAxis]);
    function view(kind: string) { const r = runtime.current; if (!r)
            return; const center = file ? 75 : model === "assembly" ? 85 : model === "pin" ? 20 : 55; r.controls.target.set(0, center, 0); if (kind === "zoom-in" || kind === "zoom-out") {
        r.camera.position.sub(r.controls.target).multiplyScalar(kind === "zoom-in" ? .8 : 1.25).add(r.controls.target);
        r.controls.update();
        return;
    }
    setSpinning(false);
    flags.current.spinning = false;
    if (file) {
        r.root.rotation.y = 0;
        const distance = r.fitDistance();
        if (kind === "front") r.camera.position.set(0, center, distance);
        else if (kind === "top") r.camera.position.set(0, center + distance, .01);
        else if (kind === "right") r.camera.position.set(distance, center, 0);
        else r.camera.position.copy(new THREE.Vector3(280, 125, 350).normalize().multiplyScalar(distance).add(r.controls.target));
        r.controls.update();
        return;
    } if (kind === "front")
        r.camera.position.set(0, center, 310);
    else if (kind === "top")
        r.camera.position.set(0, 350, .01);
    else if (kind === "right")
        r.camera.position.set(310, center, 0);
    else
        r.camera.position.set(280, 200, 350); r.controls.update(); }
    return <div className="cad-viewer-shell"><div className="viewer" style={{ height }}><div ref={mount} style={{ height }}/><span className="viewer-label">{file ? file.name : "MODEL LATIHAN · " + model.toUpperCase()}</span><span className="viewer-note">Seret untuk memutar · Gulir untuk zoom</span>{error && <div className="absolute inset-0 bg-[#14273d] flex items-center"><p className="viewer-error">{error}</p></div>}<div className="viewer-tools"><button onClick={() => setSpinning(!spinning)} aria-pressed={spinning} aria-label={spinning ? "Jeda gerak" : "Putar gerak"}>{spinning ? <Pause size={15}/> : <Play size={15}/>}</button><button onClick={() => view("zoom-in")} aria-label="Perbesar model">+</button><button onClick={() => view("zoom-out")} aria-label="Perkecil model">−</button><button onClick={() => view("front")}>Depan</button><button onClick={() => view("top")}>Atas</button><button onClick={() => view("right")} aria-label="Pandangan samping kanan" title="Pandangan samping kanan">Samping</button><button onClick={() => view("iso")} aria-label="Reset tampilan"><RotateCcw size={15}/></button>{model === "assembly" && !file && <button aria-pressed={exploded} onClick={() => setExploded(!exploded)} className="flex items-center gap-1"><Layers size={14}/>Urai</button>}{file && <SectionAnalysisMenu section={section} flipped={flipped} onSectionChange={setSection} onFlip={() => setFlipped(!flipped)}/>}<button aria-label="Layar penuh" onClick={() => { const el = mount.current?.closest('.cad-viewer-shell'); if (document.fullscreenElement)
        void document.exitFullscreen();
    else
        void el?.requestFullscreen?.(); }}><Maximize size={15}/></button></div></div></div>;
}
