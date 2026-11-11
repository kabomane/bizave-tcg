import React, { useEffect, useRef, useState } from "react";

/* Bizave TCG — deux pistes de boosters en volume : sachet relief et bloc acrylique.
   CSS 3D uniquement, aucune librairie. Pas de manipulation au doigt : le paquet
   oscille doucement tout seul (coupé si « réduire les animations » est actif).
   Chaque piste lit les quatre couleurs de artwork.colors ; l’emblème est un emoji par booster.

   ── Note pour les devs : nombre de cartes affichées à l'ouverture ─────────────
   Deux réglages se combinent :
     • booster.cardsPerPack     → donnée existante de BoosterDefinition
                                   (src/data/boosters.ts, src/data/christmas.ts).
                                   5 pour tous les boosters, 1 pour merry xmas.
     • design.maxVisibleCards   → plafond propre à chaque piste de paquet :
                                   sachet relief = 3, bloc acrylique = 5.
   Nombre affiché = min(cardsPerPack, maxVisibleCards), au moins 1
   (voir visibleCardCount). Exemples : Memory Frame en sachet → 3 ;
   Memory Frame en bloc → 5 ; merry xmas → 1 dans les deux pistes.

   L'éventail est recalculé à partir de ce nombre (voir fanOffsets) : la carte
   du milieu reste droite et centrée, les autres s'écartent symétriquement avec
   le même pas, quel que soit le total. Aucun CSS à toucher.

   Intégration conseillée dans le jeu : ajouter une prop au composant
   BoosterPack, par ex. <BoosterPack booster={b} visibleCards={n} />, avec n
   calculé par visibleCardCount(booster, design). Pour changer le plafond d'une
   piste, modifier uniquement maxVisibleCards dans DESIGNS.

   ── Note pour les devs : version à plat pour la boutique ─────────────────────
   <FlatPack> rend exactement la face avant du paquet 3D (mêmes composants
   SachetFace / BlocFace, mêmes classes CSS), sans perspective, sans rotation
   ni flottement, à la même taille W × H. Rien n'est redessiné : une retouche
   de la face avant s'applique aux deux versions.

   La section « En boutique » reprend la structure de la boutique du dépôt
   (PermanentBoosterShop → BoosterCarousel → ShopCarousel + ShopBuyButton) :
   titre de section avec filet et « Taux de drop », carrousel à défilement
   natif (scroll-snap), flèches, points, puis un bouton d'achat unique de la
   largeur du paquet qui suit le booster sélectionné (prix, puis « Ajouté »
   pendant 1,6 s).

   Intégration conseillée : une prop sur BoosterPack, par ex.
   <BoosterPack booster={b} flat />, utilisée dans les « .pack-preview »
   de la boutique (PermanentBoosterShop et ShopPage) ; la page Vos boosters
   garde la version en volume. Les prix affichés ici sont ceux de
   src/data/boosters.ts (lucky boost : prix d'exemple, il est tiré chaque
   semaine).
   ─────────────────────────────────────────────────────────────────────────── */

const W = 200, H = 300;

// count = taille réelle de la pool (src/data/pools/*.json, sources dynamiques
// calculées depuis le catalogue). lucky boost : pool tirée chaque semaine (40 à 80),
// valeur d'exemple ici.
const BOOSTERS = [
  { id: "phantom-blood", title: "Memory Frame", price: 70, rates: "Commune 57 % · Peu commune 24 % · Rare 12 % · Épique 5 % · Légendaire 2 %", cardsPerPack: 5, count: 190, emoji: "🎞️", c: { p: "#641e2c", s: "#170f15", sh: "#e9dcc6", g: "#a83b4c" } },
  { id: "anima-isekai", title: "Anima Isekai", price: 50, rates: "Commune 57 % · Peu commune 24 % · Rare 12 % · Épique 5 % · Légendaire 2 %", cardsPerPack: 5, count: 143, emoji: "⛩️", c: { p: "#34224e", s: "#121426", sh: "#e7d9be", g: "#7562b5" } },
  { id: "epico-stellari", title: "epico stellari", price: 700, rates: "Épique 91 % · Légendaire 9 %", cardsPerPack: 5, count: 57, emoji: "🌟", c: { p: "#be9bef", s: "#21122f", sh: "#e3c17c", g: "#e3c17c" } },
  { id: "rarity-only", title: "rarity only", price: 400, rates: "Rare 100 %", cardsPerPack: 5, count: 62, emoji: "💎", c: { p: "#87b9f0", s: "#101f39", sh: "#c9dffc", g: "#87b9f0" } },
  { id: "weekly-mystery", title: "lucky boost", price: 120, rates: "Taux tirés chaque semaine", cardsPerPack: 5, count: 64, emoji: "🍀", c: { p: "#446658", s: "#15271f", sh: "#e5d6aa", g: "#8bad8a" } },
  { id: "christmas-gift", title: "merry xmas", price: 50, rates: "Commune 33 % · Peu commune 24 % · Rare 19 % · Épique 14 % · Légendaire 10 %", cardsPerPack: 1, count: 20, emoji: "🎁", c: { p: "#a4373e", s: "#102f26", sh: "#f5dba2", g: "#407c57" } },
];

const DESIGNS = [
  {
    id: "sachet", name: "Sachet relief", maxVisibleCards: 3,
    idea: "Le sachet actuel passé en volume : soudures crantées, flancs pincés, dos avec sa couture et un reflet qui glisse avec l’oscillation.",
    open: "La soudure du haut s’arrache, puis les dos de cartes montent.",
    plus: "Continuité totale avec la DA actuelle ; le moins coûteux à intégrer.",
    minus: "Reste la piste la plus classique des deux.",
  },
  {
    id: "bloc", name: "Bloc acrylique", maxVisibleCards: 5,
    idea: "Les cartes scellées dans un bloc transparent, étiquette en tête avec le nombre de cartes de la pool.",
    open: "La plaque avant se détache et les cartes sortent en éventail.",
    plus: "Très « objet de collection » ; la pile visible annonce le contenu.",
    minus: "Plus de calques transparents : à tester sur un ancien iPhone.",
  },
];

const CSS = `
.bz{--page:#141114;--ink:#f1e8da;--muted:#b3a89c;--line:rgba(255,255,255,.12);
  min-height:100vh;background:radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--g) 22%,var(--page)),var(--page) 70%);
  color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  padding:max(20px,env(safe-area-inset-top)) 0 max(28px,env(safe-area-inset-bottom));-webkit-text-size-adjust:100%;transition:background .5s}
.bz *{box-sizing:border-box}
.bz-wrap{max-width:480px;margin:0 auto}
.bz h1{font:400 30px/1.05 Georgia,"Times New Roman",serif;letter-spacing:-.04em;margin:0 20px 6px}
.bz h1 em{color:var(--g);font-style:italic;filter:brightness(1.3)}
.bz-lead{margin:0 20px 16px;color:var(--muted);font-size:16px}
.bz-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:0 20px 4px;padding:4px;border-radius:26px;background:rgba(255,255,255,.06);border:1px solid var(--line)}
.bz-seg button{min-height:44px;border-radius:22px;border:0;background:transparent;color:var(--ink);font-family:inherit;font-size:16px;cursor:pointer}
.bz-seg button[aria-pressed="true"]{background:var(--ink);color:#1a1518;font-weight:600}
.bz-row{display:flex;gap:8px;overflow-x:auto;padding:4px 20px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.bz-row::-webkit-scrollbar{display:none}
.bz-chip{flex:0 0 auto;min-height:44px;padding:0 16px;border-radius:22px;border:1px solid var(--line);background:rgba(255,255,255,.04);
  color:var(--ink);font-family:inherit;font-size:16px;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
.bz-chip[aria-pressed="true"]{background:var(--ink);color:#1a1518;border-color:var(--ink)}
.bz-chip i{width:14px;height:14px;border-radius:50%;border:1px solid rgba(255,255,255,.35)}
.bz-stage{position:relative;height:430px;perspective:1100px;overflow:hidden}
.bz-floor{position:absolute;left:50%;bottom:30px;width:220px;height:28px;margin-left:-110px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.6),transparent);filter:blur(4px);animation:bzShadow 12s ease-in-out infinite}
.bz-lift{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.2,.75,.2,1)}
.bz-lift.is-open{transform:translateY(34px)}
.bz-obj{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;margin:${-H / 2 - 10}px 0 0 ${-W / 2}px;
  transform-style:preserve-3d;animation:bzFloat 12s ease-in-out infinite}
@keyframes bzFloat{
  0%,100%{transform:translateY(0) rotateX(4deg) rotateY(-16deg)}
  50%{transform:translateY(-3px) rotateX(3deg) rotateY(-12deg)}}
@keyframes bzShadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.97);opacity:.92}}
@keyframes bzSheen{0%,100%{background-position:70% 0}50%{background-position:40% 0}}
.bz-box{position:absolute;transform-style:preserve-3d}
.bz-face{position:absolute;left:0;top:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.bz-crinkle,.bz-pillow,.bz-sheen-foil,.bz-glint{position:absolute;inset:0;pointer-events:none}
/* Froissé de l'alu : relief de bruit éclairé, fusionné en overlay. */
.bz-crinkle{background-size:100% 100%;mix-blend-mode:overlay;opacity:.42}
/* Reflet métallisé : plusieurs bandes douces teintées par la couleur du booster. */
.bz-sheen-foil{mix-blend-mode:screen;background-size:240% 100%;animation:bzSheen 12s ease-in-out infinite;
  background-image:linear-gradient(100deg,transparent 18%,color-mix(in srgb,var(--sh) 14%,transparent) 30%,transparent 38%,
    color-mix(in srgb,var(--sh) 7%,transparent) 47%,transparent 53%,color-mix(in srgb,var(--sh) 20%,transparent) 63%,
    color-mix(in srgb,var(--sh) 4%,transparent) 68%,transparent 76%)}
/* Bombé du sachet : plus sombre près des soudures et des bords. */
.bz-pillow{background:linear-gradient(180deg,rgba(0,0,0,.42),transparent 13% 87%,rgba(0,0,0,.48)),
  linear-gradient(90deg,rgba(0,0,0,.28),transparent 9% 91%,rgba(0,0,0,.32)),
  radial-gradient(ellipse 70% 52% at 50% 46%,rgba(255,255,255,.05),transparent 70%)}
/* Acrylique : arête nette et éclat fin, pas de grande bande. */
.bz-glint{mix-blend-mode:screen;background-size:250% 100%;animation:bzSheen 12s ease-in-out infinite;
  background-image:linear-gradient(116deg,transparent 42%,rgba(255,255,255,.04) 45%,rgba(255,255,255,.42) 46.6%,rgba(255,255,255,.1) 47.6%,transparent 50%,
    transparent 54%,rgba(255,255,255,.16) 55%,transparent 56.4%)}
.bz-word{position:absolute;left:10%;right:10%;text-align:center;font:400 27px/.95 Georgia,"Times New Roman",serif;
  text-transform:uppercase;letter-spacing:-.01em;color:var(--sh)}
.bz-word small{display:block;margin-top:10px;font:500 10px/1 -apple-system,system-ui,sans-serif;letter-spacing:.24em;opacity:.72}
.bz-foiltext{background:linear-gradient(120deg,var(--sh),color-mix(in srgb,var(--sh) 55%,#7a6850) 42%,#fff 62%,var(--sh));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.bz-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;line-height:1;
  font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.bz-move{transition:transform .7s cubic-bezier(.2,.75,.2,1),opacity .5s}
.bz-shape{transition:clip-path .45s cubic-bezier(.2,.75,.2,1)}
.bz-cb{position:absolute;border-radius:9px;border:1px solid color-mix(in srgb,var(--sh) 55%,transparent);
  background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--g) 45%,var(--s)),color-mix(in srgb,var(--p) 24%,var(--s)) 62%,var(--s));
  color:var(--sh);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 0 0 1px rgba(0,0,0,.5)}
.bz-cb:before{content:"";position:absolute;inset:8px;border:1px solid color-mix(in srgb,var(--sh) 35%,transparent);border-radius:5px}
.bz-cb b{font:400 50px/1 Georgia,serif}
.bz-cb span{font:500 9px/1 -apple-system,system-ui,sans-serif;letter-spacing:.34em}
/* Sachet */
.bz-foil{background:radial-gradient(ellipse at 78% 14%,color-mix(in srgb,var(--g) 26%,transparent),transparent 55%),
  linear-gradient(100deg,rgba(0,0,0,.42),transparent 16% 84%,rgba(0,0,0,.5)),
  linear-gradient(165deg,color-mix(in srgb,var(--p) 46%,var(--s)),var(--s) 62%,color-mix(in srgb,var(--p) 30%,var(--s)))}
.bz-inner{position:absolute;inset:34px 16px;border:1px solid color-mix(in srgb,var(--sh) 26%,transparent)}
.bz-inner:before,.bz-inner:after{content:"";position:absolute;left:50%;width:6px;height:6px;margin-left:-3px;transform:rotate(45deg);
  border:1px solid color-mix(in srgb,var(--sh) 55%,transparent);background:var(--s)}
.bz-inner:before{top:-4px}.bz-inner:after{bottom:-4px}
.bz-crimp{position:absolute;left:0;right:0;height:24px;z-index:3;
  background:repeating-linear-gradient(90deg,rgba(0,0,0,.55) 0 1px,rgba(255,255,255,.2) 1px 2px,transparent 2px 4px),
  linear-gradient(color-mix(in srgb,var(--sh) 46%,var(--s)),color-mix(in srgb,var(--p) 30%,var(--s)))}
.bz-side-foil{background:linear-gradient(90deg,rgba(0,0,0,.65),color-mix(in srgb,var(--p) 36%,var(--s)) 50%,rgba(0,0,0,.65));clip-path:ellipse(50% 50% at 50% 50%)}
.bz-seam{position:absolute;left:50%;top:24px;bottom:24px;width:16px;margin-left:-8px;
  background:linear-gradient(90deg,rgba(0,0,0,.4),rgba(255,255,255,.1) 45%,rgba(0,0,0,.45))}
/* Bloc */
.bz-glass{backface-visibility:visible;-webkit-backface-visibility:visible;border:1px solid rgba(255,255,255,.4);border-radius:5px;
  background:linear-gradient(120deg,rgba(255,255,255,.09),rgba(255,255,255,.015) 30% 72%,rgba(255,255,255,.06));
  box-shadow:inset 1px 1px rgba(255,255,255,.55),inset -1px -1px rgba(255,255,255,.18),inset 0 0 16px rgba(255,255,255,.06)}
.bz-glass-edge{background:linear-gradient(90deg,rgba(255,255,255,.3),rgba(255,255,255,.05) 35% 65%,rgba(255,255,255,.2));border:1px solid rgba(255,255,255,.3)}
.bz-label{position:absolute;z-index:1;left:9px;right:9px;top:9px;height:60px;border-radius:3px;padding:0 12px;
  display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--sh);
  background:linear-gradient(120deg,color-mix(in srgb,var(--p) 70%,var(--s)),var(--s));border:1px solid color-mix(in srgb,var(--sh) 45%,transparent)}
.bz-label strong{display:block;font:400 15px/1 Georgia,serif;text-transform:uppercase;white-space:nowrap}
.bz-label small{display:block;margin-top:7px;font:500 8px/1 -apple-system,system-ui,sans-serif;letter-spacing:.18em;opacity:.78;white-space:nowrap}
.bz-plinth{position:absolute;z-index:1;left:9px;right:9px;bottom:9px;height:20px;border-radius:2px;display:flex;align-items:center;justify-content:center;
  font:500 8px/1 -apple-system,system-ui,sans-serif;letter-spacing:.3em;color:var(--sh);
  background:linear-gradient(90deg,color-mix(in srgb,var(--p) 50%,var(--s)),var(--s));border:1px solid color-mix(in srgb,var(--sh) 30%,transparent)}
/* Boutique : version à plat */
.bz-flat{position:relative;flex:0 0 auto;filter:drop-shadow(0 15px 18px rgba(0,0,0,.35))}
.bz-flat-face{position:absolute;inset:0;overflow:hidden}
.bz-shop{margin:34px 0 0}
.bz-shop-heading{display:flex;align-items:center;gap:12px;margin:0 20px}
.bz-shop-heading h2{margin:0;font-size:16px;font-weight:500;color:var(--muted);white-space:nowrap}
.bz-shop-heading:after{content:"";order:1;flex:1;height:1px;background:var(--line)}
.bz-rates{order:2;min-height:44px;padding:0;border:0;background:transparent;color:var(--muted);font-family:inherit;font-size:16px;white-space:nowrap;cursor:pointer}
.bz-rates-text{margin:4px 20px 0;font-size:16px;color:var(--ink)}
.bz-shop-stage{display:flex;flex-direction:column;align-items:center;gap:22px;padding:8px 0 12px}
.bz-carousel{position:relative;width:100%}
.bz-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none}
.bz-track::-webkit-scrollbar{display:none}
.bz-slide{flex:0 0 100%;display:flex;justify-content:center;padding:16px 46px 30px;scroll-snap-align:center;scroll-snap-stop:always}
.bz-arrow{position:absolute;top:calc(50% - 28px);width:44px;height:44px;border-radius:50%;border:1px solid var(--line);
  background:color-mix(in srgb,var(--page) 50%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  color:var(--ink);font-size:16px;display:grid;place-items:center;cursor:pointer}
.bz-arrow.prev{left:14px}.bz-arrow.next{right:14px}
.bz-arrow:disabled{opacity:.3;cursor:default}
.bz-dots{display:flex;justify-content:center;gap:7px;min-height:16px;align-items:center}
.bz-dots span{width:7px;height:7px;border-radius:50%;background:var(--muted);opacity:.32;transition:transform .2s,opacity .2s}
.bz-dots .is-current{background:var(--ink);opacity:1;transform:scale(1.45)}
.bz-buy{min-height:48px;border-radius:18px;border:1px solid color-mix(in srgb,var(--ink) 22%,transparent);background:transparent;color:var(--ink);
  font-family:inherit;font-size:16px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer}
.bz-buy.is-purchased{color:var(--g);border-color:color-mix(in srgb,var(--g) 45%,transparent);filter:brightness(1.35)}
.bz-price{display:inline-flex;align-items:center;gap:6px;padding-left:10px;border-left:1px solid var(--line)}
.bz-panel{margin:6px 20px 0;padding:18px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.04)}
.bz-panel h2{font:400 24px/1.1 Georgia,serif;letter-spacing:-.03em;margin:0 0 10px}
.bz-panel dl{margin:0;display:grid;gap:12px}
.bz-panel dt{font-size:16px;color:var(--g);font-weight:600;filter:brightness(1.35)}
.bz-panel dd{margin:2px 0 0;font-size:16px}
.bz-cta{display:flex;gap:10px;margin:0 20px 14px}
.bz-btn{flex:1;min-height:52px;border-radius:26px;border:0;background:var(--ink);color:#1a1518;font-family:inherit;font-size:17px;font-weight:600;cursor:pointer}
.bz-btn.ghost{flex:0 0 auto;padding:0 18px;background:transparent;color:var(--ink);border:1px solid var(--line)}
.bz-note{margin:16px 20px 0;color:var(--muted);font-size:16px}
@media (prefers-reduced-motion:reduce){
  .bz-obj,.bz-floor,.bz-sheen-foil,.bz-glint{animation:none}
  .bz-obj{transform:rotateX(4deg) rotateY(-14deg)}
  .bz-move,.bz-lift,.bz-shape{transition:none}}
`;

function Emblem({ emoji, size = 110, ring = true, style }) {
  return (
    <div aria-hidden="true" style={{ position: "relative", width: size, height: size, flex: "0 0 auto", ...style }}>
      {ring && <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke="currentColor" style={{ position: "absolute", inset: 0 }}>
        <circle cx="50" cy="50" r="46" strokeWidth=".8" opacity=".55" /><circle cx="50" cy="50" r="40" strokeWidth=".8" strokeDasharray="1 5" opacity=".7" />
        <path d="M50 2 53 7 50 12 47 7ZM50 88 53 93 50 98 47 93Z" fill="currentColor" stroke="none" />
      </svg>}
      <span className="bz-emoji" style={{ fontSize: Math.round(size * (ring ? 0.42 : 0.72)) }}>{emoji}</span>
    </div>
  );
}

const zig = (top) => {
  const n = 20, pts = [];
  for (let i = 0; i <= n; i++) pts.push(`${(i * 100) / n}% ${top ? (i % 2 ? 14 : 0) : (i % 2 ? 86 : 100)}%`);
  return top ? `polygon(${pts.join(",")},100% 100%,0 100%)` : `polygon(0 0,100% 0,${pts.reverse().join(",")})`;
};
const ZIG_TOP = zig(true), ZIG_BOTTOM = zig(false);

// Silhouette du sachet : les dents sont découpées dans la face elle-même,
// donc plus rien ne dépasse derrière les soudures. À l'ouverture, le bord
// du haut descend sous la soudure arrachée (même nombre de points, la
// transition reste fluide).
const TEETH = 20, TOOTH = 3.5;
function outline(topY) {
  const top = [], bottom = [];
  for (let i = 0; i <= TEETH; i++) {
    const x = (i * 100) / TEETH;
    top.push(`${x}% ${topY + (i % 2 ? TOOTH : 0)}px`);
    bottom.push(`${100 - x}% calc(100% - ${i % 2 ? TOOTH : 0}px)`);
  }
  return `polygon(${[...top, ...bottom].join(",")})`;
}
const SHAPE_CLOSED = outline(0), SHAPE_TORN = outline(22);

const CRINKLE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.045 0.008' numOctaves='3' seed='7'/><feDiffuseLighting lighting-color='#fff' surfaceScale='2.4'><feDistantLight azimuth='235' elevation='42'/></feDiffuseLighting></filter><rect width='200' height='300' filter='url(#f)'/></svg>`
)}")`;
const Foil = () => <><div className="bz-crinkle" style={{ backgroundImage: CRINKLE }} /><div className="bz-sheen-foil" /><div className="bz-pillow" /></>;

function Box({ w, h, d, faces, children }) {
  const place = {
    front: { width: w, height: h, transform: `translateZ(${d / 2}px)` },
    back: { width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` },
    right: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)` },
    left: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)` },
    top: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)` },
    bottom: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)` },
  };
  return (
    <div className="bz-box" style={{ width: w, height: h }}>
      {children}
      {Object.keys(place).map(key => faces[key] && (
        <div key={key} className={`bz-face ${faces[key].className || ""}`} style={{ ...place[key], ...faces[key].style }}>{faces[key].children}</div>
      ))}
    </div>
  );
}

/** Cartes visibles à l'ouverture : cardsPerPack du booster, plafonné par la piste. */
export function visibleCardCount(booster, design) {
  return Math.max(1, Math.min(booster.cardsPerPack, design.maxVisibleCards));
}

/** Positions centrées pour n cartes : n = 3 → [-1, 0, 1] ; n = 4 → [-1.5, -0.5, 0.5, 1.5]. */
const fanOffsets = (n) => Array.from({ length: n }, (_, i) => i - (n - 1) / 2);

const CardBack = ({ style }) => <div className="bz-cb bz-move" style={style}><b>B</b><span>BIZAVE</span></div>;

function Word({ b, style }) {
  const [first, ...rest] = b.title.split(" ");
  return <div className="bz-word" style={style}><span className="bz-foiltext">{first}{rest.length > 0 && <><br />{rest.join(" ")}</>}</span><small>{b.count} cartes</small></div>;
}

/* Face avant du sachet, partagée par la version en volume et la version à plat. */
function SachetFace({ b, open = false }) {
  return <>
    <Foil />
    <div className="bz-crimp bz-move" style={{ top: 0, clipPath: ZIG_TOP, transformOrigin: "0 100%", ...(open ? { transform: "translate(18px,-52px) rotate(-16deg)", opacity: 0 } : null) }} />
    <div className="bz-crimp" style={{ bottom: 0, clipPath: ZIG_BOTTOM }} />
    <div className="bz-inner" />
    <Emblem emoji={b.emoji} size={128} style={{ position: "absolute", left: 36, top: 50 }} />
    <Word b={b} style={{ bottom: 50 }} />
  </>;
}

/* Face avant du bloc acrylique, partagée elle aussi. L'éclat passe sous
   l'étiquette et le socle, qui sont opaques : seul le bloc brille. */
function BlocFace({ b }) {
  return <>
    <div className="bz-glint" />
    <div className="bz-label"><div><strong>{b.title}</strong><small>{b.count} CARTES · SCELLÉ</small></div><Emblem emoji={b.emoji} size={34} ring={false} /></div>
    <div className="bz-plinth">BIZAVE · TCG</div>
  </>;
}
const BLOC_CARD = { left: 22, top: 78, width: W - 44, height: H - 116 };

function Sachet({ b, open, cards }) {
  const d = 18, shape = { color: b.c.sh, clipPath: open ? SHAPE_TORN : SHAPE_CLOSED };
  return (
    <Box w={W} h={H} d={d} faces={{
      front: { className: "bz-foil bz-shape", style: shape, children: <SachetFace b={b} open={open} /> },
      back: { className: "bz-foil bz-shape", style: shape, children: <><Foil /><div className="bz-crimp bz-move" style={{ top: 0, clipPath: ZIG_TOP, ...(open ? { opacity: 0 } : null) }} /><div className="bz-crimp" style={{ bottom: 0, clipPath: ZIG_BOTTOM }} /><div className="bz-seam" /><Emblem emoji={b.emoji} size={46} ring={false} style={{ position: "absolute", left: 77, top: 64, opacity: .8 }} /><div className="bz-word" style={{ bottom: 64, fontSize: 17 }}>{b.count} cartes<small>BIZAVE · TCG</small></div></> },
      left: { className: "bz-side-foil", style: { top: 24, height: H - 48 } },
      right: { className: "bz-side-foil", style: { top: 24, height: H - 48 } },
    }}>
      {fanOffsets(cards).map((i, k) => (
        <CardBack key={k} style={{
          left: 18, top: 24, width: W - 36, height: H - 48, opacity: open ? 1 : 0,
          transform: open ? `translate3d(${i * 20}px,${-84 + Math.abs(i) * 12}px,${i}px) rotateZ(${i * 7}deg)` : `translate3d(0,0,${i}px)`,
          transitionDelay: open ? `${0.12 + k * 0.06}s` : "0s",
        }} />
      ))}
    </Box>
  );
}

function Bloc({ b, open, cards }) {
  const d = 34, edge = { className: "bz-glass-edge" };
  return (
    <Box w={W} h={H} d={d} faces={{
      front: { className: "bz-glass bz-move", style: open ? { transform: `translate3d(0,-26px,${d / 2 + 70}px) rotateX(18deg)`, opacity: 0 } : null, children: <BlocFace b={b} /> },
      back: { className: "bz-glass" }, left: edge, right: edge, top: edge, bottom: edge,
    }}>
      {fanOffsets(cards).map((i, k) => (
        <CardBack key={k} style={{
          ...BLOC_CARD,
          transform: open ? `translate3d(${i * 22}px,${-78 + Math.abs(i) * 10}px,${i * 4 + 30}px) rotateZ(${i * 6}deg)` : `translateZ(${i * 4}px)`,
          transitionDelay: open ? `${0.1 + k * 0.04}s` : "0s",
        }} />
      ))}
    </Box>
  );
}

const RENDER = { sachet: Sachet, bloc: Bloc };

/* Version à plat pour la boutique : même face avant, même taille, aucune 3D. */
function FlatPack({ b, designId }) {
  const vars = { "--p": b.c.p, "--s": b.c.s, "--sh": b.c.sh, "--g": b.c.g, width: W, height: H };
  return (
    <div className="bz-flat" style={vars} role="img" aria-label={`Booster ${b.title}, ${b.count} cartes`}>
      {designId === "sachet"
        ? <div className="bz-flat-face bz-foil" style={{ color: b.c.sh, clipPath: SHAPE_CLOSED }}><SachetFace b={b} /></div>
        : <div className="bz-flat-face bz-glass"><CardBack style={BLOC_CARD} /><BlocFace b={b} /></div>}
    </div>
  );
}

const Gem = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9Z" /><path d="M11 3 8 9l4 13 4-13-3-6" /><path d="M2 9h20" /></svg>;
const Chevron = ({ left }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={left ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>;

/* Section boutique : même structure que PermanentBoosterShop dans le dépôt. */
function ShopSection({ designId }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [showRates, setShowRates] = useState(false);
  const [purchasedId, setPurchasedId] = useState(null);
  const booster = BOOSTERS[index];
  useEffect(() => {
    if (!purchasedId) return;
    const timer = setTimeout(() => setPurchasedId(null), 1600);
    return () => clearTimeout(timer);
  }, [purchasedId]);
  const go = (next) => {
    const el = track.current;
    if (!el || next < 0 || next >= BOOSTERS.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };
  const purchased = purchasedId === booster.id;
  return (
    <section className="bz-shop" aria-labelledby="bz-shop-title">
      <div className="bz-shop-heading"><h2 id="bz-shop-title">En boutique</h2><button type="button" className="bz-rates" aria-expanded={showRates} onClick={() => setShowRates(value => !value)}>Taux de drop</button></div>
      {showRates && <p className="bz-rates-text">{booster.title} : {booster.rates}</p>}
      <div className="bz-shop-stage">
        <div className="bz-carousel" role="region" aria-roledescription="carrousel" aria-label="Choisir un booster">
          <div ref={track} className="bz-track" onScroll={event => {
            const el = event.currentTarget;
            const next = Math.max(0, Math.min(BOOSTERS.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
            if (next !== index) { setIndex(next); setPurchasedId(null); }
          }}>
            {BOOSTERS.map((item, i) => <div key={item.id} className="bz-slide" aria-hidden={i !== index}><FlatPack b={item} designId={designId} /></div>)}
          </div>
          <button type="button" className="bz-arrow prev" aria-label="Booster précédent" disabled={index === 0} onClick={() => go(index - 1)}><Chevron left /></button>
          <button type="button" className="bz-arrow next" aria-label="Booster suivant" disabled={index === BOOSTERS.length - 1} onClick={() => go(index + 1)}><Chevron /></button>
          <div className="bz-dots" aria-hidden="true">{BOOSTERS.map((item, i) => <span key={item.id} className={i === index ? "is-current" : ""} />)}</div>
        </div>
        <button type="button" className={`bz-buy ${purchased ? "is-purchased" : ""}`} style={{ width: W }} disabled={purchased} aria-label={purchased ? `${booster.title} ajouté` : `Acheter ${booster.title} pour ${booster.price} fragments`} onClick={() => setPurchasedId(booster.id)}>
          {purchased ? <>✓ Ajouté</> : <>Acheter <span className="bz-price">{booster.price} <Gem /></span></>}
        </button>
      </div>
    </section>
  );
}

export default function BoosterPistes() {
  const [designId, setDesignId] = useState("sachet");
  const [boosterId, setBoosterId] = useState("phantom-blood");
  const [open, setOpen] = useState(false);
  const design = DESIGNS.find(item => item.id === designId);
  const booster = BOOSTERS.find(item => item.id === boosterId);
  const Pack = RENDER[designId];
  const cards = visibleCardCount(booster, design);
  const vars = { "--p": booster.c.p, "--s": booster.c.s, "--sh": booster.c.sh, "--g": booster.c.g };

  return (
    <div className="bz" style={vars}>
      <style>{CSS}</style>
      <div className="bz-wrap">
        <h1>Boosters, <em>en volume</em></h1>
        <p className="bz-lead">Deux pistes retenues, mêmes couleurs que dans le jeu, un emoji par booster.</p>

        <div className="bz-seg" role="group" aria-label="Piste de design">
          {DESIGNS.map(item => (
            <button key={item.id} type="button" aria-pressed={item.id === designId} onClick={() => { setDesignId(item.id); setOpen(false); }}>{item.name}</button>
          ))}
        </div>

        <div className="bz-stage" role="img" aria-label={`${design.name}, ${booster.title}, ${booster.count} cartes`}>
          <div className="bz-floor" />
          <div className={`bz-lift ${open ? "is-open" : ""}`}>
            <div className="bz-obj"><Pack key={designId + booster.id} b={booster} open={open} cards={cards} /></div>
          </div>
        </div>

        <div className="bz-cta">
          <button type="button" className="bz-btn" onClick={() => setOpen(value => !value)}>{open ? "Refermer" : "Ouvrir"}</button>
        </div>

        <div className="bz-row" role="group" aria-label="Booster">
          {BOOSTERS.map(item => (
            <button key={item.id} type="button" className="bz-chip" aria-pressed={item.id === boosterId} onClick={() => { setBoosterId(item.id); setOpen(false); }}><i style={{ background: `linear-gradient(135deg,${item.c.p},${item.c.s})` }} />{item.title}</button>
          ))}
        </div>

        <section className="bz-panel">
          <h2>{design.name}</h2>
          <dl>
            <div><dt>L’idée</dt><dd>{design.idea}</dd></div>
            <div><dt>Ouverture</dt><dd>{design.open}</dd></div>
            <div><dt>Cartes affichées</dt><dd>{cards} pour {booster.title} : {booster.cardsPerPack} par paquet, {design.maxVisibleCards} au maximum pour cette piste.</dd></div>
            <div><dt>Pour</dt><dd>{design.plus}</dd></div>
            <div><dt>À surveiller</dt><dd>{design.minus}</dd></div>
          </dl>
        </section>
        <ShopSection designId={designId} />
        <p className="bz-note">Le nombre affiché correspond à la pool du booster (lucky boost : valeur d’exemple, la pool change chaque semaine). En jeu, il viendrait de la source du booster, comme le sous-titre actuel.</p>
      </div>
    </div>
  );
}
