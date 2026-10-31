"use client";
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export default function WorkbenchView({ geometry }: { geometry: THREE.BufferGeometry }) {
    const mount = useRef<HTMLDivElement>(null);
    const runtime = useRef<{ view: (name: string) => void; zoom: (factor: number) => void } | null>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const host = mount.current;
        if (!host) return;
        setError('');
        let renderer: THREE.WebGLRenderer;
        try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
        catch { setError('Perangkat ini belum dapat menampilkan WebGL. Sketch tetap bisa diedit dan hasil dapat diunduh sebagai STL.'); return; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
        renderer.setClearColor(0xf3f7fc);
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-label', 'Model hasil Create dan Modify. Seret untuk memutar; gulir untuk zoom; tombol kanan untuk menggeser.');
        renderer.domElement.setAttribute('role', 'img');
        const scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xffffff, 0x7790a4, 2.6));
        const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(100, -80, 200); scene.add(sun);
        const material = new THREE.MeshStandardMaterial({ color: 0x7aa8c6, roughness: .38, metalness: .22 });
        const solid = new THREE.Mesh(geometry, material); scene.add(solid);
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 25);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x264667 });
        solid.add(new THREE.LineSegments(edgesGeometry, edgesMaterial));
        const box = new THREE.Box3().setFromObject(solid), center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()), radius = Math.max(size.length() / 2, 1);
        const grid = new THREE.GridHelper(Math.max(200, radius * 5), 40, 0xb9cce0, 0xe0e9f3);
        grid.rotation.x = Math.PI / 2; grid.position.set(center.x, center.y, box.min.z - .05); scene.add(grid);
        const camera = new THREE.OrthographicCamera(-100, 100, 100, -100, .01, radius * 30 + 1000);
        camera.up.set(0, 0, 1);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.minZoom = .1; controls.maxZoom = 50; controls.target.copy(center);
        let frame = 0;
        const resize = () => {
            const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1), aspect = width / height;
            const span = radius * 1.35 / Math.min(1, aspect);
            renderer.setSize(width, height); camera.left = -span * aspect; camera.right = span * aspect; camera.top = span; camera.bottom = -span; camera.updateProjectionMatrix();
        };
        const view = (name: string) => {
            const direction = name === 'Depan' ? new THREE.Vector3(0, -1, 0) : name === 'Atas' ? new THREE.Vector3(0, 0, 1) : name === 'Samping' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(1, -1.3, 1);
            camera.up.set(0, name === 'Atas' ? 1 : 0, name === 'Atas' ? 0 : 1);
            camera.position.copy(center).addScaledVector(direction.normalize(), radius * 4 + 10); controls.target.copy(center); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update();
        };
        runtime.current = { view, zoom: factor => { camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, .1, 50); camera.updateProjectionMatrix(); } };
        resize(); view('Iso');
        const observer = new ResizeObserver(resize); observer.observe(host);
        const draw = () => { frame = requestAnimationFrame(draw); controls.update(); renderer.render(scene, camera); }; draw();
        const lost = (e: Event) => { e.preventDefault(); setError('Koneksi grafis terputus. Kembali ke Sketch, lalu buka Model 3D lagi.'); };
        renderer.domElement.addEventListener('webglcontextlost', lost);
        return () => {
            cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); edgesGeometry.dispose(); edgesMaterial.dispose(); material.dispose(); grid.geometry.dispose();
            (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach(m => m.dispose());
            renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.dispose(); renderer.domElement.remove(); runtime.current = null;
        };
    }, [geometry]);
    return <div className="cad-model"><div ref={mount} className="cad-model-canvas"/>{error && <div className="cad-render-error" role="alert">{error}</div>}<div className="cad-view-badge"><span>MODEL 3D</span><b>Z ↑</b></div><div className="cad-canvas-controls"><button title="Perbesar" aria-label="Perbesar model" onClick={() => runtime.current?.zoom(1.25)}><ZoomIn size={17}/></button><button title="Perkecil" aria-label="Perkecil model" onClick={() => runtime.current?.zoom(.8)}><ZoomOut size={17}/></button>{['Depan', 'Atas', 'Samping'].map(v => <button key={v} onClick={() => runtime.current?.view(v)}>{v}</button>)}<button title="Pandangan isometrik" aria-label="Pandangan isometrik" onClick={() => runtime.current?.view('Iso')}><RotateCcw size={17}/></button></div></div>;
}
