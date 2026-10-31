import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
const source = await readFile(new URL('../app/components/cad-viewer.tsx', import.meta.url), 'utf8');
// Exercise the actual camera handler with an in-memory camera, without WebGL.
const handler = source.slice(source.indexOf('    function view('), source.indexOf('    return <div className="cad-viewer-shell"'))
  .replace('kind: string', 'kind');
assert.ok(source.includes('aria-label="Pandangan samping kanan"'));
for (const file of [null, new File(['test'], 'part.stl')]) {
  const state = { camera: new THREE.PerspectiveCamera(), root: new THREE.Group(), controls: { target: new THREE.Vector3(), update() {} }, fitDistance: () => 480 };
  const flags = { current: { spinning: true } };
  let spinning = true;
  const view = new Function('runtime','file','model','THREE','setSpinning','flags',handler + '; return view;')({current:state}, file, 'assembly', THREE, value => {spinning=value}, flags);
  state.root.rotation.y = 1;
  view('right');
  assert.deepEqual(state.camera.position.toArray(), [file ? 480 : 310, file ? 75 : 85, 0]);
  assert.deepEqual(state.controls.target.toArray(), [0, file ? 75 : 85, 0]);
  assert.equal(spinning, false); assert.equal(flags.current.spinning, false);
  if (file) assert.equal(state.root.rotation.y, 0);
  view('front'); assert.equal(state.camera.position.x, 0); assert.ok(state.camera.position.z > 0);
  view('top'); assert.equal(state.camera.position.x, 0); assert.ok(state.camera.position.y > state.controls.target.y);
}
console.log('Lulus: pandangan kanan dari sumbu +X, pusat dan jarak kamera sesuai model, rotasi berhenti, Depan/Atas tetap benar.');
