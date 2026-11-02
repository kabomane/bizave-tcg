// Port du rendu Canvas de la démo validée du 2 novembre 2026. Aucune capture DOM.
import type { Rarity, Finish, ArtVariant } from '../game/types'
type Palette = { info: string; f1: string; f2: string; f3: string; metal: string[] }
type Stop = [number, string]
type Radius = number | number[]
type Paint = string | CanvasGradient | CanvasPattern
export type CanvasCard = { title: string; description: string; rarity: Rarity; pos?: string }
const RARITY_LABELS: Record<Rarity, string> = { common: 'Commune', uncommon: 'Peu commune', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
const FINISH_MICRO: Record<Finish, string> = { normal: 'Mate', glossy: 'Holographique', alternative: 'Alternative' };
// Copié de cards-reference.css (--r-info, --r-f1..3, --r-metal)
export const R: Record<Rarity, Palette> = {
  common:    { info: '#f7f7f5', f1: '#e2e3e1', f2: '#bfc2c0', f3: '#eeeeec', metal: ['#b9bec6', '#ffffff', '#a3a9b2', '#f2f4f7', '#949ba5', '#b9bec6'] },
  uncommon:  { info: '#dcf0e2', f1: '#9ed3ae', f2: '#57ad77', f3: '#c2e6cd', metal: ['#3f9a63', '#c4f2d3', '#2f7f50', '#a8e6bd', '#236640', '#3f9a63'] },
  rare:      { info: '#dae6f8', f1: '#9bbaec', f2: '#5586d8', f3: '#c1d5f4', metal: ['#3a6cc2', '#d2e2ff', '#2b57a5', '#b6cffb', '#1f4486', '#3a6cc2'] },
  epic:      { info: '#eadff8', f1: '#c3a4ec', f2: '#8f5fd4', f3: '#dbc8f4', metal: ['#7a48c9', '#e8d9ff', '#5e33a6', '#d2bcfb', '#4a258a', '#7a48c9'] },
  legendary: { info: '#f6e9c6', f1: '#e6c57a', f2: '#c69636', f3: '#f1daa0', metal: ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7', '#aa771c', '#bf953f'] },
};
const GOLD = ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7', '#aa771c', '#bf953f'];
const HOLO_ICON = ['#ff8fa3', '#ffe07a', '#8dffb8', '#8ad8ff', '#c79bff'];

// Mêmes tracés que CollectibleCard.tsx (viewBox 24×24), passés en Path2D.
const RARITY_PATHS: Record<Rarity, string[]> = {
  common: ['M18 12a6 6 0 1 1-12 0a6 6 0 1 1 12 0Z'],
  uncommon: ['M12 3 20 12 12 21 4 12Z'],
  rare: ['M12 2c1 5 3 8 10 10-7 2-9 5-10 10-1-5-3-8-10-10 7-2 9-5 10-10Z'],
  epic: ['M12 2l2.6 5.5 6.1-.5-3.3 5 3.3 5-6.1-.5L12 22l-2.6-5.5-6.1.5 3.3-5-3.3-5 6.1.5Z'],
  legendary: ['M3 17h18l-1.6-10-4.6 4.2L12 4l-2.8 7.2L4.6 7Z', 'M4.25 18.5h15.5a1.25 1.25 0 0 1 0 2.5H4.25a1.25 1.25 0 0 1 0-2.5Z'],
};

/* ───────────── Outils ───────────── */
const W0 = 326, H0 = 540;
const hex = (h: string) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v * (1 - t) + B[i] * t)).join(',')})`; };
const rgba = (h: string, a: number) => `rgba(${hex(h).join(',')},${a})`;
const even = (cols: string[]): Stop[] => cols.map((c, i) => [i / (cols.length - 1), c]);

// linear-gradient(<deg>) CSS appliqué à une boîte
function linear(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, deg: number, stops: Stop[]) {
  const t = deg * Math.PI / 180, dx = Math.sin(t), dy = -Math.cos(t);
  const L = Math.abs(w * dx) + Math.abs(h * dy), cx = x + w / 2, cy = y + h / 2;
  const g = ctx.createLinearGradient(cx - dx * L / 2, cy - dy * L / 2, cx + dx * L / 2, cy + dy * L / 2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Radius) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y); ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br); ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h); ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl); ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
export function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Radius, style: Paint) { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = style; ctx.fill(); }
function insetRing(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Radius, width: number, color: string) {
  ctx.save(); ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.clip();
  ctx.beginPath(); rr(ctx, x + width / 2, y + width / 2, w - width, h - width, Array.isArray(r) ? r.map(v => Math.max(0, v - width / 2)) : Math.max(0, r - width / 2));
  ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke(); ctx.restore();
}

// Grain « --paper » (feTurbulence) recréé en bruit déterministe
let paperTile: HTMLCanvasElement | undefined;
function paperPattern(ctx: CanvasRenderingContext2D) {
  if (!paperTile) {
    const n = 220, c = document.createElement('canvas'); c.width = c.height = n;
    const x = c.getContext('2d')!, img = x.createImageData(n, n);
    let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const f = new Float32Array(n * n); for (let i = 0; i < f.length; i++) f[i] = rnd();
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
      let sum = 0;
      for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) sum += f[((y + j + n) % n) * n + (xx + k + n) % n];
      const v = .65 * sum / 9 + .35 * f[y * n + xx], a = .75 * Math.max(0, .5 * v - .18), o = (y * n + xx) * 4;
      img.data[o] = 89; img.data[o + 1] = 97; img.data[o + 2] = 115; img.data[o + 3] = Math.round(a * 255);
    }
    x.putImageData(img, 0, 0); paperTile = c;
  }
  return ctx.createPattern(paperTile, 'repeat')!;
}

function fontMetrics(ctx: CanvasRenderingContext2D, font: string, size: number) {
  ctx.textBaseline = 'alphabetic';
  ctx.font = font; const m = ctx.measureText('Hg');
  return { asc: m.fontBoundingBoxAscent ?? size * .98, desc: m.fontBoundingBoxDescent ?? size * .26 };
}
// Texte avec letter-spacing manuel (ctx.letterSpacing n'existe pas partout)
export function textWidth(ctx: CanvasRenderingContext2D, str: string, sp: number) { return ctx.measureText(str).width + sp * Math.max(0, [...str].length - 1); }
export function drawSpaced(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, sp: number) {
  if (!sp) { ctx.fillText(str, x, y); return; }
  const chars = [...str]; let acc = '';
  chars.forEach((ch, i) => { ctx.fillText(ch, x + ctx.measureText(acc).width + i * sp, y); acc += ch; });
}
function ellipsis(ctx: CanvasRenderingContext2D, str: string, maxW: number, sp: number) {
  if (textWidth(ctx, str, sp) <= maxW) return str;
  let s = str; while (s.length && textWidth(ctx, s + '…', sp) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > maxW) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, pos = 'center center') {
  const [px, py] = parsePos(pos);
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - dw) * px, y + (h - dh) * py, dw, dh);
}
function parsePos(pos: string) {
  const k: Record<string, number> = { left: 0, top: 0, center: .5, right: 1, bottom: 1 };
  const p = pos.trim().split(/\s+/); if (p.length === 1) p.push('center');
  let [a, b] = p; if (a === 'top' || a === 'bottom' || b === 'left' || b === 'right') [a, b] = [b, a];
  const v = (t: string) => t.endsWith('%') ? parseFloat(t) / 100 : (k[t] ?? .5);
  return [v(a), v(b)];
}

/* ───────────── Dessin de la carte (unités CSS, base 326 × 540) ───────────── */
// S = échelle de sortie, utilisée pour les ombres (non transformées par le canvas)
export function drawCard(ctx: CanvasRenderingContext2D, S: number, card: CanvasCard, finish: Finish, variant: ArtVariant, A: { art: HTMLImageElement; holo: HTMLImageElement }) {
  const c = R[card.rarity], gundam = variant === 'fullArt';
  const alt = finish === 'alternative', glossy = finish === 'glossy', mate = finish === 'normal';
  const micro = `${RARITY_LABELS[card.rarity]} · ${FINISH_MICRO[finish]}`;

  ctx.save();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.beginPath(); rr(ctx, 0, 0, W0, H0, 20); ctx.clip();

  // Fond
  if (alt) ctx.fillStyle = '#0c0c0e';
  else if (glossy) ctx.fillStyle = linear(ctx, 0, 0, W0, H0, 170, [[0, c.f3], [.55, c.f1], [1, c.f3]]);
  else ctx.fillStyle = gundam ? '#fbfaf7' : linear(ctx, 0, 0, W0, H0, 170, [[0, c.f3], [.55, c.info], [1, c.f3]]);
  ctx.fillRect(0, 0, W0, H0);
  if (mate && !gundam) { ctx.fillStyle = paperPattern(ctx); ctx.fillRect(0, 0, W0, H0); }

  // Illustration
  const art = gundam ? { x: 0, y: 0, w: W0, h: H0, r: 0, b: 0 } : { x: 15, y: 55.5, w: 296, h: 313.2, r: 3, b: 2 };
  ctx.save();
  ctx.beginPath(); rr(ctx, art.x + art.b, art.y + art.b, art.w - 2 * art.b, art.h - 2 * art.b, Math.max(0, art.r - art.b)); ctx.clip();
  ctx.fillStyle = '#2b3354'; ctx.fillRect(art.x, art.y, art.w, art.h);
  if (alt && 'filter' in ctx) ctx.filter = 'contrast(1.08) saturate(1.12)';
  drawCover(ctx, A.art, art.x + art.b, art.y + art.b, art.w - 2 * art.b, art.h - 2 * art.b, card.pos);
  ctx.filter = 'none';
  if (mate) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55; ctx.fillStyle = paperPattern(ctx); ctx.fillRect(art.x, art.y, art.w, art.h); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (alt) { ctx.fillStyle = linear(ctx, art.x, art.y, art.w, art.h, 180, [[0, 'rgba(0,0,0,.18)'], [.22, 'rgba(0,0,0,0)'], [.7, 'rgba(0,0,0,0)'], [1, 'rgba(8,6,4,.55)']]); ctx.fillRect(art.x, art.y, art.w, art.h); }
  ctx.restore();
  if (!gundam) {
    ctx.beginPath(); rr(ctx, art.x + 1, art.y + 1, art.w - 2, art.h - 2, 2);
    ctx.lineWidth = 2; ctx.strokeStyle = alt ? c.f2 : 'rgba(20,20,25,.55)'; ctx.stroke();
  }

  // Holo : texture précalculée de l'app + reflet fixe
  if (glossy) {
    ctx.drawImage(A.holo, 0, 0, W0, H0);
    ctx.save(); ctx.globalAlpha = .7; ctx.translate(-W0 * .3, 0);
    ctx.fillStyle = linear(ctx, 0, 0, W0, H0, 110, [[0, 'rgba(255,255,255,0)'], [.28, 'rgba(255,255,255,0)'], [.4, 'rgba(255,255,255,.04)'], [.5, 'rgba(255,255,255,.52)'], [.6, 'rgba(255,255,255,.04)'], [.72, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, W0, H0); ctx.restore();
  }

  if (gundam) drawGundamText(ctx, S, card, finish, c); else drawFusionText(ctx, S, card, finish, c, micro);

  // Cadre 6 px
  drawFrame(ctx, finish, c);
  ctx.restore();
}

function titleFill(ctx: CanvasRenderingContext2D, x: number, w: number) { return linear(ctx, x, 0, w * 2, 1, 90, even(GOLD)); } // background-size: 200%

function drawFusionTitle(ctx: CanvasRenderingContext2D, S: number, card: CanvasCard, finish: Finish, x: number, y: number, width: number, height: number) {
  // A bounded bitmap also contains Safari's gradient-text shadows inside the name bar.
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(width * S); layer.height = Math.ceil(height * S);
  const title = layer.getContext('2d')!;
  title.scale(layer.width / width, layer.height / height);
  const metrics = fontMetrics(title, '700 15px Fraunces', 15), alt = finish === 'alternative';
  const spacing = alt ? .9 : -.15;
  const text = ellipsis(title, card.title, width - 22 - 8 - 15, spacing);
  const ink = title.measureText(text);
  const ascent = ink.actualBoundingBoxAscent ?? metrics.asc, descent = ink.actualBoundingBoxDescent ?? metrics.desc;
  const baseline = height / 2 + (ascent - descent) / 2;
  title.fillStyle = alt ? titleFill(title, 11, textWidth(title, text, spacing)) : '#18212f';
  if (alt) { title.shadowColor = 'rgba(0,0,0,.55)'; title.shadowBlur = 2 * S; title.shadowOffsetY = S; }
  drawSpaced(title, text, 11, baseline, spacing);
  ctx.drawImage(layer, x, y, width, height);
}

function drawFusionText(ctx: CanvasRenderingContext2D, S: number, card: CanvasCard, finish: Finish, c: Palette, micro: string) {
  const alt = finish === 'alternative', glossy = finish === 'glossy';
  // Bandeau du nom
  const bx = 15, by = 15, bw = 296, bh = 34.5;
  ctx.save();
  ctx.shadowColor = alt ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.25)'; ctx.shadowBlur = (alt ? 4 : 3) * S; ctx.shadowOffsetY = 2 * S;
  fillRR(ctx, bx - 1.5, by - 1.5, bw + 3, bh + 3, 9.5, alt ? c.f2 : mix(c.f2, '#000000', .25));
  ctx.restore();
  fillRR(ctx, bx, by, bw, bh, 8,
    alt ? linear(ctx, bx, by, bw, bh, 180, [[0, '#252428'], [1, '#141316']])
        : glossy ? rgba(c.f3, .65)
        : linear(ctx, bx, by, bw, bh, 180, [[0, mix(c.info, '#ffffff', .45)], [1, c.f3]]));
  insetRing(ctx, bx, by, bw, bh, 8, 1, alt ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.6)');

  drawFusionTitle(ctx, S, card, finish, bx, by, bw, bh);

  // Pastille de rareté
  const ox = bx + bw - 11 - 7.5, oy = by + bh / 2;
  const g = ctx.createRadialGradient(ox - 7.5 + 15 * .35, oy - 7.5 + 15 * .3, 0, ox - 7.5 + 15 * .35, oy - 7.5 + 15 * .3, 15 * .9);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.48, c.f2); g.addColorStop(1, mix(c.f2, '#000000', .45));
  ctx.beginPath(); ctx.arc(ox, oy, 7.5, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(ox, oy, 8, 0, Math.PI * 2); ctx.stroke();

  // Encart de texte
  const dx = 15, dy = 374.7, dw = 296, dh = 131.55;
  if (alt) {
    fillRR(ctx, dx, dy, dw, dh, 6, 'rgba(255,255,255,.035)');
    insetRing(ctx, dx, dy, dw, dh, 6, 1, rgba(c.f2, .55));
  } else {
    fillRR(ctx, dx, dy, dw, dh, 6, glossy ? 'rgba(255,255,255,.65)' : linear(ctx, dx, dy, dw, dh, 180, [[0, mix(c.info, '#ffffff', .55)], [1, c.info]]));
    if (!glossy) fillRR(ctx, dx, dy, dw, dh, 6, paperPattern(ctx));
    // inset 0 1px 6px rgba(0,0,0,.08)
    ctx.save(); ctx.beginPath(); rr(ctx, dx, dy, dw, dh, 6); ctx.clip();
    ctx.shadowColor = 'rgba(0,0,0,.08)'; ctx.shadowBlur = 6 * S; ctx.shadowOffsetY = 1 * S;
    ctx.beginPath(); rr(ctx, dx - 20, dy - 20, dw + 40, dh + 40, 0); rr(ctx, dx, dy, dw, dh, 6); ctx.fillStyle = '#000'; ctx.fill('evenodd');
    ctx.restore();
    insetRing(ctx, dx, dy, dw, dh, 6, 1, 'rgba(0,0,0,.14)');
  }
  const dfont = 'italic 500 13px Fraunces', dm = fontMetrics(ctx, dfont, 13);
  ctx.font = dfont; ctx.fillStyle = alt ? '#c9b998' : '#2b3445';
  wrap(ctx, card.description, dw - 26).forEach((line, i) => {
    const top = dy + 11 + i * 19.5;
    if (top + 19.5 <= dy + dh) ctx.fillText(line, dx + 13, top + (19.5 - (dm.asc + dm.desc)) / 2 + dm.asc);
  });

  // Mention « rareté · finition »
  const mfont = '500 8.5px "Barlow Condensed"', mm = fontMetrics(ctx, mfont, 8.5);
  ctx.font = mfont; const up = micro.toUpperCase(), msp = 8.5 * .22, mw = textWidth(ctx, up, msp);
  const mx = W0 / 2 - mw / 2, my = dy + dh + 5 + (12.75 - (mm.asc + mm.desc)) / 2 + mm.asc;
  ctx.fillStyle = alt ? titleFill(ctx, mx, mw) : mix(c.f2, '#10141c', .45);
  drawSpaced(ctx, up, mx, my, msp);
}

function drawGundamText(ctx: CanvasRenderingContext2D, S: number, card: CanvasCard, finish: Finish, c: Palette) {
  const alt = finish === 'alternative', glossy = finish === 'glossy';
  const panel = alt ? 'rgba(12,12,14,.84)' : glossy ? 'rgba(255,255,255,.75)' : 'rgba(248,249,252,.75)';

  // Encart bas
  const dfont = 'italic 500 13px Fraunces', dm = fontMetrics(ctx, dfont, 13);
  ctx.font = dfont;
  const lines = wrap(ctx, card.description, 302 - 26);
  const ih = 11 + 3 + lines.length * 19.5 + 12, ix = 12, iw = 302, iy = H0 - 12 - ih;
  fillRR(ctx, ix, iy, iw, ih, [0, 0, 10, 10], panel);
  ctx.save(); ctx.beginPath(); rr(ctx, ix, iy, iw, ih, [0, 0, 10, 10]); ctx.clip(); ctx.fillStyle = c.f2; ctx.fillRect(ix, iy, iw, 2); ctx.restore();
  ctx.fillStyle = alt ? '#d6c7a6' : '#1d2533';
  lines.forEach((line, i) => { const top = iy + 14 + i * 19.5; ctx.fillText(line, ix + 13, top + (19.5 - (dm.asc + dm.desc)) / 2 + dm.asc); });

  // Plaque du nom
  const font = '700 15px Fraunces', m = fontMetrics(ctx, font, 15);
  ctx.font = font; const sp = alt ? .9 : -.15;
  const t = ellipsis(ctx, card.title, 302 - 30, sp), tw = textWidth(ctx, t, sp);
  const tw2 = Math.min(302, tw + 30), th = 36.5, tx = 12, ty = iy - 6 - th;
  fillRR(ctx, tx, ty, tw2, th, [10, 10, 0, 0], panel);
  ctx.save(); ctx.beginPath(); rr(ctx, tx, ty, tw2, th, [10, 10, 0, 0]); ctx.clip(); ctx.fillStyle = c.f2; ctx.fillRect(tx, ty + th - 2, tw2, 2); ctx.restore();
  const base = ty + (th - (m.asc + m.desc)) / 2 + m.asc;
  ctx.fillStyle = alt ? titleFill(ctx, tx + 14, tw) : '#1d2533';
  drawSpaced(ctx, t, tx + 14, base, sp);

  // Pastilles hexagonales (rareté, finition)
  hexBadge(ctx, 16, 16, linear(ctx, 16, 16, 32, 36, 160, [[0, mix(c.f2, '#ffffff', .25)], [1, mix(c.f2, '#000000', .35)]]), ic => {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 1.5 * S; ctx.shadowOffsetY = 1 * S;
    for (const d of RARITY_PATHS[card.rarity]) ic.fill(new Path2D(d));
  });
  hexBadge(ctx, 16, 62, linear(ctx, 16, 62, 32, 36, 160, [[0, '#2a3142'], [1, '#0d111b']]), ic => finishIcon(ic, finish));
}

function hexBadge(ctx: CanvasRenderingContext2D, x: number, y: number, bg: Paint, drawIcon: (ctx: CanvasRenderingContext2D) => void) {
  ctx.save();
  ctx.beginPath();
  [[.5, 0], [1, .25], [1, .75], [.5, 1], [0, .75], [0, .25]].forEach(([u, v], i) => ctx[i ? 'lineTo' : 'moveTo'](x + u * 32, y + v * 36));
  ctx.closePath(); ctx.fillStyle = bg; ctx.fill();
  ctx.translate(x + 16 - 8.5, y + 18 - 8.5); ctx.scale(17 / 24, 17 / 24);
  drawIcon(ctx);
  ctx.restore();
}
function finishIcon(ctx: CanvasRenderingContext2D, finish: Finish) {
  if (finish === 'normal') { ctx.fillStyle = '#d9dee8'; ctx.beginPath(); rr(ctx, 5, 5, 14, 14, 2.5); ctx.fill(); return; }
  if (finish === 'glossy') {
    ctx.fillStyle = linear(ctx, 0, 0, 24, 24, 135, even(HOLO_ICON)); ctx.fill(new Path2D('M12 3 21.5 19.5h-19Z'));
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke(new Path2D('M12 3v16.5')); return;
  }
  ctx.fillStyle = linear(ctx, 0, 0, 24, 24, 135, [[0, '#fcf6ba'], [.45, '#bf953f'], [.7, '#fbf5b7'], [1, '#aa771c']]);
  ctx.fill(new Path2D('M7 4h10l4.5 5.2L12 20.5 2.5 9.2Z'));
  ctx.strokeStyle = 'rgba(70,40,0,.45)'; ctx.lineWidth = .9; ctx.stroke(new Path2D('M2.5 9.2h19M7 4l5 16.5M17 4l-5 16.5'));
}

function ringPath(ctx: CanvasRenderingContext2D) { ctx.beginPath(); rr(ctx, 0, 0, W0, H0, 20); rr(ctx, 6, 6, W0 - 12, H0 - 12, 14); }
function drawFrame(ctx: CanvasRenderingContext2D, finish: Finish, c: Palette) {
  ctx.save();
  if (finish === 'normal') {
    ringPath(ctx); ctx.fillStyle = linear(ctx, 0, 0, W0, H0, 160, [[0, c.f1], [.55, c.f2], [1, c.f3]]); ctx.fill('evenodd');
    ringPath(ctx); ctx.fillStyle = paperPattern(ctx); ctx.fill('evenodd');
    insetRing(ctx, 0, 0, W0, H0, 20, 1, 'rgba(90,75,50,.18)');
  } else if (finish === 'glossy') {
    // .holo-preview-frame : bordure 4 couleurs, jointures à 45°
    const sides: [string, [number, number][]][] = [
      ['#bcdff3', [[0, 0], [W0, 0], [W0 - 40, 40], [40, 40]]],
      ['#d6c5ec', [[W0, 0], [W0, H0], [W0 - 40, H0 - 40], [W0 - 40, 40]]],
      ['#f1e1b8', [[W0, H0], [0, H0], [40, H0 - 40], [W0 - 40, H0 - 40]]],
      ['#b9dfd1', [[0, H0], [0, 0], [40, 40], [40, H0 - 40]]],
    ];
    for (const [col, poly] of sides) {
      ctx.save(); ctx.beginPath(); poly.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath(); ctx.clip();
      ringPath(ctx); ctx.fillStyle = col; ctx.fill('evenodd'); ctx.restore();
    }
    insetRing(ctx, 6, 6, W0 - 12, H0 - 12, 14, 1, 'rgba(255,255,255,.65)');
    insetRing(ctx, 6, 6, W0 - 12, H0 - 12, 14, 2, 'rgba(123,131,147,.28)');
  } else {
    ringPath(ctx); ctx.fillStyle = linear(ctx, 0, -H0 / 2, W0 * 2, H0 * 2, 135, even(c.metal)); ctx.fill('evenodd');
    insetRing(ctx, 0, 0, W0, H0, 20, 1, 'rgba(255,248,210,.55)');
    insetRing(ctx, 0, 0, W0, H0, 20, 2, 'rgba(90,55,5,.35)');
  }
  ctx.restore();
}
