/**
 * Radar: lensa bulat yang mengikuti pointer / jari dan menyingkap lapisan siluet Spider-Man
 * yang tersejajar dengan foto formal. Dipakai bersama oleh hero (ProfilePhoto) dan kartu ID (IdCard).
 *
 * Gerak hanya lewat transform. Lensa = wadah bertopeng lembut (ukuran 2R) yang digeser dan diskalakan;
 * lapisan siluet di dalamnya diberi transform kebalikan sehingga gambarnya tetap diam, selaras dengan foto di bawahnya.
 *   dunia = T + (R,R) + k * (lokal - (R,R))   =>   lokal = (R,R) + (q - L) / k
 * Idle: lensa berpatroli pelan di sekitar wajah. Pointer / jari datang: lensa menyambut (lerp), ping, radius membesar.
 * Reduced motion: lensa statis di wajah, tanpa sapuan, tanpa napas, tanpa pelacakan.
 */
import { S, clamp, damp, onFrame, onMeasure, reduced } from './engine';

const num = (v: string | undefined, d: number): number => { const n = parseFloat(v ?? ''); return Number.isFinite(n) ? n : d; };

export function initRadar(host: HTMLElement): void {
  if (host.dataset.ready) return;
  host.dataset.ready = '1';
  const lens = host.querySelector<HTMLElement>('.radar__lens');
  const inner = host.querySelector<HTMLElement>('.radar__inner');
  const hud = host.querySelector<HTMLElement>('.radar__hud');
  if (!lens || !inner || !hud) return;

  const area = (host.closest('[data-radar-area]') as HTMLElement | null) ?? host;
  const focusSrc = (host.closest('[data-radar-focus]') as HTMLElement | null) ?? area;
  const fx = num(host.dataset.fx, 0.5);
  const fy = num(host.dataset.fy, 0.45);
  const rr = num(host.dataset.r, 0.2);
  const ax = num(host.dataset.ax, 0.1);
  const ay = num(host.dataset.ay, 0.1);
  const still = reduced();

  let W = 1; let H = 1; let R = 1;
  let lx = 0; let ly = 0; let att = 0; let k = 1;
  let follow = false; let hold = 0; let focused = false; let kx = 0; let ky = 0;
  let off: (() => void) | null = null;
  let placed = false;

  const place = (): void => {
    const kk = still ? 1 : k;
    const t = `translate3d(${(lx - R).toFixed(1)}px,${(ly - R).toFixed(1)}px,0) scale(${kk.toFixed(3)})`;
    lens.style.transform = t;
    hud.style.transform = t;
    inner.style.transform = `translate3d(${R.toFixed(1)}px,${R.toFixed(1)}px,0) scale(${(1 / kk).toFixed(4)}) translate3d(${(-lx).toFixed(1)}px,${(-ly).toFixed(1)}px,0)`;
  };
  const measure = (): void => {
    W = host.clientWidth || 1; H = host.clientHeight || 1; R = rr * W;
    const d = `${(2 * R).toFixed(1)}px`;
    lens.style.width = d; lens.style.height = d; hud.style.width = d; hud.style.height = d;
    inner.style.width = `${W}px`; inner.style.height = `${H}px`;
    if (!placed || still) { lx = W * fx; ly = H * fy; placed = true; }
    place();
  };
  const ping = (): void => {
    if (still) return;
    host.classList.remove('is-ping');
    void host.offsetWidth; // mulai ulang animasi ping
    host.classList.add('is-ping');
  };
  const mode = (m: string): void => { if (host.dataset.mode !== m) host.dataset.mode = m; };

  measure();
  new ResizeObserver(measure).observe(host);
  onMeasure(measure); // ikut pengukuran tunggal saat prewarm
  host.classList.add('is-on');
  if (still) { host.classList.add('is-static'); return; }

  /* ---------- Masukan ---------- */
  const enter = (): void => { if (!follow) { follow = true; ping(); } hold = 0; };
  const leave = (): void => { follow = false; };
  area.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') enter(); });
  area.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') leave(); });
  area.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') enter(); });
  const lift = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    follow = false;
    hold = 1.3; // jari diangkat: lensa masih singgah sebentar lalu kembali berpatroli
  };
  area.addEventListener('pointerup', lift);
  area.addEventListener('pointercancel', lift);

  focusSrc.addEventListener('focus', () => { if (focusSrc.matches(':focus-visible')) { focused = true; kx = 0; ky = 0; ping(); } });
  focusSrc.addEventListener('blur', () => { focused = false; });
  if (area.hasAttribute('data-radar-kbd')) {
    area.addEventListener('keydown', (e) => {
      if (!focused) return;
      const step = 0.07;
      if (e.key === 'ArrowLeft') kx -= step; else if (e.key === 'ArrowRight') kx += step;
      else if (e.key === 'ArrowUp') ky -= step; else if (e.key === 'ArrowDown') ky += step;
      else return;
      kx = clamp(kx, -0.4, 0.4); ky = clamp(ky, -0.4, 0.4);
      e.preventDefault();
    });
  }

  /* ---------- Loop (hanya saat terlihat) ---------- */
  const tick = (dt: number, t: number): void => {
    let tx: number; let ty: number; let sp = 3.4;
    const pointerHere = follow && S.active;
    if (pointerHere) {
      const r = host.getBoundingClientRect();
      tx = clamp(((S.px - r.left) / r.width) * W, -R * 0.2, W + R * 0.2);
      ty = clamp(((S.py - r.top) / r.height) * H, -R * 0.2, H + R * 0.2);
      sp = 9;
      mode('follow');
    } else if (focused) {
      tx = W * (fx + kx); ty = H * (fy + ky); sp = 6;
      mode('focus');
    } else {
      // patroli idle: lissajous pelan di sekitar wajah
      tx = W * (fx + ax * Math.sin(t * 0.55) + 0.015 * Math.sin(t * 1.9));
      ty = H * (fy + ay * Math.sin(t * 0.41 + 1.3) + 0.01 * Math.cos(t * 1.4));
      mode(hold > 0 ? 'linger' : 'idle');
    }
    if (hold > 0 && !pointerHere) hold -= dt;
    if (hold > 0 && !pointerHere && !focused) { /* singgah: tetap pada posisi terakhir */ tx = lx; ty = ly; }
    const f = damp(sp, dt);
    lx += (tx - lx) * f; ly += (ty - ly) * f;
    const attT = pointerHere || focused || hold > 0 ? 1 : 0;
    att += (attT - att) * damp(5, dt);
    k = (0.92 + 0.2 * att) * (1 + 0.055 * Math.sin(t * 1.7)); // radius "bernapas"
    host.style.setProperty('--att', att.toFixed(3));
    host.classList.toggle('is-active', att > 0.35);
    place();
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { if (!off) off = onFrame(tick); } else if (off) { off(); off = null; }
  }), { rootMargin: '60px' });
  io.observe(host);
}
