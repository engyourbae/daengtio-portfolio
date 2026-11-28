/**
 * Kunci zoom dan salin teks (permintaan pemilik situs).
 * - Zoom: viewport maximum-scale=1 + touch-action di CSS sudah menolak cubit dan ketuk-ganda di Android. iOS Safari mengabaikan
 *   user-scalable=no, jadi gerakan cubit (gesturestart / gesturechange / gestureend) dibatalkan di sini.
 * - Salin: pilih teks, menu tekan-lama / klik kanan, copy / cut, dan seret gambar dibatalkan, kecuali di kolom form.
 *   Tombol "salin email" tetap jalan (navigator.clipboard tidak melewati event copy; cadangan execCommand memakai <textarea>, yang diizinkan).
 * Catatan jujur: ini hanya pencegah kebiasaan. Teks tetap bisa diambil lewat lihat-sumber, mode baca, atau tangkapan layar.
 * Semua listener di sini bukan listener scroll/touch, jadi tidak memperlambat scroll.
 */
const editable = (t: EventTarget | null): boolean => {
  const el = t instanceof Element ? t : t instanceof Node ? t.parentElement : null;
  return !!el?.closest('input, textarea, select, [contenteditable="true"]');
};

export function initLock(): void {
  const block = (e: Event): void => {
    if (!editable(e.target)) e.preventDefault();
  };
  for (const type of ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart']) document.addEventListener(type, block);
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, (e) => e.preventDefault());
}
