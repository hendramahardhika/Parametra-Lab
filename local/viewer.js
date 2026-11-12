// Orthographic STL viewer. Section planes stay fixed in the model's XYZ coordinates.
function modelViewer(canvas) {
  const ctx = canvas.getContext('2d');
  const axes = { XY: 2, XZ: 1, YZ: 0 };
  const palette = Array.from({ length: 256 }, (_, i) => {
    const light = i / 255;
    return 'rgb(' + [64 + 155 * light, 77 + 157 * light, 53 + 136 * light].map(Math.round).join(',') + ')';
  });
  const tile = document.createElement('canvas');
  tile.width = tile.height = 8;
  const ink = tile.getContext('2d');
  ink.fillStyle = '#8ce7ed';
  ink.fillRect(0, 0, 8, 8);
  ink.strokeStyle = '#277888';
  ink.beginPath();
  for (const x of [-8, 0, 8]) { ink.moveTo(x, 8); ink.lineTo(x + 8, 0); }
  ink.stroke();
  const hatch = ctx.createPattern(tile, 'repeat');
  let vertices = [], faces = [], points = [], surface = [], projected = [];
  let cap = null, axis = null, toward = 1, flipped = false;
  let yaw, pitch, zoom, playing = false, previousTime = null, frame = 0, drag = null;

  function isometric() { yaw = -0.55; pitch = 0.38; zoom = 1; }
  isometric();

  function load(base64) {
    playing = false; previousTime = null; drag = null;
    axis = null; flipped = false; cap = null;
    isometric();
    vertices = []; faces = [];
    if (base64) {
      const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
      const data = new DataView(bytes.buffer);
      const count = data.getUint32(80, true);
      if (!count || 84 + 50 * count !== bytes.length) throw Error('STL tidak valid');
      const index = new Map(), low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < count; i++) {
        const ids = [];
        for (let j = 0; j < 3; j++) {
          const offset = 96 + 50 * i + 12 * j;
          const p = [0, 1, 2].map(k => data.getFloat32(offset + 4 * k, true));
          const key = p.join(',');
          if (!index.has(key)) {
            index.set(key, vertices.length); vertices.push(p);
            for (let k = 0; k < 3; k++) { low[k] = Math.min(low[k], p[k]); high[k] = Math.max(high[k], p[k]); }
          }
          ids.push(index.get(key));
        }
        const [a, b, c] = ids.map(id => vertices[id]);
        const ab = b.map((n,k) => n-a[k]), ac = c.map((n,k) => n-a[k]);
        const normal = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
        const len = Math.hypot(...normal);
        if (len) faces.push({ ids, normal: normal.map(n => n/len), depth: 0, order: i });
      }
      const center = low.map((v,k) => (v + high[k])/2);
      let radius = 1e-12;
      for (const p of vertices) {
        for (let k = 0; k < 3; k++) p[k] -= center[k];
        radius = Math.max(radius, Math.hypot(...p));
      }
      for (const p of vertices) for (let k = 0; k < 3; k++) p[k] /= radius;
    }
    rebuildSection();
  }

  // A tiny offset avoids slicing exactly along coplanar facets at the model midpoint.
  const offset = 1e-9;
  function rebuildSection() {
    points = vertices; surface = faces.slice(); cap = null;
    if (axis !== null) {
      points = vertices.slice(); surface = []; cap = new Path2D();
      const intersections = new Map(), side = flipped ? -toward : toward;
      const u = (axis + 1) % 3, v = (axis + 2) % 3;
      function intersection(i, j) {
        const key = Math.min(i,j) + ':' + Math.max(i,j);
        if (intersections.has(key)) return intersections.get(key);
        const a = vertices[i], b = vertices[j], t = (offset - a[axis]) / (b[axis] - a[axis]);
        const id = points.length;
        points.push(a.map((x,k) => x + t * (b[k] - x)));
        intersections.set(key, id);
        return id;
      }
      for (const face of faces) {
        const ids = [], crossings = [];
        for (let n = 0; n < 3; n++) {
          const i = face.ids[n], j = face.ids[(n+1)%3];
          const inside = (vertices[i][axis] - offset) * side <= 0;
          if (inside) ids.push(i);
          if (inside !== ((vertices[j][axis] - offset) * side <= 0)) {
            const id = intersection(i,j); ids.push(id); crossings.push(id);
          }
        }
        if (ids.length >= 3) surface.push({ ids, normal: face.normal, depth: 0, order: face.order });
        // The parity of these edge fans fills closed contours and leaves bores open.
        if (crossings.length === 2) {
          const [a,b] = crossings.map(id => points[id]);
          cap.moveTo(0,0); cap.lineTo(a[u],a[v]); cap.lineTo(b[u],b[v]); cap.closePath();
        }
      }
    }
    projected = points.map(() => [0,0,0]);
    queue();
  }

  function draw(time) {
    frame = 0;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || document.hidden) { previousTime = null; return; }
    if (playing && previousTime !== null) yaw += (time - previousTime) * Math.PI / 8000;
    previousTime = playing ? time : null;
    const d = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w*d) || canvas.height !== Math.round(h*d)) {
      canvas.width = Math.round(w*d); canvas.height = Math.round(h*d);
    }
    ctx.setTransform(d,0,0,d,0,0); ctx.clearRect(0,0,w,h);
    const c = Math.cos(yaw), s = Math.sin(yaw), u = Math.cos(pitch), v = Math.sin(pitch);
    const right = [c,s,0], up = [-s*v,c*v,u], eye = [s*u,-c*u,v];
    const scale = 0.45 * Math.min(w,h) * zoom;
    for (let i = 0; i < points.length; i++) {
      const [x,y,z] = points[i], p = projected[i], t = -s*x+c*y;
      p[0] = w/2 + (c*x+s*y)*scale; p[1] = h/2 - (z*u+t*v)*scale; p[2] = z*v-t*u;
    }
    for (const face of surface) {
      let depth = 0;
      for (const id of face.ids) depth += projected[id][2];
      face.depth = depth / face.ids.length;
    }
    surface.sort((a,b) => a.depth - b.depth || a.order - b.order);
    const light = right.map((n,k) => -.38*n + .66*up[k] + .64*eye[k]);
    ctx.lineWidth = .45;
    for (const {ids, normal} of surface) {
      const intensity = Math.abs(normal[0]*light[0] + normal[1]*light[1] + normal[2]*light[2]);
      ctx.fillStyle = ctx.strokeStyle = palette[Math.min(255, Math.round(255*(.36+.64*intensity)))];
      ctx.beginPath();
      const first = projected[ids[0]]; ctx.moveTo(first[0],first[1]);
      for (let i=1; i<ids.length; i++) { const p=projected[ids[i]]; ctx.lineTo(p[0],p[1]); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (cap && eye[axis] * (flipped ? -toward : toward) > 1e-6) {
      const a = (axis+1)%3, b = (axis+2)%3;
      const matrix = new DOMMatrix([right[a]*scale,-up[a]*scale,right[b]*scale,-up[b]*scale,
        w/2+right[axis]*offset*scale,h/2-up[axis]*offset*scale]);
      const mask = new Path2D(); mask.addPath(cap,matrix);
      ctx.fillStyle = hatch; ctx.fill(mask,'evenodd');
    }
    if (playing) queue();
  }

  function queue() { if (!frame) frame = requestAnimationFrame(draw); }
  new ResizeObserver(queue).observe(canvas);
  document.addEventListener('visibilitychange', () => { previousTime = null; queue(); });
  canvas.onpointerdown = e => {
    if (e.button !== 0) return;
    drag = [e.clientX,e.clientY]; canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = e => {
    if (!drag) return;
    yaw += (e.clientX-drag[0])*.015;
    pitch = Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+(e.clientY-drag[1])*.015));
    drag = [e.clientX,e.clientY]; queue();
  };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };
  return {
    load, refresh: queue,
    spin(on) { playing = on; previousTime = null; queue(); },
    section(plane, reverse) {
      const next = axes[plane] ?? null;
      if (next !== null && next !== axis) {
        const eye = [Math.sin(yaw)*Math.cos(pitch),-Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch)];
        toward = Math.sign(eye[next]) || 1;
      }
      axis = next; flipped = reverse; rebuildSection();
    },
    view(op) {
      switch (op) {
        case 'iso': isometric(); break;
        case 'front': yaw = 0; pitch = 0; break;
        case 'top': yaw = 0; pitch = Math.PI/2; break;
        case 'side': yaw = Math.PI/2; pitch = 0; break;
        case 'in': zoom = Math.min(3,zoom*1.2); break;
        case 'out': zoom = Math.max(.4,zoom/1.2); break;
      }
      queue();
    }
  };
}
