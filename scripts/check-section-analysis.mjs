import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const rootPath = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(rootPath, '.sites-runtime/section-check');
await mkdir(dir, { recursive: true });
const output = path.join(dir, 'section.mjs');
await build({ absWorkingDir: rootPath, entryPoints: ['lib/section-analysis.ts'], outfile: output, bundle: true, format: 'esm', platform: 'node', external: ['three'] });
const { sectionNormal, createSectionAnalysis } = await import(pathToFileURL(output).href);
const expected = { XY: [0, -1, 0], XZ: [0, 0, 1], YZ: [-1, 0, 0] };
for (const axis of Object.keys(expected)) assert.ok(sectionNormal(axis, 'z').distanceTo(new THREE.Vector3(...expected[axis])) < 1e-10);
const models = JSON.parse(await readFile(path.join(rootPath, 'lib/part-model-data.generated.json'), 'utf8'));
for (const model of models) {
  const bytes = Buffer.from(model.base64, 'base64');
  const geometry = new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const before = Array.from(geometry.getAttribute('position').array);
  let originalDisposed = false;
  geometry.addEventListener('dispose', () => { originalDisposed = true; });
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  const scene = new THREE.Scene(), root = new THREE.Group(), normalized = new THREE.Group();
  scene.add(root); root.add(normalized); normalized.add(mesh);
  const box = new THREE.Box3().setFromObject(mesh), size = box.getSize(new THREE.Vector3());
  mesh.position.sub(box.getCenter(new THREE.Vector3()));
  normalized.scale.setScalar(145 / Math.max(size.x, size.y, size.z)); normalized.position.y = 75;
  const section = createSectionAnalysis(root, scene, 'z');
  assert.equal(section.helpers.visible, false);
  for (const axis of ['XY', 'XZ', 'YZ']) {
    section.update(axis, false);
    assert.equal(material.clippingPlanes[0], section.plane);
    assert.ok(Math.abs(section.plane.distanceToPoint(new THREE.Vector3(0, 75, 0))) < 1e-8);
    let positive = 0, negative = 0;
    const point = new THREE.Vector3();
    for (let i = 0; i < geometry.getAttribute('position').count; i++) {
      point.fromBufferAttribute(geometry.getAttribute('position'), i).applyMatrix4(mesh.matrixWorld);
      const distance = section.plane.distanceToPoint(point);
      if (distance > 1e-6) positive++; if (distance < -1e-6) negative++;
    }
    assert.ok(positive && negative, `${model.source}: ${axis} must intersect the model`);
    const normal = section.plane.normal.clone();
    section.update(axis, true);
    assert.ok(section.plane.normal.dot(normal) < -.999999);
    assert.equal(section.cap.material.stencilFunc, THREE.NotEqualStencilFunc);
    assert.equal(section.helpers.children.length, 3, 'Two winding passes plus a cap');
    root.rotation.y = .8; section.update(axis, false);
    assert.ok(section.plane.normal.distanceTo(sectionNormal(axis, 'z').applyQuaternion(root.quaternion)) < 1e-8);
    root.rotation.y = 0;
  }
  section.update('none', false);
  assert.equal(material.clippingPlanes, null);
  assert.equal(section.helpers.visible, false);
  section.dispose();
  assert.equal(scene.children.includes(section.helpers), false);
  assert.equal(mesh.renderOrder, 0);
  assert.equal(originalDisposed, false, 'Helper cleanup must not dispose shared original geometry');
  assert.deepEqual(Array.from(geometry.getAttribute('position').array), before);
  geometry.dispose(); material.dispose();
  console.log(`${model.source}: XY/XZ/YZ, balik sisi, rotasi, pemulihan utuh, data asli aman.`);
}
console.log('Lulus pemeriksaan geometri dan konfigurasi stencil; bukan pengujian hasil render GPU.');
