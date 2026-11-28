/**
 * Kartu ID yang menggantung pada dua benang jaring.
 * Model fisika (dekoratif, seluruh isi kartu tetap teks asli):
 *   - pendulum pegas teredam:  th'' = -w0^2 sin(th) - c th' + gaya   (sudut ayunan th, kecepatan sudut w)
 *   - rotasi kartu `phi` sebagai pegas kedua yang tertinggal dari ayunan
 *   - pegas vertikal `dy` (benang melar/kendur) yang dipicu kecepatan scroll
 * Benang digambar sebagai kurva SVG (Q) dengan kendur (sag) yang berubah menurut jarak jangkar-kartu dan kecepatan.
 * Gaya masukan: impuls dari kecepatan pointer saat tiba, impuls dari percepatan scroll, goyang kecil saat idle,
 * tarik dengan jari / mouse (lepas = berayun kembali), dan tombol panah kiri/kanan.
 * Reduced motion: kartu diam, tanpa listener tarik dan tanpa tabindex.
 */
import { S, clamp, damp, onFrame, onMeasure, reduced } from './engine';

const W0 = 2.35; // frekuensi alami (rad/s), periode ~2,7 dtk
const DAMP = 0.62;

export function initIdCard(cont: HTMLElement): void {
  if (cont.dataset.ready) return;
  cont.dataset.ready = '1';
  const body = cont.querySelector<HTMLElement>('.idc__body');
  const web = cont.querySelector<SVGElement>('.idc__web');
  const paths = Array.from(cont.querySelectorAll<SVGPathElement>('.idc__s'));
  const knots = Array.from(cont.querySelectorAll<SVGCircleElement>('.idc__knot'));
  const holo = cont.querySelector<HTMLElement>('.idc__holo');
  const sec = cont.closest('section');
  if (!body || !web || paths.length < 2 || !sec) return;
  const still = reduced();

  /* ---------- Geometri (koordinat wadah) ---------- */
  let Ax = [0, 0]; let Ay = [0, 0];
  let Mx = 0; let My = 0; let L = 120;
  let Ox = 0; let Oy = 0; let b = 40;
  let rest: [number, number][] = [[0, 0], [0, 0]];

  const measure = (): void => {
    const cr = cont.getBoundingClientRect();
    const relTop = cr.top - sec.getBoundingClientRect().top;
    const cx = cont.clientWidth / 2;
    const webW = (web as unknown as HTMLElement).getBoundingClientRect().width || 300;
    (web as unknown as HTMLElement).style.left = `${cx}px`;
    (web as unknown as HTMLElement).style.top = `${-relTop}px`;
    const k = webW / 204;
    // simpul jaring: jari-jari 60 dan 120 derajat pada cincin ke-3 dari 6 (lihat WebArt)
    const r = (3 / 6) * 100 * (0.92 + 3 * 0.013);
    const dx = Math.cos(Math.PI / 3) * r * k; const dy = Math.sin(Math.PI / 3) * r * k;
    Ax = [cx - dx, cx + dx]; Ay = [-relTop + dy, -relTop + dy];
    Mx = cx; My = -relTop + dy;
    Ox = body.offsetLeft + body.offsetWidth / 2; Oy = body.offsetTop;
    L = Math.max(80, Oy - My);
    b = body.offsetWidth * 0.26;
    rest = [[Ox - b, Oy + 12], [Ox + b, Oy + 12]];
    knots.forEach((c, i) => { c.setAttribute('cx', Ax[i].toFixed(1)); c.setAttribute('cy', Ay[i].toFixed(1)); });
  };

  /* ---------- Gambar benang ---------- */
  let th = 0; let w = 0; let phi = 0; let pw = 0; let dy = 0; let dv = 0;
  const draw = (): void => {
    const rot = th * 0.55 + phi;
    const ox = L * Math.sin(th); const oy = L * (Math.cos(th) - 1) + dy;
    const c = Math.cos(rot); const s = Math.sin(rot);
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -b : b;
      const px = Ox + ox + sx * c - 12 * s; const py = Oy + oy + sx * s + 12 * c;
      const len0 = Math.hypot(rest[i][0] - Ax[i], rest[i][1] - Ay[i]);
      const len = Math.hypot(px - Ax[i], py - Ay[i]);
      const slack = Math.max(0, len0 - len);
      const sag = len0 * 0.045 + slack * 0.55 + Math.abs(w) * 5 - clamp(dy, -30, 0) * 0.15;
      const mx = (Ax[i] + px) / 2 - w * 3.2; const my = (Ay[i] + py) / 2 + sag;
      paths[i].setAttribute('d', `M${Ax[i].toFixed(1)} ${Ay[i].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    body.style.transform = `translate3d(${ox.toFixed(2)}px,${oy.toFixed(2)}px,0) rotate(${rot.toFixed(4)}rad)`;
    if (holo) holo.style.transform = `translate3d(${(rot * 520 + Math.sin(S.t * 0.6) * 8).toFixed(1)}%,0,0)`;
  };

  measure();
  onMeasure(() => { measure(); draw(); });
  draw();
  cont.classList.add('is-on');
  if (still) { cont.classList.add('is-static'); return; }

  /* ---------- Masukan ---------- */
  body.setAttribute('tabindex', '0');
  let over = false; let dragging = false; let pid = -1;
  let gx = 0; let gy = 0; let wDrag = 0; let thPrev = 0;
  const local = (e: PointerEvent): [number, number] => {
    const r = cont.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  body.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    over = true;
    if (!dragging) w += clamp(S.pvx * 0.0012, -2.4, 2.4); // impuls kedatangan pointer
  });
  body.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') over = false; });

  body.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; pid = e.pointerId; wDrag = 0; thPrev = th;
    const [x, y] = local(e);
    // selisih antara titik pegang dan titik gantung kartu (agar tidak melompat)
    const ox = L * Math.sin(th); const oy = L * (Math.cos(th) - 1) + dy;
    gx = x - (Ox + ox); gy = y - (Oy + oy);
    try { body.setPointerCapture(e.pointerId); } catch { /* diabaikan */ }
    cont.classList.add('is-drag');
  });
  body.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const [x, y] = local(e);
    // titik gantung yang diinginkan, dibatasi pada panjang benang
    let tx = x - gx; let ty = y - gy;
    const vx = tx - Mx; let vy = Math.max(60, ty - My);
    let dist = Math.hypot(vx, vy);
    const max = L * 1.22; const min = L * 0.7;
    const cl = clamp(dist, min, max);
    if (cl !== dist) { const k = cl / dist; tx = Mx + vx * k; vy *= k; dist = cl; }
    th = Math.atan2(tx - Mx, vy);
    dy = dist - L;
    dv = 0;
  });
  const drop = (e: PointerEvent): void => {
    if (!dragging || e.pointerId !== pid) return;
    dragging = false; pid = -1;
    w = clamp(wDrag, -6, 6);
    cont.classList.remove('is-drag');
    try { body.releasePointerCapture(e.pointerId); } catch { /* diabaikan */ }
  };
  body.addEventListener('pointerup', drop);
  body.addEventListener('pointercancel', drop);
  body.addEventListener('lostpointercapture', drop);

  body.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') w -= 1.7;
    else if (e.key === 'ArrowRight') w += 1.7;
    else return;
    e.preventDefault();
  });

  /* ---------- Loop (hanya saat dekat layar) ---------- */
  let prevVel = 0;
  const tick = (dt: number, t: number): void => {
    const h = Math.min(dt, 0.033);
    if (dragging) {
      const inst = (th - thPrev) / h;
      wDrag += (inst - wDrag) * 0.35;
      thPrev = th;
      // rotasi kartu tetap hidup selama ditarik
      pw += (-34 * (phi + 0.1 * wDrag) - 4 * pw) * h; phi += pw * h;
      draw();
      return;
    }
    // gaya
    const accel = (S.vel - prevVel) / h;
    prevVel = S.vel;
    let F = 0.2 * Math.sin(t * 0.85 + 0.6) + 0.07 * Math.sin(t * 2.3); // goyang kecil saat idle
    F += clamp(accel * 0.00028, -3, 3); // impuls dari percepatan scroll
    if (over && S.active) F += clamp(S.pvx * 0.0016, -3, 3); // pointer yang bergerak di atas kartu
    // pendulum pegas teredam (semi-implisit)
    w += (-W0 * W0 * Math.sin(th) - DAMP * w + F) * h;
    th += w * h;
    th = clamp(th, -1.2, 1.2);
    // rotasi kartu: pegas yang tertinggal dari kecepatan sudut
    pw += (38 * (-0.11 * w - phi) - 4.2 * pw) * h; phi += pw * h;
    // pegas vertikal: kartu melar saat scroll cepat
    const dyT = clamp(S.vel * 0.011, -26, 26);
    dv += (62 * (dyT - dy) - 8.5 * dv) * h; dy += dv * h;
    draw();
  };
  let off: (() => void) | null = null;
  new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { if (!off) off = onFrame(tick); } else if (off) { off(); off = null; }
  }), { rootMargin: '120px' }).observe(cont);
  void damp;
}
