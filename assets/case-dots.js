/* Case study prize graphic: a slowly rotating 3D object drawn in dots (same style as the home page hero).
   Usage: <canvas class="prize" data-shape="glass|porcelain|pump"></canvas> */
(() => {
  const canvas = document.querySelector('canvas.prize');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = innerWidth < 900 ? 1600 : 2800;
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // --- geometry helpers -------------------------------------------------
  // Revolve a 2D profile [(r, y), ...] around the vertical axis into rings of points
  function revolve(profile, rings, perRing) {
    const segs = [];
    for (let i = 0; i < profile.length - 1; i++) {
      const [r0, y0] = profile[i], [r1, y1] = profile[i + 1];
      segs.push({ r0, y0, r1, y1, len: Math.hypot(r1 - r0, y1 - y0) });
    }
    const total = segs.reduce((a, s) => a + s.len, 0), pts = [];
    for (let k = 0; k < rings; k++) {
      let d = (k + 0.5) / rings * total, s = segs[0];
      for (const sg of segs) { if (d <= sg.len) { s = sg; break; } d -= sg.len; }
      const t = d / s.len, r = s.r0 + (s.r1 - s.r0) * t, y = s.y0 + (s.y1 - s.y0) * t;
      const n = Math.max(6, Math.round(perRing * (0.25 + r)));
      for (let j = 0; j < n; j++) {
        const a = (j + (k % 2) * 0.5) / n * Math.PI * 2;
        pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
      }
    }
    return pts;
  }
  // Points spread along 3D line segments, proportional to length
  function lines(segs, n) {
    const lens = segs.map(([a, b]) => Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]));
    const total = lens.reduce((x, y) => x + y, 0), pts = [];
    segs.forEach(([a, b], i) => {
      const c = Math.max(2, Math.round(n * lens[i] / total));
      for (let j = 0; j < c; j++) { const t = j / (c - 1); pts.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]); }
    });
    return pts;
  }
  const box = (x0, x1, y0, y1, z0, z1) => {
    const c = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    return [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].map(([a, b]) => [c[a], c[b]]);
  };

  const shapes = {
    // Crystal wine glass: base, stem, bowl
    glass: () => revolve([[0.42,-1],[0.36,-0.97],[0.06,-0.92],[0.045,-0.6],[0.045,-0.2],[0.12,-0.08],[0.38,0.05],[0.5,0.3],[0.52,0.6],[0.47,0.95]], 70, 70),
    // Porcelain: a teacup on its saucer, drawn as outlines
    porcelain: () => {
      const segs = [];
      const ring = (y, r, n = 56) => { for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
        segs.push([[Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r]]);
      } };
      // saucer: rim, well and foot
      ring(-0.78, 0.95); ring(-0.86, 0.72); ring(-0.92, 0.42);
      // cup: foot, body and rim rings, plus vertical ribs
      const prof = [[0.3, -0.84], [0.42, -0.66], [0.55, -0.36], [0.62, -0.02], [0.66, 0.3]];
      prof.forEach(([r, y]) => ring(y, r, 48));
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2;
        for (let i = 0; i < prof.length - 1; i++) segs.push([[Math.cos(a) * prof[i][0], prof[i][1], Math.sin(a) * prof[i][0]], [Math.cos(a) * prof[i+1][0], prof[i+1][1], Math.sin(a) * prof[i+1][0]]]); }
      // handle: a loop on the side of the cup
      for (let i = 0; i < 24; i++) { const a0 = -Math.PI * 0.55 + i / 24 * Math.PI * 1.1, a1 = -Math.PI * 0.55 + (i + 1) / 24 * Math.PI * 1.1;
        segs.push([[0.62 + Math.cos(a0) * 0.26, -0.16 + Math.sin(a0) * 0.24, 0], [0.62 + Math.cos(a1) * 0.26, -0.16 + Math.sin(a1) * 0.24, 0]]); }
      return lines(segs, N).map(([x, y, z]) => [x, y + 0.25, z]);
    },
    // Fuel pump: body, screen, nozzle holster, hose and nozzle
    pump: () => {
      const segs = [
        ...box(-0.45, 0.45, -0.85, 0.55, -0.26, 0.26),    // body
        ...box(-0.55, 0.55, -0.95, -0.85, -0.32, 0.32),   // plinth
        ...box(-0.32, 0.32, 0.12, 0.42, 0.26, 0.28),      // screen
        ...box(-0.5, 0.5, 0.55, 0.72, -0.3, 0.3),         // top sign
        ...box(0.45, 0.6, -0.25, 0.05, -0.12, 0.12),      // nozzle holster
      ];
      for (let y = -0.7; y < 0.0; y += 0.14) segs.push([[-0.32, y, 0.265], [0.32, y, 0.265]]);  // front panel lines
      // hose: leaves the side near the top, loops down and back up into the nozzle
      const P = t => [0.45 + 0.42 * Math.sin(t * Math.PI), 0.35 - 0.95 * t, 0];
      for (let i = 0; i < 30; i++) for (const dz of [-0.025, 0.025]) {
        const a = P(i / 30), b = P((i + 1) / 30); segs.push([[a[0], a[1], dz], [b[0], b[1], dz]]);
      }
      segs.push([[0.53, -0.6, 0], [0.72, -0.42, 0]], [[0.72, -0.42, 0], [0.86, -0.46, 0]]);   // nozzle
      return lines(segs, N);
    },
  };

  // Camera tilt per object: look down onto the table setting, almost level at the glass and pump
  const PITCH = { glass: 0.28, porcelain: 0.38, pump: 0.24 }[canvas.dataset.shape] ?? 0.3;

  // Fit the shape's points to N dots (repeat or thin evenly)
  let base = (shapes[canvas.dataset.shape] || shapes.glass)();
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const p = base[Math.floor(i * base.length / N)]; P.set(p, i * 3); }
  const jit = new Float32Array(N).map(() => rand() < 0.85 ? rand() * 0.01 : 0.02 + rand() * 0.18);
  const ph = new Float32Array(N).map(() => rand() * 6.28);

  // Ambient dots around the object
  const A = 260, ax = new Float32Array(A), ay = new Float32Array(A), aa = new Float32Array(A);
  for (let i = 0; i < A; i++) { ax[i] = rand(); ay[i] = rand(); aa[i] = 0.1 + rand() * 0.35; }

  const mouse = { x: -1e4, y: -1e4 }, off = new Float32Array(N * 2);
  canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

  let w, h;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  let visible = true, running = false;
  function frame(now) {
    const t = reduce ? 0 : now / 1000;
    const yaw = 0.6 + t * 0.28, pitch = PITCH;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const f = Math.min(w, h) * 0.95, ox = w / 2, oy = h / 2, dist = 3.2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f4f3ef';
    for (let i = 0; i < A; i++) {
      ctx.globalAlpha = aa[i] * (0.7 + 0.3 * Math.sin(t * 1.2 + i));
      ctx.fillRect(((ax[i] + t * 0.004) % 1) * w, ay[i] * h, 1, 1);
    }
    for (let i = 0; i < N; i++) {
      const k = i * 3, j = jit[i];
      const x = P[k] + j * Math.sin(t * 0.4 + ph[i]), y = P[k+1] + j * Math.cos(t * 0.35 + ph[i]), z = P[k+2] + j * Math.sin(t * 0.3 + ph[i] * 2);
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
      const s = f / z2, px = ox + x1 * s, py = oy - y2 * s;
      const dx = px - mouse.x, dy = py - mouse.y, d2 = dx * dx + dy * dy, R = 90;
      let tx = 0, ty = 0;
      if (d2 < R * R) { const d = Math.sqrt(d2) || 1, q = Math.pow(1 - d / R, 2) * 34; tx = dx / d * q; ty = dy / d * q; }
      off[i*2] += (tx - off[i*2]) * 0.14; off[i*2+1] += (ty - off[i*2+1]) * 0.14;
      const depth = Math.min(Math.max((4.2 - z2) / 2, 0.15), 1);
      ctx.globalAlpha = (0.25 + depth * 0.75) * (j > 0.02 ? 0.45 : 1);
      const r = 0.7 + depth * 0.9;
      ctx.fillRect(px + off[i*2] - r/2, py + off[i*2+1] - r/2, r, r);
    }
    ctx.globalAlpha = 1;
    if (!reduce && visible) requestAnimationFrame(frame); else running = false;
  }
  const start = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
  start();
})();
