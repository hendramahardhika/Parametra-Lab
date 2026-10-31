import * as THREE from 'three';

export type SectionAxis = 'none' | 'XY' | 'XZ' | 'YZ';

// STL does not retain Fusion origin metadata. Cut through the centered preview,
// keeping the original model axes even when Z-up is mapped to the viewer's Y-up.
export function sectionNormal(axis: Exclude<SectionAxis, 'none'>, upAxis: 'y' | 'z', flipped = false) {
  const n = axis === 'XY' ? new THREE.Vector3(0, 0, 1) : axis === 'XZ' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  if (upAxis === 'z') n.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  return n.multiplyScalar(flipped ? 1 : -1);
}

// Stencil caps follow Three.js's official clipping-stencil technique. Original
// geometry is shared read-only; disposal here owns only proxy materials/cap.
export function createSectionAnalysis(root: THREE.Group, scene: THREE.Scene, upAxis: 'y' | 'z') {
  const plane = new THREE.Plane();
  const helpers = new THREE.Group();
  scene.add(helpers);
  const originals: { material: THREE.Material; planes: THREE.Plane[] | null; shadows: boolean }[] = [];
  const orders: { object: THREE.Object3D; order: number }[] = [];
  const proxies: { source: THREE.Mesh; proxy: THREE.Mesh }[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
    orders.push({ object, order: object.renderOrder });
    object.renderOrder = object instanceof THREE.Mesh ? 3 : 4;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!seen.has(material)) { originals.push({ material, planes: material.clippingPlanes, shadows: material.clipShadows }); seen.add(material); }
    }
    if (!(object instanceof THREE.Mesh)) return;
    for (const side of [THREE.BackSide, THREE.FrontSide]) {
      const op = side === THREE.BackSide ? THREE.IncrementWrapStencilOp : THREE.DecrementWrapStencilOp;
      const material = new THREE.MeshBasicMaterial({
        side, depthWrite: false, depthTest: false, colorWrite: false,
        clippingPlanes: [plane], stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: op, stencilZFail: op, stencilZPass: op,
      });
      const proxy = new THREE.Mesh(object.geometry, material);
      proxy.matrixAutoUpdate = false;
      proxy.renderOrder = 1;
      helpers.add(proxy);
      proxies.push({ source: object, proxy });
    }
  });
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
    vertexShader: 'varying vec2 sectionUv; void main(){sectionUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 sectionUv; void main(){float band=step(0.16,fract((sectionUv.x+sectionUv.y)*90.0));vec3 color=mix(vec3(0.08,0.30,0.36),vec3(0.38,0.86,0.93),band);gl_FragColor=vec4(color,1.0);}',
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  cap.renderOrder = 2;
  cap.onAfterRender = renderer => renderer.clearStencil();
  helpers.add(cap);
  helpers.visible = false;
  let active = false;
  const center = new THREE.Vector3(), normal = new THREE.Vector3(), rotation = new THREE.Quaternion();
  return {
    plane, helpers, cap,
    update(axis: SectionAxis, flipped: boolean) {
      const enabled = axis !== 'none';
      if (enabled !== active) {
        for (const { material, planes, shadows } of originals) {
          material.clippingPlanes = enabled ? [plane] : planes;
          material.clipShadows = enabled || shadows;
          material.needsUpdate = true;
        }
        helpers.visible = enabled;
        active = enabled;
      }
      if (axis === 'none') return;
      root.updateWorldMatrix(true, true);
      root.getWorldQuaternion(rotation);
      normal.copy(sectionNormal(axis, upAxis, flipped)).applyQuaternion(rotation);
      center.set(0, 75, 0).applyMatrix4(root.matrixWorld);
      plane.setFromNormalAndCoplanarPoint(normal, center);
      for (const { source, proxy } of proxies) proxy.matrix.copy(source.matrixWorld);
      cap.position.copy(center);
      cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    },
    dispose() {
      for (const { material, planes, shadows } of originals) { material.clippingPlanes = planes; material.clipShadows = shadows; material.needsUpdate = true; }
      for (const { object, order } of orders) object.renderOrder = order;
      for (const { proxy } of proxies) (proxy.material as THREE.Material).dispose();
      cap.geometry.dispose(); cap.material.dispose();
      scene.remove(helpers);
    },
  };
}
