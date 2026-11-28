/**
 * Latar yang ikut scroll dengan halus (Fase 3).
 * - Semua gerak lewat nilai yang di-lerp (damping), bukan 1:1 dengan scroll.
 * - Jaring A/B berputar dan bergeser pada kedalaman berbeda; halftone melayang pelan.
 * - Debu canvas (tema gelap) punya 3 lapis kedalaman, bergoyang mengikuti kecepatan scroll lalu mengendap (pegas).
 * - Tint per section: tiga cahaya statis (aksen / biru / tinta) saling memudar lewat opacity saat section melewati tengah layar.
 * - Cahaya lembut mengikuti kursor / jari (di-lerp).
 * Hanya transform dan opacity yang ditulis tiap frame; tanpa layout, tanpa repaint besar.
 */
import { S, clamp, damp, lite, onFrame, onMeasure, reduced, weakDevice } from './engine';

type P = { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number; z: number };

export function initBackdrop(): void {
  const bd = document.querySelector<HTMLElement>('.backdrop');
  if (!bd) return;
  const q = (s: string) => bd.querySelector<HTMLElement>(s);
  const half = q('[data-bd="halftone"]');
  const webA = q('[data-bd="a"]');
  const webB = q('[data-bd="b"]');
  const spot = q('.backdrop__spot');
  const glows: Record<string, HTMLElement | null> = { accent: q('[data-glow="accent"]'), blue: q('[data-glow="blue"]'), ink: q('[data-glow="ink"]') };
  const canvas = q('[data-dust]') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d') ?? null;
  const root = document.documentElement;
  const isDark = (): boolean => root.dataset.theme === 'gelap';

  if (reduced()) {
    // Diam: cahaya aksen statis, tanpa loop.
    if (glows.accent) glows.accent.style.opacity = '0.7';
    return;
  }

  /* ---------- Rentang tint per section ---------- */
  let secs: { top: number; bottom: number; tint: string }[] = [];
  let spotR = 220;
  const measure = (): void => {
    const sy = window.scrollY;
    secs = Array.from(document.querySelectorAll<HTMLElement>('[data-tint]')).map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + sy, bottom: r.bottom + sy, tint: el.dataset.tint || 'accent' };
    });
    spotR = Math.max(S.vw, S.vh) * 0.2;
    if (spot) { spot.style.width = `${spotR * 2}px`; spot.style.height = `${spotR * 2}px`; }
    resizeCanvas();
  };

  /* ---------- Debu 3 lapis ---------- */
  let w = 0; let h = 0; let dpr = 1; let parts: P[] = [];
  const Z = [0.35, 0.65, 1];
  const make = (): P => ({
    x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.35, vx: (Math.random() - 0.5) * 0.1,
    vy: -(Math.random() * 0.16 + 0.03), a: Math.random() * 0.5 + 0.2, ph: Math.random() * 6.28, z: Z[Math.floor(Math.random() * 3)],
  });
  function resizeCanvas(): void {
    if (!canvas || !ctx) return;
    const light = lite() || weakDevice;
    dpr = Math.min(window.devicePixelRatio || 1, light ? 1.25 : S.vw < 640 ? 1.5 : 2);
    w = S.vw; h = S.vh;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const small = w < 640;
    // lebih sedikit di layar kecil, perangkat lemah (inti <= 4 / RAM <= 2 GB) dan mode perf-lite
    const q = lite() ? 0.4 : weakDevice ? 0.65 : 1;
    const n = Math.round(Math.min(small ? 34 : 78, (w * h) / (small ? 17000 : 21000)) * q);
    parts = Array.from({ length: n }, make);
  }

  let ys = window.scrollY; let sway = 0; let swv = 0;
  const op: Record<string, number> = { accent: 0, blue: 0, ink: 0 };
  let sx = S.vw / 2; let sy = S.vh / 2; let so = 0; let hold = 0;

  measure();
  onMeasure(measure);

  onFrame((dt, t) => {
    ys += (S.y - ys) * damp(4.5, dt); // scroll di-lerp
    // pegas goyang: didorong kecepatan scroll, mengendap pelan
    swv += (S.velN * -70 - 38 * sway - 6.5 * swv) * dt;
    sway += swv * dt;
    sway = clamp(sway, -6, 6);

    if (half) half.style.transform = `translate3d(${(Math.sin(t * 0.07) * 10).toFixed(1)}px,${(-ys * 0.03 + Math.cos(t * 0.09) * 8).toFixed(1)}px,0)`;
    if (webA) webA.style.transform = `translate3d(${(Math.sin(t * 0.11) * 16 - sway * 5).toFixed(1)}px,${(-ys * 0.07 + sway * 6).toFixed(1)}px,0) rotate(${(ys * 0.011 + sway * 0.3).toFixed(3)}deg)`;
    if (webB) webB.style.transform = `translate3d(${(-Math.sin(t * 0.09) * 14 + sway * 7).toFixed(1)}px,${(-ys * 0.13).toFixed(1)}px,0) rotate(${(-ys * 0.016 - sway * 0.45).toFixed(3)}deg)`;

    // tint: section yang melewati tengah layar
    const c = S.y + S.vh * 0.5;
    let tint = 'accent';
    for (const s of secs) if (c >= s.top && c < s.bottom) { tint = s.tint; break; }
    const pr = S.px < -1000 ? 0.5 : S.px / S.vw - 0.5;
    for (const k of Object.keys(glows)) {
      const g = glows[k];
      if (!g) continue;
      op[k] += ((k === tint ? 1 : 0) - op[k]) * damp(2.3, dt);
      g.style.opacity = op[k].toFixed(3);
      g.style.transform = `translate3d(${(pr * -46 + Math.sin(t * 0.08 + k.length) * 24).toFixed(1)}px,${(-ys * 0.04).toFixed(1)}px,0)`;
    }

    // cahaya yang mengikuti kursor / jari
    if (S.active) hold = t + 1.1;
    const on = S.px > -1000 && (S.active || t < hold);
    so += ((on ? 1 : 0) - so) * damp(4, dt);
    if (S.px > -1000) { sx += (S.px - sx) * damp(7, dt); sy += (S.py - sy) * damp(7, dt); }
    if (spot) {
      spot.style.opacity = so.toFixed(3);
      spot.style.transform = `translate3d(${(sx - spotR).toFixed(1)}px,${(sy - spotR).toFixed(1)}px,0)`;
    }

    // debu (hanya tema gelap)
    if (ctx && canvas) {
      ctx.clearRect(0, 0, w, h);
      if (isDark()) {
        ctx.fillStyle = '#cfd9ea';
        for (const p of parts) {
          p.y += p.vy * dt * 60; if (p.y < 0) p.y += h;
          p.x += p.vx * dt * 60;
          const off = ys * (0.12 + 0.5 * p.z);
          let py = (p.y - off) % h; if (py < 0) py += h;
          let px = (p.x + sway * p.z * 4 + Math.sin(t / 2.6 + p.ph) * 6 * p.z) % w; if (px < 0) px += w;
          ctx.globalAlpha = p.a * (0.45 + 0.55 * p.z) * (0.65 + 0.35 * Math.sin(t / 1.8 + p.ph));
          ctx.beginPath(); ctx.arc(px, py, p.r * (0.6 + 0.8 * p.z), 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  });
}
